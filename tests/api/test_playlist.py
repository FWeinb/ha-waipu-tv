"""M3U, HLS and XMLTV rendering."""

from datetime import UTC, datetime, timedelta

import pytest

from custom_components.waipu_tv.api import Channel, Program, ProgramDetails, Recording
from custom_components.waipu_tv.api.models import parse_program_details
from custom_components.waipu_tv.api.playlist import (
    render_m3u,
    render_recordings_m3u,
    render_xmltv,
    rewrite_hls,
    select_channels,
)

BASE = "http://ha:8123/api/waipu_tv"
EPG = f"{BASE}/epg.xml"


def ch(id, **kw):
    defaults = dict(
        name=id.upper(), number=1, logo="", favorite=False, visible=True, vod=False, hls=False
    )
    return Channel(id=id, **{**defaults, **kw})


ARD = ch("ard", hls=True, favorite=True)
PRO7 = ch("pro7")
HIDDEN = ch("hidden", visible=False)
VOD = ch("vodch", vod=True)
CHANNELS = [ARD, PRO7, HIDDEN, VOD]


def recording(id, title, **kw):
    defaults = dict(
        program_id=None,
        channel_id="ard",
        episode_title=None,
        status="FINISHED",
        start=None,
        duration=timedelta(0),
        group=None,
        image=None,
        season=None,
        episode=None,
    )
    return Recording(id=id, title=title, **{**defaults, **kw})


@pytest.mark.parametrize(
    ("kwargs", "ids"),
    [
        ({}, ["ard", "pro7", "vodch"]),
        ({"hidden": True}, ["ard", "pro7", "hidden", "vodch"]),
        ({"selection": "favorites"}, ["ard"]),
        ({"selection": "live"}, ["ard", "pro7"]),
        ({"selection": "vod"}, ["vodch"]),
        ({"drm": False}, ["ard"]),
    ],
)
def test_select_channels(kwargs, ids):
    assert [c.id for c in select_channels(CHANNELS, **kwargs)] == ids


def test_bad_filter():
    with pytest.raises(ValueError):
        select_channels(CHANNELS, "nope")


def test_hls_and_dash_entries():
    m3u = render_m3u([ARD, PRO7], BASE, "k", EPG)

    assert f'url-tvg="{EPG}?key=k"' in m3u
    assert 'group-title="Favoriten;Live TV",ARD' in m3u
    assert f"{BASE}/stream/ard.m3u8?key=k" in m3u
    assert f"{BASE}/stream/pro7.mpd?key=k" in m3u
    assert f"#KODIPROP:inputstream.adaptive.license_key={BASE}/license?key=k||R{{SSM}}|" in m3u
    assert (
        f"#KODIPROP:inputstream.adaptive.drm_legacy=com.widevine.alpha|{BASE}/license?key=k" in m3u
    )
    # DRM properties belong to the DASH channel only
    assert "KODIPROP" not in m3u.split("#EXTINF")[1]


def test_hls_proxy_option():
    assert "/stream/ard.m3u8?key=k\n" in render_m3u([ARD], BASE, "k", EPG)
    assert "/stream/ard.m3u8?proxy=1&key=k\n" in render_m3u([ARD], BASE, "k", EPG, hls_proxy=True)
    m3u = render_m3u([ARD, PRO7], BASE, "k", EPG, hls_proxy=False)
    assert "/stream/ard.m3u8?proxy=0&key=k\n" in m3u
    assert "/stream/pro7.mpd?key=k\n" in m3u  # DASH unaffected


def test_catchup_and_timeshift():
    m3u = render_m3u([ARD, PRO7, VOD], BASE, "k", EPG, timeshift=True, catchup=True)

    assert (
        'catchup="default" catchup-days="1" '
        f'catchup-source="{BASE}/stream/ard.m3u8?start={{utc}}&key=k"'
    ) in m3u
    assert f"\n{BASE}/stream/ard.m3u8?timeshift=1&key=k\n" in m3u
    assert f"\n{BASE}/stream/pro7.mpd?timeshift=1&key=k\n" in m3u
    vod_block = m3u.split("#EXTINF")[3]
    assert "catchup" not in vod_block  # on-demand channels have no restart
    assert "/stream/vodch.mpd?key=k" in vod_block
    assert "catchup" not in render_m3u([ARD], BASE, "k", EPG)


def test_force_protocol():
    assert f"{BASE}/stream/ard.mpd" in render_m3u([ARD], BASE, "k", EPG, protocol="dash")


def test_recordings():
    m3u = render_recordings_m3u(
        [
            recording(
                "12/3",
                "Tatort",
                episode_title="Ende",
                season="1",
                episode="2",
                duration=timedelta(minutes=90),
                start=datetime(2026, 11, 1, 20, 15, tzinfo=UTC),
                group=7,
                image="http://img/480x270.jpg",
            ),
            recording("9", "News, live", duration=timedelta(minutes=15)),
        ],
        BASE,
        "k",
    )

    assert (
        '#EXTINF:5400 tvg-logo="http://img/480x270.jpg" group-title="Tatort",'
        "Tatort S1E2 – Ende (2026-11-01)"
    ) in m3u
    assert f"{BASE}/recording/12%2F3.mpd?key=k" in m3u
    assert 'group-title="Aufnahmen",News  live' in m3u
    assert "license_type=com.widevine.alpha" in m3u
    hls = render_recordings_m3u([recording("9", "News")], BASE, "k", protocol="hls")
    assert "/recording/9.m3u8" in hls
    assert "KODIPROP" not in hls


def test_master_playlist_proxies_variants():
    master = (
        "#EXTM3U\n"
        '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",URI="audio/de.m3u8"\n'
        "#EXT-X-STREAM-INF:BANDWIDTH=1\n"
        "720p/index.m3u8?t=1\n"
    )
    out = rewrite_hls(master, "https://cdn/x/master.m3u8?tok=1", lambda u: f"P({u})")

    assert 'URI="P(https://cdn/x/audio/de.m3u8)"' in out
    assert "P(https://cdn/x/720p/index.m3u8?t=1)" in out


def test_media_playlist_keeps_segments_direct():
    media = '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:2,\nseg1.ts\n'
    out = rewrite_hls(media, "https://cdn/x/720p/index.m3u8", lambda u: f"P({u})")

    assert 'URI="https://cdn/x/720p/init.mp4"' in out
    assert "\nhttps://cdn/x/720p/seg1.ts\n" in out
    assert "P(" not in out


def test_xmltv():
    start = datetime(2026, 11, 14, 19, tzinfo=UTC)
    program = Program(
        id="1",
        channel_id="ard",
        title="Tagesschau & Wetter",
        episode_title="Spezial",
        genre="Nachrichten",
        start=start,
        stop=start + timedelta(minutes=15),
        image="http://img/1.jpg",
        series_id=None,
        recordable=True,
    )

    xml = render_xmltv([(ARD, [program])])

    assert '<channel id="ard"><display-name>ARD</display-name></channel>' in xml
    assert 'start="20261114190000 +0000" stop="20261114191500 +0000" channel="ard"' in xml
    assert "<title>Tagesschau &amp; Wetter</title>" in xml
    assert "<sub-title>Spezial</sub-title>" in xml
    assert "<category>Nachrichten</category>" in xml
    assert '<icon src="http://img/1.jpg"/>' in xml
    assert "<desc>" not in xml


def test_xmltv_details():
    start = datetime(2026, 11, 14, 22, tzinfo=UTC)
    program = Program(
        id="p1",
        channel_id="zdf",
        title="heute-show",
        episode_title=None,
        genre="Comedy",
        start=start,
        stop=start + timedelta(minutes=30),
        image="http://img/1.jpg",
        series_id="4711",
        recordable=True,
    )
    details = ProgramDetails(
        description="Satire & mehr",
        year="2026",
        season="28",
        episode="12",
        cast=(("Oliver Welke", "Moderation"), ("Gast", None)),
    )

    xml = render_xmltv([(ch("zdf"), [program])], {"p1": details})

    assert (
        "    <title>heute-show</title>\n"
        "    <desc>Satire &amp; mehr</desc>\n"
        '    <credits><actor role="Moderation">Oliver Welke</actor><actor>Gast</actor></credits>\n'
        "    <date>2026</date>\n"
        "    <category>Comedy</category>\n"
        '    <icon src="http://img/1.jpg"/>\n'
        '    <episode-num system="xmltv_ns">27.11.</episode-num>\n'
    ) in xml


def test_parse_program_details():
    details = parse_program_details(
        {
            "textContent": {"descShort": "Kurz"},
            "production": {
                "year": 1999,
                "castMembers": [{"name": "A", "role": "B"}, {"role": "no name"}, "junk"],
            },
            "series": {"id": "1", "episodeNumber": "3"},
        }
    )

    assert details == ProgramDetails("Kurz", "1999", None, "3", (("A", "B"),))
    assert parse_program_details({}) == ProgramDetails(None, None, None, None, ())

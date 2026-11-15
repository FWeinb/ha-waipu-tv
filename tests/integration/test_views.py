"""Playlist server under /api/waipu_tv."""

import base64
from datetime import UTC, datetime
import gzip
import json
import re
from urllib.parse import parse_qs, urlsplit

import pytest

from ..conftest import URL_RECORDINGS, load_json, token_response

KEY = "aaaa-bbbb-cccc-dddd"
BASE = "http://ha.example.com:8123/api/waipu_tv"
GRID = re.compile(r"^https://epg-cache\.waipu\.tv/api/grid/")
URL_DEVICE_CAPS = "https://device-capabilities.waipu.tv/api/device-capabilities"
URL_STREAM = "https://stream-url-provider.waipu.tv/api/stream-url"
URL_LICENSE = "https://drm.wpstr.tv/license-proxy-widevine/cenc/"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


@pytest.fixture
async def client(hass, hass_client_no_auth, config_entry, mock_waipu, freezer):
    freezer.move_to("2026-11-14T12:30:00+00:00")
    await hass.config.async_set_time_zone("Europe/Berlin")
    mock_waipu.get(GRID, json=load_json("epg_grid_ard.json"))
    mock_waipu.post(URL_DEVICE_CAPS, json={"token": token_response()["access_token"]})
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    return await hass_client_no_auth()


async def get(client, path, **params):
    return await client.get(
        f"/api/waipu_tv/{path}",
        params={"key": KEY, **params},
        # the address the player used; playlist URLs mirror it
        headers={"Host": "ha.example.com:8123"},
        allow_redirects=False,
    )


def stream_requests(mock):
    return [json.loads(c[2])["stream"] for c in mock.mock_calls if str(c[1]) == URL_STREAM]


async def test_access_key_is_required(client):
    assert (await client.get("/api/waipu_tv/all.m3u")).status == 401
    assert (await client.get("/api/waipu_tv/all.m3u", params={"key": "wrong"})).status == 401
    assert (await get(client, "all.m3u")).status == 200


async def test_playlist_server_off_answers_404(hass, client, config_entry):
    hass.config_entries.async_update_entry(
        config_entry, options={**config_entry.options, "playlists": False}
    )
    await hass.async_block_till_done()

    assert (await get(client, "all.m3u")).status == 404


async def test_all_playlist(client):
    resp = await get(client, "all.m3u")
    m3u = await resp.text()

    assert resp.content_type == "audio/x-mpegurl"
    assert m3u.startswith(f'#EXTM3U url-tvg="{BASE}/epg.xml?key={KEY}"')
    # visible channels only, all three on pvr.waipu's HLS allowlist
    assert [line.rsplit(",", 1)[1] for line in m3u.splitlines() if line.startswith("#EXTINF")] == [
        "Das Erste HD",
        "ZDF HD",
        "arte HD",
    ]
    assert f"\n{BASE}/stream/ard.m3u8?key={KEY}\n" in m3u
    assert "KODIPROP" not in m3u
    # the hidden on-demand channel plays via DASH + Widevine
    m3u = await (await get(client, "all.m3u", hidden="1")).text()
    filmtastic = m3u.split("#EXTINF")[3]
    assert f"license_key={BASE}/license?key={KEY}||R{{SSM}}|" in filmtastic
    assert f"\n{BASE}/stream/filmtastic.mpd?key={KEY}\n" in filmtastic
    # no catch-up: waipu.tv can't play past programs
    assert "catchup" not in m3u
    assert "timeshift=1" not in m3u


async def test_playlist_options(client):
    m3u = await (await get(client, "favorites.m3u", hidden="1", drm="0", timeshift="1")).text()

    assert f'url-tvg="{BASE}/epg.xml?filter=favorites&hidden=1&drm=0&key={KEY}"' in m3u
    assert f"\n{BASE}/stream/ard.m3u8?timeshift=1&key={KEY}\n" in m3u
    assert m3u.count("#EXTINF") == 1


async def test_hls_proxy_per_playlist(client):
    m3u = await (await get(client, "all.m3u", hls_proxy="1", hidden="1")).text()

    assert f"\n{BASE}/stream/ard.m3u8?proxy=1&key={KEY}\n" in m3u
    assert f"\n{BASE}/stream/filmtastic.mpd?key={KEY}\n" in m3u  # DASH unaffected


async def test_bad_option(client):
    resp = await get(client, "all.m3u", protocol="rtsp")
    assert resp.status == 400


async def test_stream_redirects_to_fresh_url(client, mock_waipu):
    mock_waipu.post(URL_STREAM, json={"streamUrl": "https://cdn.example.com/ard/master.m3u8"})

    resp = await get(client, "stream/ard.m3u8")

    assert resp.status == 302
    assert resp.headers["Location"] == "https://cdn.example.com/ard/master.m3u8"
    assert stream_requests(mock_waipu) == [
        {"station": "ARD", "protocol": "hls", "requestMuxInstrumentation": False}
    ]


async def test_timeshift_starts_at_the_running_program(client, mock_waipu):
    mock_waipu.post(URL_STREAM, json={"streamUrl": "https://cdn.example.com/ard.mpd"})

    await get(client, "stream/ard.mpd", timeshift="1")

    (timeshift,) = stream_requests(mock_waipu)
    # the program running at 12:30 UTC started at 12:00 UTC
    assert timeshift["startTime"] == int(datetime(2026, 11, 14, 12, tzinfo=UTC).timestamp())


async def test_unknown_channel(client):
    assert (await get(client, "stream/nope.mpd")).status == 404


async def test_waipu_error_status_is_passed_on(client, mock_waipu):
    mock_waipu.post(URL_STREAM, status=403, json={"detail": "not in your package"})

    resp = await get(client, "stream/zdf.mpd")

    assert resp.status == 403


async def test_recordings_playlist(client, mock_waipu):
    mock_waipu.get(
        f"{URL_RECORDINGS}/1000000001/streamingdetails",
        json=load_json("recording_streamingdetails.json"),
    )
    m3u = await (await get(client, "recordings.m3u")).text()

    # finished recordings only, newest first
    assert [line.rsplit(",", 1)[1] for line in m3u.splitlines() if line.startswith("#EXTINF")] == [
        "Tatort – Ein Fall für zwei (2026-11-08)",
        "heute-show S2026E12 – Folge 12 (2026-11-07)",
    ]
    assert f"{BASE}/recording/1000000001.mpd?key={KEY}" in m3u

    resp = await get(client, "recording/1000000001.mpd")
    assert resp.headers["Location"] == "https://cdn.example.com/rec/1000000001/manifest.mpd"


async def test_epg(client):
    resp = await get(client, "epg.xml", filter="favorites")
    xml = await resp.text()

    assert resp.content_type == "application/xml"
    assert xml.count("<channel ") == 1
    assert xml.count("<programme ") == 6
    assert "<title>Tagesschau</title>" in xml
    # details of the favorite (ard) from the background guide load
    assert xml.count("<desc>Satire mit Oliver Welke.</desc>") == 6

    resp = await client.get(
        "/api/waipu_tv/epg.xml",
        params={"key": KEY},
        headers={"Accept-Encoding": "gzip"},
        auto_decompress=False,
    )
    assert resp.headers["Content-Encoding"] == "gzip"
    assert gzip.decompress(await resp.read()).count(b"<channel ") == 3


async def test_license_relay(client, mock_waipu):
    mock_waipu.post(URL_LICENSE, json={"license": base64.b64encode(b"LICENSE").decode()})

    resp = await client.post("/api/waipu_tv/license", params={"key": KEY}, data=b"CHALLENGE")

    assert resp.status == 200
    assert await resp.read() == b"LICENSE"


async def test_hls_proxy(client, mock_waipu):
    master_url = "https://cdn.example.com/ard/master.m3u8"
    mock_waipu.post(URL_STREAM, json={"streamUrl": master_url})
    mock_waipu.get(master_url, text="#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\n720p/index.m3u8\n")
    mock_waipu.get(
        "https://cdn.example.com/ard/720p/index.m3u8", text="#EXTM3U\n#EXTINF:2,\nseg1.ts\n"
    )

    master = await (await get(client, "stream/ard.m3u8", proxy="1")).text()

    variant = master.splitlines()[-1]
    assert variant.startswith(f"{BASE}/hls?")
    query = parse_qs(urlsplit(variant).query)
    assert query["u"] == ["https://cdn.example.com/ard/720p/index.m3u8"]
    media = await (await get(client, "hls", u=query["u"][0], s=query["s"][0])).text()
    assert "\nhttps://cdn.example.com/ard/720p/seg1.ts\n" in media
    # the proxy only fetches URLs it signed
    resp = await get(client, "hls", u="https://evil.example.com/x.m3u8", s=query["s"][0])
    assert resp.status == 403


async def test_iptv_clients_get_a_slot_each(hass, client, config_entry, mock_waipu):
    mock_waipu.post(URL_STREAM, json={"streamUrl": "https://cdn.example.com/ard.mpd"})

    async def play(user_agent):
        return await client.get(
            "/api/waipu_tv/stream/ard.mpd",
            params={"key": KEY},
            headers={"User-Agent": user_agent},
            allow_redirects=False,
        )

    assert (await play("TiviMate")).status == 302
    assert (await play("TiviMate")).status == 302  # zapping keeps the slot
    # the only slot is held by an IPTV client: the next one takes it over
    assert (await play("Kodi")).status == 302

    sensor = hass.states.get("sensor.waipu_tv_active_streams")
    assert sensor.state == "1"
    (stream,) = sensor.attributes["streams"]
    assert stream["title"] == "Das Erste HD" and stream["viewer"] == "127.0.0.1"


async def test_busy_slots_answer_503(hass, client, config_entry, mock_waipu):
    config_entry.runtime_data.streams.acquire("panel:1", "Ann", "live", "ZDF")

    resp = await get(client, "stream/ard.mpd")

    assert resp.status == 503
    assert await resp.text() == "all 1 streams are in use: Ann"

"""Channels, favorites, streams, guide, recordings and DRM against saved responses."""

import asyncio
import base64
from datetime import UTC, datetime, timedelta
import json

import pytest

from custom_components.waipu_tv.api import Channel, Recording, WaipuClient, WaipuError

from ..conftest import URL_TOKEN, load_json, token_response

URL_STATION_CONFIG = "https://web-proxy.waipu.tv/v2/station-config"
URL_USER_STATIONS = "https://user-stations.waipu.tv/api/stations?omitted=false"
URL_DEVICE_CAPS = "https://device-capabilities.waipu.tv/api/device-capabilities"
URL_STREAM = "https://stream-url-provider.waipu.tv/api/stream-url"
URL_RECORDINGS = "https://recording.waipu.tv/api/recordings"
URL_MEDIATHEK = "https://waiputhek.waipu.tv/api"
URL_PROVIDER = (
    "https://stream-url-provider.waipu.tv/api/v1/microsites/mk/categories/filme/videos/film_b"
)


@pytest.fixture
async def client(aioclient_mock):
    aioclient_mock.post(URL_TOKEN, json=token_response())
    session = aioclient_mock.create_session(asyncio.get_running_loop())
    yield WaipuClient(session, "device-1", "refresh-1")
    await session.close()


def calls(aioclient_mock, method, url):
    return [c for c in aioclient_mock.mock_calls if c[0] == method and str(c[1]) == url]


def sent_json(call):
    return json.loads(call[2])


async def test_channels(aioclient_mock, client):
    aioclient_mock.get(URL_STATION_CONFIG, json=load_json("station_config.json"))
    aioclient_mock.get(URL_USER_STATIONS, json=load_json("user_stations.json"))

    channels = await client.channels()

    # locked and unknown stations are left out, numbers follow the account's order
    assert [(c.id, c.number) for c in channels] == [
        ("ard", 1),
        ("zdf", 2),
        ("filmtastic", 4),
        ("arte", 6),
    ]
    ard = channels[0]
    assert ard == Channel(
        id="ard",
        name="Das Erste HD",
        number=1,
        logo=ard.logo,
        favorite=True,
        visible=True,
        vod=False,
        hls=True,
    )
    assert ard.logo.startswith("https://images.example.com/station/ard/")
    assert ard.logo.endswith("/hd/standard?res=320x180")
    filmtastic = channels[2]
    # on-demand channels play via DASH (ARCHITECTURE.md decision 37)
    assert (filmtastic.vod, filmtastic.hls, filmtastic.visible) == (True, False, False)
    assert channels[3].favorite is False


async def test_set_favorite(aioclient_mock, client):
    url = "https://user-stations.waipu.tv/api/stations/user-settings/ard"
    aioclient_mock.patch(url, json={})

    await client.set_favorite("ARD", True)

    (call,) = calls(aioclient_mock, "PATCH", url)
    assert sent_json(call) == {"favorite": True}
    assert call[3]["Content-Type"] == "application/vnd.waipu.user-stations-station-patch.v1+json"
    assert call[3]["Authorization"].startswith("Bearer ")


async def test_stream_url_with_restart(aioclient_mock, client):
    aioclient_mock.post(URL_DEVICE_CAPS, json={"token": token_response()["access_token"]})
    aioclient_mock.post(URL_STREAM, json={"streamUrl": "https://cdn.example.com/ard.mpd"})
    start = datetime(2026, 11, 14, 19, 15, tzinfo=UTC)

    assert await client.stream_url("ard", "dash", start) == "https://cdn.example.com/ard.mpd"
    await client.stream_url("ard", "dash")

    (caps,) = calls(aioclient_mock, "POST", URL_DEVICE_CAPS)  # token is reused
    video = sent_json(caps)["capabilities"]["video"]
    assert video["hd1080p50"] and video["hevc1080p50"] and video["hevc2160p50"]
    assert sent_json(caps)["manufacturer"] == "ha-waipu-tv"
    assert sent_json(caps)["platform"] == "Home Assistant-ha-waipu-tv"
    assert sent_json(caps)["model"] == "Home Assistant"
    assert sent_json(caps)["appVersion"]  # waipu.tv answers HTTP 400 without it
    assert caps[3]["X-USERCONTEXT-USERHANDLE"] == "00000000-0000-0000-0000-000000000001"
    first, second = calls(aioclient_mock, "POST", URL_STREAM)
    assert sent_json(first) == {
        "stream": {
            "station": "ARD",
            "protocol": "dash",
            "requestMuxInstrumentation": False,
            "startTime": int(start.timestamp()),
        }
    }
    assert "startTime" not in sent_json(second)["stream"]
    assert first[3]["X-Device-Token"]


async def test_stream_url_forbidden(aioclient_mock, client):
    aioclient_mock.post(URL_DEVICE_CAPS, json={"token": token_response()["access_token"]})
    aioclient_mock.post(URL_STREAM, status=403, json={"detail": "not in your package"})

    with pytest.raises(WaipuError) as err:
        await client.stream_url("ard", "hls")
    assert err.value.status == 403


async def test_epg_window(aioclient_mock, client):
    url = "https://epg-cache.waipu.tv/api/grid/ard/2026-11-14T12:00:00.000Z"
    aioclient_mock.get(url, json=[*load_json("epg_grid_ard.json"), {"title": "no id"}])

    programs = await client.epg_window("ard", datetime(2026, 11, 14, 12, tzinfo=UTC))

    assert len(programs) == 6
    first = programs[0]
    assert first.id == "5e9b103c-e92d-5408-b5c9-cb15136c32dc"
    assert first.channel_id == "ard"
    assert first.start == datetime(2026, 11, 14, 11, 15, tzinfo=UTC)
    assert first.stop - first.start == timedelta(minutes=45)
    assert (first.series_id, first.recordable) == ("213", True)
    assert first.image.endswith("?res=480x270")
    # the grid is public: no token is requested for it
    assert calls(aioclient_mock, "POST", URL_TOKEN) == []


async def test_epg_window_error(aioclient_mock, client):
    url = "https://epg-cache.waipu.tv/api/grid/ard/2026-11-14T12:00:00.000Z"
    aioclient_mock.get(url, status=500, text="oops")

    with pytest.raises(WaipuError):
        await client.epg_window("ard", datetime(2026, 11, 14, 12, tzinfo=UTC))


async def test_recordings_expand_groups(aioclient_mock, client):
    aioclient_mock.get(
        f"{URL_RECORDINGS}?recordingGroup=7", json=load_json("recordings_group_7.json")
    )
    aioclient_mock.get(URL_RECORDINGS, json=load_json("recordings.json"))

    recordings = await client.recordings()

    # the locked recording is left out, the group entry seen twice appears once
    assert [(r.id, r.status, r.group) for r in recordings] == [
        ("1000000001", "FINISHED", None),
        ("1000000002", "SCHEDULED", 7),
        ("1000000004", "FINISHED", 7),
    ]
    assert recordings[0] == Recording(
        id="1000000001",
        program_id="5e9b103c-e92d-5408-b5c9-cb15136c32dc",
        channel_id="ard",
        title="Program C",
        episode_title="Episode 3",
        status="FINISHED",
        start=datetime(2026, 11, 8, 19, 15, tzinfo=UTC),
        duration=timedelta(minutes=90),
        group=None,
        image="https://images.example.com/program-c?res=480x270",
        season=None,
        episode=None,
    )
    assert recordings[2].episode == "12"
    get = calls(aioclient_mock, "GET", URL_RECORDINGS)[0]
    assert get[3]["Accept"] == "application/vnd.waipu.recordings-v4+json"


async def test_recorded_seconds(aioclient_mock, client):
    aioclient_mock.get(f"{URL_RECORDINGS}/summary", json={"finishedRecordingsSeconds": 7200})

    assert await client.recorded_seconds() == 7200


async def test_record_program(aioclient_mock, client):
    aioclient_mock.post(URL_RECORDINGS, json={})

    await client.record_program("5e9b103c")

    (call,) = calls(aioclient_mock, "POST", URL_RECORDINGS)
    assert sent_json(call) == {"programId": "5e9b103c"}
    assert call[3]["Content-Type"] == "application/vnd.waipu.recording-create-v4+json"


async def test_record_series(aioclient_mock, client):
    program = "11111111-2222-3333-4444-555555555555"
    aioclient_mock.get(
        f"https://epg-cache.waipu.tv/api/programs/{program}", json=load_json("program_details.json")
    )
    url = "https://recording-scheduler.waipu.tv/api/serials"
    aioclient_mock.post(url, json={})

    await client.record_series(program)

    (call,) = calls(aioclient_mock, "POST", url)
    assert sent_json(call) == {"channel": "ZDF", "title": "Program B", "seriesId": "4711"}
    assert call[3]["Content-Type"] == "application/vnd.waipu.recording-scheduler-serials-v1+json"


async def test_record_series_needs_a_series(aioclient_mock, client):
    aioclient_mock.get(
        "https://epg-cache.waipu.tv/api/programs/p1", json={"id": "p1", "stationId": "ard"}
    )

    with pytest.raises(WaipuError):
        await client.record_series("p1")


async def test_cancel_series(aioclient_mock, client):
    url = "https://recording-scheduler.waipu.tv/api/delete-requests"
    aioclient_mock.post(url, json={})

    await client.cancel_series(7)

    (call,) = calls(aioclient_mock, "POST", url)
    assert sent_json(call) == {
        "serialRecordings": [
            {
                "id": 7,
                "deleteFutureRecordings": True,
                "deleteFinishedRecordings": False,
                "deleteRunningRecordings": False,
            }
        ]
    }
    assert (
        call[3]["Content-Type"]
        == "application/vnd.waipu.recording-scheduler-delete-serial-recordings-v1+json"
    )


async def test_delete_recordings(aioclient_mock, client):
    aioclient_mock.delete(URL_RECORDINGS, json={})

    await client.delete_recordings(["1000000001", "1000000002"])
    await client.delete_recordings([])

    (call,) = calls(aioclient_mock, "DELETE", URL_RECORDINGS)
    assert sent_json(call) == {"ids": ["1000000001", "1000000002"]}
    assert call[3]["Content-Type"] == "application/vnd.waipu.recording-ids-v4+json"


@pytest.mark.parametrize(
    ("protocol", "href"),
    [
        ("dash", "https://cdn.example.com/rec/1000000001/manifest.mpd"),
        ("hls", "https://cdn.example.com/rec/1000000001/master.m3u8"),
    ],
)
async def test_recording_url(aioclient_mock, client, protocol, href):
    aioclient_mock.get(
        f"{URL_RECORDINGS}/1000000001/streamingdetails",
        json=load_json("recording_streamingdetails.json"),
    )

    assert await client.recording_url("1000000001", protocol) == href


async def test_widevine_license(aioclient_mock, client):
    url = "https://drm.wpstr.tv/license-proxy-widevine/cenc/"
    aioclient_mock.post(url, json={"license": base64.b64encode(b"LICENSE").decode()})

    assert await client.widevine_license(b"CHALLENGE") == b"LICENSE"

    (call,) = calls(aioclient_mock, "POST", url)
    assert call[2] == b"CHALLENGE"
    assert "Authorization" not in call[3]
    custom = json.loads(base64.b64decode(call[3]["x-dt-custom-data"]))
    assert custom == {
        "merchant": "exaring",
        "sessionId": "default",
        "userId": "00000000-0000-0000-0000-000000000001",
    }


async def test_widevine_license_error(aioclient_mock, client):
    aioclient_mock.post("https://drm.wpstr.tv/license-proxy-widevine/cenc/", status=403, text="no")

    with pytest.raises(WaipuError) as err:
        await client.widevine_license(b"CHALLENGE")
    assert err.value.status == 403


async def test_fairplay_certificate(aioclient_mock, client):
    url = "https://drm.wpstr.tv/license-server-fairplay/cert/exaring"
    aioclient_mock.get(url, content=b"\x30\x82CERT")

    assert await client.fairplay_certificate() == b"\x30\x82CERT"
    (call,) = calls(aioclient_mock, "GET", url)
    assert "Authorization" not in call[3]


async def test_fairplay_license(aioclient_mock, client):
    url = "https://drm.wpstr.tv/license-server-fairplay"
    aioclient_mock.post(url, text=base64.b64encode(b"CKC").decode())

    assert await client.fairplay_license(b"\x00\x00\x00\x01SPC") == b"CKC"

    (call,) = calls(aioclient_mock, "POST", url)
    assert call[2] == b"\x00\x00\x00\x01SPC"
    assert "Authorization" not in call[3]
    custom = json.loads(base64.b64decode(call[3]["dt-custom-data"]))
    assert custom == {
        "merchant": "exaring",
        "sessionId": "default",
        "userId": "00000000-0000-0000-0000-000000000001",
    }


@pytest.mark.parametrize(("status", "text"), [(403, "no"), (200, "not base64!")])
async def test_fairplay_license_errors(aioclient_mock, client, status, text):
    aioclient_mock.post("https://drm.wpstr.tv/license-server-fairplay", status=status, text=text)

    with pytest.raises(WaipuError):
        await client.fairplay_license(b"SPC")


async def test_mediathek_titles_leave_out_seasons_and_end_cards(aioclient_mock, client):
    aioclient_mock.get(
        f"{URL_MEDIATHEK}/category/spielfilme/all?sortBy=latest&page=0&size=50&genreId=krimi",
        json=load_json("mediathek_page.json"),
    )
    items = await client.mediathek("spielfilme", "latest", "krimi")

    assert [i.id for i in items] == [
        "mediathek-kabeleinsclassics:kabeleinsclassics-filme:987e1c07084c4e949f7389bc2fe7cf6c",
        "filmlegenden:legenden-feed:film_c",
    ]
    assert items[0].duration == timedelta(minutes=83)
    assert items[0].channel == "Kabel Eins CLASSICS"
    assert items[1].expires == datetime(2026, 11, 20, 23, 59, 59, tzinfo=UTC)


async def test_mediathek_page_has_seasons(aioclient_mock, client):
    aioclient_mock.get(
        f"{URL_MEDIATHEK}/category/serien/all?sortBy=mostWatched&page=0&size=50",
        json=load_json("mediathek_page.json"),
    )
    items, more = await client.mediathek_page("serien")

    # the season's id comes from the app link: collection and category
    season = items[2]
    assert season.id == "mediathek-13thstreet:f30512196_1"
    assert season.series and season.season == 1
    assert len(items) == 3 and not more


async def test_mediathek_series(aioclient_mock, client):
    aioclient_mock.get(
        f"{URL_MEDIATHEK}/v1/tuner/microsites/mediathek-13thstreet/contents",
        json=load_json("mediathek_microsite.json"),
    )
    series = await client.mediathek_series("mediathek-13thstreet:f30512196_1")

    assert (series.title, series.channel) == ("Series A", "13th Street")
    # the series' seasons in order; another series in the same collection is left out
    assert [(s.id, s.title, s.number) for s in series.seasons] == [
        ("mediathek-13thstreet:f30512196_1", "Series A - Staffel - 1", 1),
        ("mediathek-13thstreet:f30512196_2", "Series A - Staffel - 2", 2),
    ]
    assert len(series.seasons[1].episodes) == 1
    first, second = series.seasons[0].episodes
    assert (first.episode, first.title) == (1, "Episode 7")
    assert first.id == "mediathek-13thstreet:f30512196_1:13thnbcu0000213478834421"
    assert first.duration == timedelta(milliseconds=2498200)
    assert second.expires == datetime(2029, 12, 31, 23, 59, tzinfo=UTC)


async def test_mediathek_unknown_season(aioclient_mock, client):
    aioclient_mock.get(
        f"{URL_MEDIATHEK}/v1/tuner/microsites/mediathek-13thstreet/contents",
        json=load_json("mediathek_microsite.json"),
    )

    with pytest.raises(WaipuError):
        await client.mediathek_series("mediathek-13thstreet:nope")


async def test_mediathek_pages_up_to_the_limit(aioclient_mock, client):
    page = load_json("mediathek_page.json")
    page["page"]["totalPages"] = 9
    for n in range(2):
        aioclient_mock.get(
            f"{URL_MEDIATHEK}/category/serien/all?sortBy=mostWatched&page={n}&size=50", json=page
        )

    assert len(await client.mediathek("serien", limit=3)) == 3
    assert len(aioclient_mock.mock_calls) == 3  # token and two pages


@pytest.mark.parametrize(
    ("protocol", "url"),
    [
        ("hls", "https://cdn.example.com/vod/film_b/manifest.m3u8"),
        ("dash", "https://cdn.example.com/vod/film_b/manifest.mpd"),
    ],
)
async def test_mediathek_url(aioclient_mock, client, protocol, url):
    aioclient_mock.post(URL_DEVICE_CAPS, json={"token": token_response()["access_token"]})
    aioclient_mock.get(
        f"{URL_PROVIDER}?uh=00000000-0000-0000-0000-000000000001",
        json=load_json("mediathek_stream.json"),
    )

    assert await client.mediathek_url(URL_PROVIDER, protocol) == url
    url = f"{URL_PROVIDER}?uh=00000000-0000-0000-0000-000000000001"
    (call,) = calls(aioclient_mock, "GET", url)
    assert "X-Device-Token" in call[3]


async def test_mediathek_unknown_title(aioclient_mock, client):
    aioclient_mock.get(f"{URL_MEDIATHEK}/v1/tuner/contents/a:b:c", status=404, json={})

    with pytest.raises(WaipuError):
        await client.mediathek_content("a:b:c")

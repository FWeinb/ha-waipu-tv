"""Websocket commands for the panel, and the diagnostics download."""

import base64
from datetime import UTC, datetime
import json
import re

import pytest
from pytest_homeassistant.common import CLIENT_ID
from pytest_homeassistant.components.diagnostics import get_diagnostics_for_config_entry

from ..conftest import URL_RECORDINGS, URL_TOKEN, load_json, token_response

GRID = re.compile(r"^https://epg-cache\.waipu\.tv/api/grid/")
KEY = "aaaa-bbbb-cccc-dddd"
URL_STREAM = "https://stream-url-provider.waipu.tv/api/stream-url"
URL_DEVICE_CAPS = "https://device-capabilities.waipu.tv/api/device-capabilities"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


@pytest.fixture
async def ws(hass, hass_ws_client, hass_admin_user, config_entry, mock_waipu, freezer):
    freezer.move_to("2026-11-14T12:30:00+00:00")
    await hass.config.async_set_time_zone("Europe/Berlin")
    mock_waipu.get(GRID, json=load_json("epg_grid_ard.json"))
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    # issued after freezing the clock, so it isn't "not yet valid"
    refresh = await hass.auth.async_create_refresh_token(hass_admin_user, CLIENT_ID)
    return await hass_ws_client(hass, hass.auth.async_create_access_token(refresh))


async def command(ws, type_, **data):
    await ws.send_json_auto_id({"type": f"waipu_tv/{type_}", **data})
    return await ws.receive_json()


async def test_channels(ws):
    msg = await command(ws, "channels")

    assert msg["success"]
    result = msg["result"]
    assert result["subscription"] == "perfect plus"
    assert result["audio_language"] is None  # the stream's default"
    assert [c["id"] for c in result["channels"] if c["favorite"]] == ["ard"]
    assert result["channels"][0] == {
        "id": "ard",
        "name": "Das Erste HD",
        "number": 1,
        "logo": result["channels"][0]["logo"],
        "favorite": True,
        "visible": True,
        "vod": False,
        "hls": True,
    }


async def test_guide(ws):
    msg = await command(
        ws, "guide", start="2026-11-14T12:00:00+00:00", end="2026-11-14T15:00:00+00:00"
    )

    result = msg["result"]
    assert result["start"] == "2026-11-14T00:00:00+01:00"
    assert result["end"] == "2026-11-16T00:00:00+01:00"
    assert result["days"] == ["2026-11-14T00:00:00+01:00", "2026-11-15T00:00:00+01:00"]
    assert set(result["programs"]) == {"ard", "zdf", "arte"}
    ard = result["programs"]["ard"]
    assert [p["title"] for p in ard][:2] == ["Die Tierärzte - Retter mit Herz", "Tagesschau"]
    assert ard[0]["start"] == "2026-11-14T12:00:00+00:00"


async def test_guide_only_given_channels_and_days(ws):
    msg = await command(
        ws,
        "guide",
        start="2026-11-13T00:00:00+00:00",
        end="2026-11-13T20:00:00+00:00",
        channels=["ard"],
    )

    assert msg["result"]["programs"] == {}  # before today


async def test_recordings(ws):
    result = (await command(ws, "recordings"))["result"]

    assert result["recorded_hours"] == 2.5
    assert result["booked_hours"] == 50
    assert [(r["id"], r["status"]) for r in result["recordings"]] == [
        ("1000000001", "FINISHED"),
        ("1000000002", "SCHEDULED"),
        ("1000000004", "FINISHED"),
    ]
    assert result["recordings"][0]["duration"] == 5400


async def test_record_and_errors(ws, mock_waipu):
    mock_waipu.post(URL_RECORDINGS, status=409, json={"detail": "storage full"})

    msg = await command(ws, "record", program_id="5e9b103c")

    assert not msg["success"]
    assert msg["error"]["translation_key"] == "api_error"


async def test_cancel_series(ws, mock_waipu):
    url = "https://recording-scheduler.waipu.tv/api/delete-requests"
    mock_waipu.post(url, json={})

    msg = await command(ws, "cancel_series", program_id="11111111-2222-3333-4444-555555555555")

    assert msg["success"]
    assert [c for c in mock_waipu.mock_calls if c[0] == "POST" and str(c[1]) == url]


async def test_set_favorite_unknown_channel(ws):
    msg = await command(ws, "set_favorite", channel="nope", favorite=True)

    assert not msg["success"]
    assert msg["error"]["translation_key"] == "unknown_channel"


async def test_playlists_for_admins(ws):
    result = (await command(ws, "playlists"))["result"]

    assert result["enabled"] is True
    base = "/api/waipu_tv"
    assert result["urls"]["favorites"] == f"{base}/favorites.m3u?key={KEY}"
    assert result["urls"]["epg"] == f"{base}/epg.xml?key={KEY}"
    assert set(result["urls"]) == {"all", "favorites", "live", "vod", "recordings", "epg"}
    assert result["defaults"] == {"timeshift": False, "hls_proxy": False}
    assert result["instant_restart"] is True


async def test_playlists_not_for_other_users(hass, ws, hass_admin_user):
    hass_admin_user.groups = []

    msg = await command(ws, "playlists")

    assert not msg["success"]
    assert msg["error"]["code"] == "unauthorized"


async def test_diagnostics(hass, hass_client, config_entry, mock_waipu):
    mock_waipu.get(GRID, json=load_json("epg_grid_ard.json"))
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    mock_waipu.clear_requests()
    mock_waipu.get(URL_RECORDINGS, status=500, text="down")
    await config_entry.runtime_data.recordings.async_refresh()

    diagnostics = await get_diagnostics_for_config_entry(hass, hass_client, config_entry)

    text = str(diagnostics)
    for secret in (KEY, "refresh-1", "device-old", "user@example.com", "00000000-0000"):
        assert secret not in text
    assert diagnostics["options"]["access_key"] == "**REDACTED**"
    assert diagnostics["account"]["subscription"] == "perfect plus"
    assert diagnostics["channels"]["total"] == 4
    assert diagnostics["guide"]["channels"] == 3
    assert diagnostics["recordings"] == {"FINISHED": 2, "SCHEDULED": 1}
    (error,) = diagnostics["last_errors"]
    assert "HTTP 500" in error["error"]


@pytest.fixture
def streams(mock_waipu):
    mock_waipu.post(URL_DEVICE_CAPS, json={"token": token_response()["access_token"]})
    mock_waipu.post(URL_STREAM, json={"streamUrl": "https://cdn.example.com/rtl.mpd"})
    return mock_waipu


def stream_requests(mock):
    return [json.loads(c[2])["stream"] for c in mock.mock_calls if str(c[1]) == URL_STREAM]


async def subscribe_stream(ws, **data):
    """The subscription's result and, when it succeeded, its first event."""
    await ws.send_json_auto_id({"type": "waipu_tv/stream", **data})
    result = await ws.receive_json()
    if not result["success"]:
        return result, None
    return result, (await ws.receive_json())["event"]


async def unsubscribe(ws, subscription):
    await ws.send_json_auto_id({"type": "unsubscribe_events", "subscription": subscription})
    assert (await ws.receive_json())["success"]


async def test_stream_live_and_from_start(ws, streams):
    live, event = await subscribe_stream(ws, channel="ARD", protocol="dash")
    assert event == {"url": "https://cdn.example.com/rtl.mpd"}
    await unsubscribe(ws, live["id"])
    shifted, _ = await subscribe_stream(ws, channel="ard", protocol="hls", from_start=True)

    assert shifted["success"]
    first, second = stream_requests(streams)
    assert first["protocol"] == "dash" and "startTime" not in first
    # the program running at 12:30 UTC started at 12:00 UTC
    assert second["protocol"] == "hls"
    assert second["startTime"] == int(datetime(2026, 11, 14, 12, tzinfo=UTC).timestamp())


async def test_stream_unknown_channel(ws):
    msg, _ = await subscribe_stream(ws, channel="nope", protocol="dash")

    assert msg["error"]["translation_key"] == "unknown_channel"


async def test_recording_stream(ws, mock_waipu):
    mock_waipu.get(
        f"{URL_RECORDINGS}/1000000001/streamingdetails",
        json=load_json("recording_streamingdetails.json"),
    )

    _, event = await subscribe_stream(ws, recording_id="1000000001", protocol="dash")

    assert event == {"url": "https://cdn.example.com/rec/1000000001/manifest.mpd"}


async def test_streams_hold_a_slot_until_unsubscribed(hass, ws, streams):
    first, _ = await subscribe_stream(ws, channel="ard", protocol="dash")

    sensor = hass.states.get("sensor.waipu_tv_active_streams")
    assert sensor.state == "1"
    assert sensor.attributes["maximum"] == 1
    (stream,) = sensor.attributes["streams"]
    assert stream["slot"] == 0 and stream["type"] == "live"
    assert stream["title"] == "Das Erste HD" and stream["viewer"] == "Mock User"
    # the only slot is held by a panel player: no takeover
    busy, _ = await subscribe_stream(ws, channel="zdf", protocol="dash")
    assert busy["error"]["translation_key"] == "streams_busy"

    await unsubscribe(ws, first["id"])
    assert hass.states.get("sensor.waipu_tv_active_streams").state == "0"
    second, _ = await subscribe_stream(ws, channel="zdf", protocol="dash")
    assert second["success"]


async def test_parallel_streams_come_from_their_own_devices(hass, ws, streams, config_entry):
    hass.config_entries.async_update_entry(
        config_entry, options={**config_entry.options, "parallel_streams": 2}
    )
    await hass.config_entries.async_reload(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    before = len(streams.mock_calls)

    await subscribe_stream(ws, channel="ard", protocol="dash")
    await subscribe_stream(ws, channel="zdf", protocol="dash")

    # slot 1 signed in as a device of its own
    (token,) = [c for c in streams.mock_calls[before:] if str(c[1]) == URL_TOKEN]
    assert token[2]["grant_type"] == "refresh_token"
    assert token[2]["waipu_device_id"] not in ("device-old", "")
    slots = hass.states.get("sensor.waipu_tv_active_streams").attributes["streams"]
    assert [s["slot"] for s in slots] == [0, 1]


async def test_unload_ends_the_subscription(hass, ws, streams, config_entry):
    sub, _ = await subscribe_stream(ws, channel="ard", protocol="dash")

    await hass.config_entries.async_unload(config_entry.entry_id)

    msg = await ws.receive_json()
    assert msg["id"] == sub["id"] and msg["event"] == {"ended": True}


async def test_widevine_license(ws, mock_waipu):
    mock_waipu.post(
        "https://drm.wpstr.tv/license-proxy-widevine/cenc/",
        json={"license": base64.b64encode(b"LICENSE").decode()},
    )

    msg = await command(
        ws, "license", system="widevine", challenge=base64.b64encode(b"CHALLENGE").decode()
    )

    assert base64.b64decode(msg["result"]["license"]) == b"LICENSE"
    (call,) = [c for c in mock_waipu.mock_calls if "widevine" in str(c[1])]
    assert call[2] == b"CHALLENGE"


async def test_fairplay_certificate_and_license(ws, mock_waipu):
    mock_waipu.get("https://drm.wpstr.tv/license-server-fairplay/cert/exaring", content=b"CERT")
    mock_waipu.post(
        "https://drm.wpstr.tv/license-server-fairplay", text=base64.b64encode(b"CKC").decode()
    )

    cert = await command(ws, "fairplay_certificate")
    msg = await command(
        ws, "license", system="fairplay", challenge=base64.b64encode(b"SPC").decode()
    )

    assert base64.b64decode(cert["result"]["certificate"]) == b"CERT"
    assert base64.b64decode(msg["result"]["license"]) == b"CKC"


async def test_license_error(ws, mock_waipu):
    mock_waipu.post("https://drm.wpstr.tv/license-server-fairplay", status=403, text="no")

    msg = await command(
        ws, "license", system="fairplay", challenge=base64.b64encode(b"SPC").decode()
    )

    assert msg["error"]["translation_key"] == "api_error"

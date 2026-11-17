"""Actions: each change reloads the affected data right away."""

import json
import re

import pytest

from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from ..conftest import URL_RECORDINGS, load_json

GRID = re.compile(r"^https://epg-cache\.waipu\.tv/api/grid/")
URL_SETTINGS = "https://user-stations.waipu.tv/api/stations/user-settings/{}"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


@pytest.fixture
async def waipu(hass, config_entry, mock_waipu):
    mock_waipu.get(GRID, json=[])
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    mock_waipu.clear_requests()
    return mock_waipu


def mock_reload(mock, recordings=None, user_stations=None):
    """The data loaded after a change; registered after the change's own mock."""
    mock.get("https://web-proxy.waipu.tv/v2/station-config", json=load_json("station_config.json"))
    mock.get(
        "https://user-stations.waipu.tv/api/stations?omitted=false",
        json=user_stations or load_json("user_stations.json"),
    )
    mock.get(GRID, json=[])
    mock.get(f"{URL_RECORDINGS}?recordingGroup=7", json=[])
    mock.get(f"{URL_RECORDINGS}/summary", json={"finishedRecordingsSeconds": 0})
    mock.get(URL_RECORDINGS, json=recordings or [])


def sent(mock, method, url):
    return [json.loads(c[2]) for c in mock.mock_calls if c[0] == method and str(c[1]) == url]


async def call(hass, action, data):
    await hass.services.async_call("waipu_tv", action, data, blocking=True)
    await hass.async_block_till_done()


async def test_record_program_reloads_recordings(hass, waipu):
    waipu.post(URL_RECORDINGS, json={})
    running = load_json("recordings.json")[:1]
    running[0]["status"] = "RECORDING"
    mock_reload(waipu, recordings=running)

    await call(hass, "record_program", {"program_id": "5e9b103c"})

    assert sent(waipu, "POST", URL_RECORDINGS) == [{"programId": "5e9b103c"}]
    assert hass.states.get("binary_sensor.waipu_tv_recording").state == "on"


async def test_record_series(hass, waipu):
    program = "11111111-2222-3333-4444-555555555555"
    waipu.get(
        f"https://epg-cache.waipu.tv/api/programs/{program}",
        json=load_json("program_details.json"),
    )
    url = "https://recording-scheduler.waipu.tv/api/serials"
    waipu.post(url, json={})
    mock_reload(waipu)

    await call(hass, "record_series", {"program_id": program})

    assert sent(waipu, "POST", url) == [
        {"channel": "ZDF", "title": "Program B", "seriesId": "4711"}
    ]


async def test_cancel_series_uses_the_programs_recording_group(hass, waipu):
    url = "https://recording-scheduler.waipu.tv/api/delete-requests"
    waipu.post(url, json={})
    mock_reload(waipu)

    # 1000000004, a finished episode of group 7
    await call(hass, "cancel_series", {"program_id": "66666666-7777-8888-9999-000000000000"})

    (request,) = sent(waipu, "POST", url)
    assert request["serialRecordings"][0]["id"] == 7


async def test_cancel_series_needs_a_series_recording(hass, waipu):
    with pytest.raises(ServiceValidationError) as err:
        # 1000000001 has no recording group
        await call(hass, "cancel_series", {"program_id": "5e9b103c-e92d-5408-b5c9-cb15136c32dc"})
    assert err.value.translation_key == "not_a_series_recording"


async def test_delete_recordings_reloads_recordings(hass, waipu):
    waipu.delete(URL_RECORDINGS, json={})
    mock_reload(waipu)

    await call(hass, "delete_recordings", {"recording_ids": ["1000000001", "1000000004"]})

    assert sent(waipu, "DELETE", URL_RECORDINGS) == [{"ids": ["1000000001", "1000000004"]}]
    assert hass.states.get("sensor.waipu_tv_recordings").state == "0"


async def test_set_favorite_reloads_channels(hass, config_entry, waipu):
    waipu.patch(URL_SETTINGS.format("zdf"), json={})
    stations = load_json("user_stations.json")
    stations[1]["userSettings"]["favorite"] = True
    mock_reload(waipu, user_stations=stations)

    await call(hass, "set_favorite", {"channel": "ZDF", "favorite": True})

    assert sent(waipu, "PATCH", URL_SETTINGS.format("zdf")) == [{"favorite": True}]
    channels = config_entry.runtime_data.channels.data.channels
    assert [c.id for c in channels if c.favorite] == ["ard", "zdf"]


async def test_set_favorite_unknown_channel(hass, waipu):
    with pytest.raises(ServiceValidationError) as err:
        await call(hass, "set_favorite", {"channel": "nope", "favorite": True})
    assert err.value.translation_key == "unknown_channel"


async def test_waipu_error_is_reported(hass, waipu):
    waipu.post(URL_RECORDINGS, status=409, json={"detail": "storage full"})

    with pytest.raises(HomeAssistantError) as err:
        await call(hass, "record_program", {"program_id": "5e9b103c"})
    assert err.value.translation_key == "api_error"
    assert "storage full" in err.value.translation_placeholders["error"]


async def test_not_loaded(hass, config_entry, waipu):
    await hass.config_entries.async_unload(config_entry.entry_id)

    with pytest.raises(ServiceValidationError) as err:
        await call(hass, "record_program", {"program_id": "5e9b103c"})
    assert err.value.translation_key == "not_loaded"

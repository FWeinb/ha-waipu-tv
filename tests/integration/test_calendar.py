"""calendar.waipu_tv and the guide behind it."""

import re

import pytest

from homeassistant.components.calendar import DATA_COMPONENT as CALENDAR_COMPONENT
from homeassistant.const import STATE_ON
from homeassistant.util import dt as dt_util

from ..conftest import URL_RECORDINGS, load_json

NOW = "2026-11-14T12:30:00+00:00"
GRID = re.compile(r"^https://epg-cache\.waipu\.tv/api/grid/")


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


@pytest.fixture
async def setup(hass, config_entry, mock_waipu, freezer):
    freezer.move_to(NOW)
    await hass.config.async_set_time_zone("Europe/Berlin")
    # every window answers with the saved ARD grid of 2026-11-14, 11:15-16:45 UTC
    mock_waipu.get(GRID, json=load_json("epg_grid_ard.json"))
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    return mock_waipu


def grid_requests(mock):
    return [str(c[1]) for c in mock.mock_calls if GRID.search(str(c[1]))]


async def get_events(hass, start, end):
    result = await hass.services.async_call(
        "calendar",
        "get_events",
        {"entity_id": "calendar.waipu_tv", "start_date_time": start, "end_date_time": end},
        blocking=True,
        return_response=True,
    )
    return result["calendar.waipu_tv"]["events"]


async def test_guide_is_loaded_in_background_for_imported_channels(hass, setup):
    requests = grid_requests(setup)
    # visible channels (ard, zdf, arte; filmtastic is hidden), today and tomorrow in Berlin:
    # 2026-11-13 23:00 UTC to 2026-11-15 23:00 UTC is 13 windows per channel
    assert {re.search(r"/grid/(\w+)/", url)[1] for url in requests} == {"ard", "zdf", "arte"}
    assert len(requests) == 3 * 13
    assert min(requests).endswith("/2026-11-13T20:00:00.000Z")  # window holding midnight


async def test_current_event(hass, setup):
    state = hass.states.get("calendar.waipu_tv")

    assert state.state == STATE_ON
    assert state.attributes["message"] == "Die Tierärzte - Retter mit Herz"
    assert state.attributes["location"] == "Das Erste HD"
    assert state.attributes["description"] == "Die Rettungshunde"


async def test_events_are_favorites_and_scheduled_recordings(hass, setup):
    events = await get_events(hass, "2026-11-14T00:00:00+01:00", "2026-11-16T00:00:00+01:00")

    summaries = [(e["summary"], e["location"]) for e in events]
    # ard is the only favorite; the scheduled recording on zdf is shown, the finished one not
    assert summaries == [
        ("Die Tierärzte - Retter mit Herz", "Das Erste HD"),
        ("Die Tierärzte - Retter mit Herz", "Das Erste HD"),
        ("Tagesschau", "Das Erste HD"),
        ("Zurück aufs Eis", "Das Erste HD"),
        ("Tagesschau", "Das Erste HD"),
        ("Sportschau", "Das Erste HD"),
        ("⏺ heute-show", "ZDF HD"),
    ]


async def test_event_uid_is_the_program_id(hass, setup):
    """So a calendar trigger can pass trigger.calendar_event.uid to waipu_tv.record_program."""
    entity = hass.data[CALENDAR_COMPONENT].get_entity("calendar.waipu_tv")

    events = await entity.async_get_events(
        hass,
        dt_util.parse_datetime("2026-11-14T00:00:00+01:00"),
        dt_util.parse_datetime("2026-11-16T00:00:00+01:00"),
    )

    assert events[0].uid == "5e9b103c-e92d-5408-b5c9-cb15136c32dc"
    assert events[-1].uid == "11111111-2222-3333-4444-555555555555"


async def test_recorded_program_shows_once_as_recording(hass, config_entry, setup):
    recordings = load_json("recordings.json")
    recordings[1].update(
        programId=load_json("epg_grid_ard.json")[3]["id"],
        stationId="ARD",
        title="Zurück aufs Eis",
        epgStartTime="2026-11-14T13:00:00.000Z",
        durationSeconds=5400,
    )
    setup.clear_requests()
    setup.get(GRID, json=load_json("epg_grid_ard.json"))
    setup.get(f"{URL_RECORDINGS}?recordingGroup=7", json=[])
    setup.get(f"{URL_RECORDINGS}/summary", json={"finishedRecordingsSeconds": 0})
    setup.get(URL_RECORDINGS, json=recordings)
    await config_entry.runtime_data.recordings.async_refresh()

    events = await get_events(hass, "2026-11-14T14:00:00+01:00", "2026-11-14T15:30:00+01:00")

    assert [e["summary"] for e in events] == ["⏺ Zurück aufs Eis"]


async def test_nothing_before_today(hass, setup):
    assert await get_events(hass, "2026-11-13T00:00:00+01:00", "2026-11-14T00:00:00+01:00") == []

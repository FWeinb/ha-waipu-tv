"""Entities on the waipu.tv device."""

from homeassistant.const import ATTR_ENTITY_ID, STATE_OFF, STATE_ON, STATE_UNAVAILABLE
from homeassistant.helpers import device_registry as dr
import pytest

from ..conftest import URL_RECORDINGS, load_json


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


async def setup(hass, config_entry):
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()


async def test_entities(hass, config_entry, mock_waipu):
    await setup(hass, config_entry)

    assert hass.states.get("sensor.waipu_tv_subscription").state == "perfect plus"
    storage = hass.states.get("sensor.waipu_tv_recording_storage")
    assert storage.state == "2.5"
    assert storage.attributes["unit_of_measurement"] == "h"
    assert storage.attributes["booked_hours"] == 50
    # finished only: one single recording and one from the series group
    assert hass.states.get("sensor.waipu_tv_recordings").state == "2"
    assert hass.states.get("binary_sensor.waipu_tv_recording").state == STATE_OFF
    assert hass.states.get("button.waipu_tv_refresh") is not None

    device = dr.async_get(hass).async_get_device_by_identifier(
        ("waipu_tv", config_entry.entry_id), config_entry.entry_id
    )
    assert (device.name, device.manufacturer) == ("waipu.tv", "Exaring AG")
    assert device.entry_type is dr.DeviceEntryType.SERVICE


async def test_refresh_button_reloads_recordings(hass, config_entry, mock_waipu):
    await setup(hass, config_entry)
    running = load_json("recordings.json")
    running[0]["status"] = "RECORDING"
    mock_waipu.clear_requests()
    mock_waipu.get("https://web-proxy.waipu.tv/v2/station-config", json={"stations": []})
    mock_waipu.get("https://user-stations.waipu.tv/api/stations?omitted=false", json=[])
    mock_waipu.get(f"{URL_RECORDINGS}?recordingGroup=7", json=[])
    mock_waipu.get(f"{URL_RECORDINGS}/summary", json={"finishedRecordingsSeconds": 0})
    mock_waipu.get(URL_RECORDINGS, json=running)

    await hass.services.async_call(
        "button", "press", {ATTR_ENTITY_ID: "button.waipu_tv_refresh"}, blocking=True
    )
    await hass.async_block_till_done()

    assert hass.states.get("binary_sensor.waipu_tv_recording").state == STATE_ON
    assert hass.states.get("sensor.waipu_tv_recordings").state == "0"


async def test_update_failure_makes_entities_unavailable(hass, config_entry, mock_waipu):
    await setup(hass, config_entry)
    mock_waipu.clear_requests()
    mock_waipu.get(URL_RECORDINGS, status=500, text="down")

    await config_entry.runtime_data.recordings.async_refresh()
    await hass.async_block_till_done()

    assert hass.states.get("sensor.waipu_tv_recordings").state == STATE_UNAVAILABLE
    # the channels coordinator is unaffected
    assert hass.states.get("sensor.waipu_tv_subscription").state == "perfect plus"

"""Config flow, options flow and re-authentication."""

import re

import pytest

from homeassistant.config_entries import SOURCE_USER
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.data_entry_flow import FlowResultType

from custom_components.waipu_tv.const import (
    CONF_ACCESS_KEY,
    CONF_DEVICE_ID,
    CONF_REFRESH_TOKEN,
    DOMAIN,
)

from ..conftest import URL_TOKEN, make_jwt, token_response

GRID = re.compile(r"^https://epg-cache\.waipu\.tv/api/grid/")


async def unload(hass, config_entry):
    """Wait for the reload the options change starts, then unload so the calendar's timer
    doesn't outlive the test."""
    await hass.async_block_till_done(wait_background_tasks=True)
    await hass.config_entries.async_unload(config_entry.entry_id)


LOGIN = {CONF_EMAIL: "user@example.com", CONF_PASSWORD: "secret"}
USER_HANDLE = "00000000-0000-0000-0000-000000000001"
GUIDE = {
    "channels": "favorites",
    "guide_days": "3",
    "guide_details": False,
    "update_intervals": {
        "channels_interval": 30.0,
        "recordings_interval": 10.0,
        "guide_interval": 240.0,
        "guide_parallel": 2.0,
    },
}
PLAYLISTS = {
    "playlists": True,
    "access_key": "",
    "timeshift": True,
    "hls_proxy": False,
    "audio_language": "qaa",
    "parallel_streams": 3.0,
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


async def test_full_flow(hass, mock_token):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)
    assert result["step_id"] == "guide"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], GUIDE)
    assert result["step_id"] == "playlists"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], PLAYLISTS)

    assert result["type"] is FlowResultType.CREATE_ENTRY
    entry = result["result"]
    assert entry.title == "user@example.com"
    assert entry.unique_id == USER_HANDLE
    # only the refresh token and device id are stored, never the password
    assert set(entry.data) == {CONF_DEVICE_ID, CONF_REFRESH_TOKEN}
    assert entry.data[CONF_REFRESH_TOKEN] == "refresh-1"
    _, _, form, _ = mock_token.mock_calls[0]
    assert form["waipu_device_id"] == entry.data[CONF_DEVICE_ID]
    assert entry.options == {
        "channels": "favorites",
        "guide_days": 3,
        "guide_details": False,
        "channels_interval": 30,
        "recordings_interval": 10,
        "guide_interval": 240,
        "guide_parallel": 2,
        "playlists": True,
        "access_key": entry.options["access_key"],
        "timeshift": True,
        "hls_proxy": False,
        "audio_language": "qaa",
        "parallel_streams": 3,
    }
    assert re.fullmatch(r"[a-z2-9]{4}(-[a-z2-9]{4}){3}", entry.options["access_key"])


async def test_generated_access_key_is_kept(hass, mock_token):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)
    result = await hass.config_entries.flow.async_configure(result["flow_id"], GUIDE)
    suggested = next(
        key.description["suggested_value"]
        for key in result["data_schema"].schema
        if key == CONF_ACCESS_KEY
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**PLAYLISTS, CONF_ACCESS_KEY: suggested}
    )
    assert result["result"].options[CONF_ACCESS_KEY] == suggested


@pytest.mark.parametrize(
    ("response", "error"),
    [
        ({"status": 401, "json": {"error": "invalid_grant"}}, "invalid_auth"),
        ({"status": 503, "text": "down"}, "cannot_connect"),
        ({"exc": TimeoutError}, "cannot_connect"),
    ],
)
async def test_login_errors_and_retry(hass, aioclient_mock, response, error):
    aioclient_mock.post(URL_TOKEN, **response)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": error}

    aioclient_mock.clear_requests()
    aioclient_mock.post(URL_TOKEN, json=token_response())
    result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)
    assert result["step_id"] == "guide"


async def test_single_account(hass, config_entry):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_options_flow_keeps_access_key(hass, config_entry, mock_waipu):
    mock_waipu.get(GRID, json=[])
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    assert result["step_id"] == "init"
    result = await hass.config_entries.options.async_configure(result["flow_id"], GUIDE)
    assert result["step_id"] == "playlists"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {**PLAYLISTS, CONF_ACCESS_KEY: "aaaa-bbbb-cccc-dddd"}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert config_entry.options["guide_days"] == 3
    assert config_entry.options["guide_parallel"] == 2
    assert config_entry.options[CONF_ACCESS_KEY] == "aaaa-bbbb-cccc-dddd"
    await unload(hass, config_entry)


async def test_options_flow_cleared_key_gets_new_one(hass, config_entry, mock_waipu):
    mock_waipu.get(GRID, json=[])
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], GUIDE)
    result = await hass.config_entries.options.async_configure(result["flow_id"], PLAYLISTS)

    assert config_entry.options[CONF_ACCESS_KEY] not in ("", "aaaa-bbbb-cccc-dddd")
    await unload(hass, config_entry)


async def test_reauth(hass, config_entry, mock_token):
    result = await config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert config_entry.data[CONF_REFRESH_TOKEN] == "refresh-1"
    assert config_entry.data[CONF_DEVICE_ID] != "device-old"
    assert CONF_PASSWORD not in config_entry.data


async def test_reauth_wrong_account(hass, config_entry, aioclient_mock):
    other = token_response()
    other["access_token"] = make_jwt(userHandle="someone-else")
    aioclient_mock.post(URL_TOKEN, json=other)
    result = await config_entry.start_reauth_flow(hass)
    result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "wrong_account"
    assert config_entry.data[CONF_REFRESH_TOKEN] == "refresh-old"

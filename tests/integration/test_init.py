"""Setting up the config entry with the stored refresh token."""

from homeassistant.config_entries import SOURCE_REAUTH, ConfigEntryState
import pytest
from pytest_homeassistant.common import MockConfigEntry

from custom_components.waipu_tv.const import (
    CONF_ACCESS_KEY,
    CONF_DEVICE_ID,
    CONF_REFRESH_TOKEN,
    DEFAULT_OPTIONS,
    DOMAIN,
)

from ..conftest import URL_TOKEN, token_response


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


@pytest.fixture
def config_entry(hass):
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="user@example.com",
        unique_id="00000000-0000-0000-0000-000000000001",
        data={CONF_DEVICE_ID: "device-1", CONF_REFRESH_TOKEN: "refresh-old"},
        options={**DEFAULT_OPTIONS, CONF_ACCESS_KEY: "aaaa-bbbb-cccc-dddd"},
    )
    entry.add_to_hass(hass)
    return entry


async def test_setup_stores_rotated_refresh_token(hass, config_entry, aioclient_mock):
    aioclient_mock.post(URL_TOKEN, json=token_response("refresh-new"))

    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert config_entry.state is ConfigEntryState.LOADED
    assert config_entry.data[CONF_REFRESH_TOKEN] == "refresh-new"

    assert await hass.config_entries.async_unload(config_entry.entry_id)
    assert config_entry.state is ConfigEntryState.NOT_LOADED


async def test_rejected_refresh_token_starts_reauth(hass, config_entry, aioclient_mock):
    aioclient_mock.post(URL_TOKEN, status=401, json={"error": "invalid_grant"})

    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert config_entry.state is ConfigEntryState.SETUP_ERROR
    flows = hass.config_entries.flow.async_progress()
    assert [flow["context"]["source"] for flow in flows] == [SOURCE_REAUTH]


async def test_waipu_unreachable_retries(hass, config_entry, aioclient_mock):
    aioclient_mock.post(URL_TOKEN, exc=TimeoutError)

    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert config_entry.state is ConfigEntryState.SETUP_RETRY

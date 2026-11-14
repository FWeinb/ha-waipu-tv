"""Setting up the config entry with the stored refresh token."""

from homeassistant.config_entries import SOURCE_REAUTH, ConfigEntryState
import pytest

from custom_components.waipu_tv.const import (
    CONF_REFRESH_TOKEN,
)

from ..conftest import URL_TOKEN


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    return


async def test_setup_stores_rotated_refresh_token(hass, config_entry, mock_waipu):
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert config_entry.state is ConfigEntryState.LOADED
    assert config_entry.data[CONF_REFRESH_TOKEN] == "refresh-1"

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

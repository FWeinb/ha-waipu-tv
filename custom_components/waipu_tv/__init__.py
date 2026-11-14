"""The waipu.tv integration."""

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import WaipuClient
from .const import CONF_DEVICE_ID, CONF_REFRESH_TOKEN
from .coordinator import (
    ChannelsCoordinator,
    GuideCoordinator,
    RecordingsCoordinator,
    WaipuTvConfigEntry,
    WaipuTvData,
)

PLATFORMS = [Platform.BINARY_SENSOR, Platform.BUTTON, Platform.CALENDAR, Platform.SENSOR]


async def async_setup_entry(hass: HomeAssistant, entry: WaipuTvConfigEntry) -> None:
    """Set up waipu.tv from a config entry."""

    @callback
    def store_refresh_token(refresh_token: str) -> None:
        hass.config_entries.async_update_entry(
            entry, data={**entry.data, CONF_REFRESH_TOKEN: refresh_token}
        )

    client = WaipuClient(
        async_get_clientsession(hass),
        entry.data[CONF_DEVICE_ID],
        entry.data[CONF_REFRESH_TOKEN],
        store_refresh_token,
    )
    channels = ChannelsCoordinator(hass, entry, client)
    data = WaipuTvData(
        client,
        channels,
        RecordingsCoordinator(hass, entry, client),
        GuideCoordinator(hass, entry, client, channels),
    )
    # the first refresh signs in (token refresh) once; the second reuses the access token
    await data.channels.async_config_entry_first_refresh()
    await data.recordings.async_config_entry_first_refresh()
    entry.runtime_data = data
    # the guide takes many requests: load it in the background, the calendar fills in after
    entry.async_create_background_task(hass, data.guide.async_refresh(), "waipu.tv guide")
    entry.async_on_unload(data.guide.guide.close)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)


async def async_unload_entry(hass: HomeAssistant, entry: WaipuTvConfigEntry) -> None:
    """Unload a config entry."""
    await hass.config_entries.async_unload_platforms_or_raise(entry, PLATFORMS)

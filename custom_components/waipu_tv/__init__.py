"""The waipu.tv integration."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import WaipuAuthError, WaipuClient, WaipuError
from .const import CONF_DEVICE_ID, CONF_REFRESH_TOKEN

PLATFORMS: list[str] = []

type WaipuTvConfigEntry = ConfigEntry[WaipuClient]


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
    try:
        await client.account()
    except WaipuAuthError as err:
        raise ConfigEntryAuthFailed(str(err)) from err
    except WaipuError as err:
        raise ConfigEntryNotReady(str(err)) from err

    entry.runtime_data = client
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)


async def async_unload_entry(hass: HomeAssistant, entry: WaipuTvConfigEntry) -> None:
    """Unload a config entry."""
    await hass.config_entries.async_unload_platforms_or_raise(entry, PLATFORMS)

"""Coordinators for the account's channels and recordings."""

from dataclasses import dataclass
from datetime import timedelta
from typing import override

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import Account, Channel, Recording, WaipuAuthError, WaipuClient, WaipuError
from .const import CONF_CHANNELS_INTERVAL, CONF_RECORDINGS_INTERVAL, DOMAIN, LOGGER


@dataclass
class WaipuTvData:
    client: WaipuClient
    channels: ChannelsCoordinator
    recordings: RecordingsCoordinator


type WaipuTvConfigEntry = ConfigEntry[WaipuTvData]


@dataclass(frozen=True)
class ChannelsData:
    account: Account
    channels: list[Channel]


@dataclass(frozen=True)
class RecordingsData:
    recordings: list[Recording]
    recorded_seconds: int
    booked_hours: int


class WaipuTvCoordinator[T](DataUpdateCoordinator[T]):
    """Maps waipu.tv errors: a rejected login starts re-authentication."""

    config_entry: WaipuTvConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: WaipuTvConfigEntry,
        client: WaipuClient,
        name: str,
        interval_option: str,
    ) -> None:
        super().__init__(
            hass,
            LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {name}",
            update_interval=timedelta(minutes=entry.options[interval_option]),
        )
        self.client = client

    @override
    async def _async_update_data(self) -> T:
        try:
            return await self._fetch()
        except WaipuAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except WaipuError as err:
            raise UpdateFailed(str(err)) from err

    async def _fetch(self) -> T:
        raise NotImplementedError


class ChannelsCoordinator(WaipuTvCoordinator[ChannelsData]):
    def __init__(self, hass: HomeAssistant, entry: WaipuTvConfigEntry, client: WaipuClient) -> None:
        super().__init__(hass, entry, client, "channels", CONF_CHANNELS_INTERVAL)

    @override
    async def _fetch(self) -> ChannelsData:
        return ChannelsData(await self.client.account(), await self.client.channels())


class RecordingsCoordinator(WaipuTvCoordinator[RecordingsData]):
    def __init__(self, hass: HomeAssistant, entry: WaipuTvConfigEntry, client: WaipuClient) -> None:
        super().__init__(hass, entry, client, "recordings", CONF_RECORDINGS_INTERVAL)

    @override
    async def _fetch(self) -> RecordingsData:
        account = await self.client.account()
        return RecordingsData(
            await self.client.recordings(),
            await self.client.recorded_seconds(),
            account.recording_hours,
        )

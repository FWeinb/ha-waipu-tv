"""Coordinators for the account's channels, recordings and the guide."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import override

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import Account, Channel, Guide, Recording, WaipuAuthError, WaipuClient, WaipuError
from .const import (
    CHANNELS_FAVORITES,
    CHANNELS_LIVE,
    CONF_CHANNELS,
    CONF_CHANNELS_INTERVAL,
    CONF_GUIDE_DAYS,
    CONF_GUIDE_INTERVAL,
    CONF_GUIDE_PARALLEL,
    CONF_RECORDINGS_INTERVAL,
    DOMAIN,
    LOGGER,
)

# how often missing and stale guide windows are looked for; they are only fetched again once
# older than the guide refresh interval
GUIDE_CHECK_INTERVAL = timedelta(minutes=10)


@dataclass
class WaipuTvData:
    client: WaipuClient
    channels: ChannelsCoordinator
    recordings: RecordingsCoordinator
    guide: GuideCoordinator


type WaipuTvConfigEntry = ConfigEntry[WaipuTvData]


@dataclass(frozen=True)
class ChannelsData:
    account: Account
    channels: list[Channel]

    def imported(self, selection: str) -> list[Channel]:
        """The channels chosen in the options; hidden channels are never imported."""
        return [
            c
            for c in self.channels
            if c.visible
            and (selection != CHANNELS_FAVORITES or c.favorite)
            and (selection != CHANNELS_LIVE or not c.vod)
        ]


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


class GuideCoordinator(DataUpdateCoordinator[None]):
    """Keeps the guide of the imported channels warm, from today for the configured days."""

    config_entry: WaipuTvConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: WaipuTvConfigEntry,
        client: WaipuClient,
        channels: ChannelsCoordinator,
    ) -> None:
        super().__init__(
            hass,
            LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} guide",
            update_interval=GUIDE_CHECK_INTERVAL,
        )
        self.guide = Guide(
            client,
            ttl=timedelta(minutes=entry.options[CONF_GUIDE_INTERVAL]),
            parallel=entry.options[CONF_GUIDE_PARALLEL],
        )
        self._channels = channels

    def range(self) -> tuple[datetime, datetime]:
        """Nothing from earlier days: the guide starts at midnight today."""
        start = dt_util.start_of_local_day()
        return start, start + timedelta(days=self.config_entry.options[CONF_GUIDE_DAYS])

    def channels(self) -> list[Channel]:
        return self._channels.data.imported(self.config_entry.options[CONF_CHANNELS])

    @override
    async def _async_update_data(self) -> None:
        # broken windows are skipped and logged by the guide, never fail the whole update
        await self.guide.warm([c.id for c in self.channels()], *self.range())

    async def async_reload(self) -> None:
        """Fetch the whole guide again, e.g. from the refresh button."""
        await self.guide.warm([c.id for c in self.channels()], *self.range(), force=True)
        self.async_update_listeners()

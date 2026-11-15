"""Coordinators for the account's channels, recordings and the guide."""

from collections.abc import Awaitable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import override

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    HomeAssistantError,
    ServiceValidationError,
)
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import Account, Channel, Guide, Recording, WaipuAuthError, WaipuClient, WaipuError
from .const import (
    CHANNELS_FAVORITES,
    CHANNELS_LIVE,
    CONF_CHANNELS,
    CONF_CHANNELS_INTERVAL,
    CONF_GUIDE_DAYS,
    CONF_GUIDE_DETAILS,
    CONF_GUIDE_INTERVAL,
    CONF_GUIDE_PARALLEL,
    CONF_RECORDINGS_INTERVAL,
    DOMAIN,
    LOGGER,
)
from .streams import Streams

# how often missing and stale guide windows are looked for; they are only fetched again once
# older than the guide refresh interval
GUIDE_CHECK_INTERVAL = timedelta(minutes=10)


@dataclass
class WaipuTvData:
    """Runtime data; the changes below are shared by the actions and the panel. Each one reloads
    the affected data right away, the intervals only pick up changes made elsewhere."""

    client: WaipuClient
    channels: ChannelsCoordinator
    recordings: RecordingsCoordinator
    guide: GuideCoordinator
    streams: Streams

    async def async_record_program(self, program_id: str) -> None:
        await _call(self.client.record_program(program_id))
        await self.recordings.async_refresh()

    async def async_record_series(self, program_id: str) -> None:
        await _call(self.client.record_series(program_id))
        await self.recordings.async_refresh()

    async def async_cancel_series(self, program_id: str) -> None:
        """Stop the series recording that recorded or scheduled this program."""
        group = next(
            (
                r.group
                for r in self.recordings.data.recordings
                if r.program_id == program_id and r.group is not None
            ),
            None,
        )
        if group is None:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="not_a_series_recording",
                translation_placeholders={"program_id": program_id},
            )
        await _call(self.client.cancel_series(group))
        await self.recordings.async_refresh()

    async def async_delete_recordings(self, recording_ids: list[str]) -> None:
        await _call(self.client.delete_recordings(recording_ids))
        await self.recordings.async_refresh()

    def channel(self, channel_id: str) -> Channel:
        channel_id = channel_id.lower()
        for channel in self.channels.data.channels:
            if channel.id == channel_id:
                return channel
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="unknown_channel",
            translation_placeholders={"channel": channel_id},
        )

    async def async_set_favorite(self, channel_id: str, favorite: bool) -> None:
        channel_id = self.channel(channel_id).id
        await _call(self.client.set_favorite(channel_id, favorite))
        await self.channels.async_refresh()
        # with "favorites only", the guide needs the new channel's windows
        await self.guide.async_request_refresh()

    # --- playback, shared by the playlist server and the panel's player ---------------------------

    async def stream_url(
        self, channel: Channel, protocol: str, from_start: bool = False, slot: int = 0
    ) -> str:
        """A fresh stream URL from the slot's device (see streams.py). from_start: time-shift,
        the running program from its start (pvr.waipu's "timeshift from program start"); falls
        back to plain live."""
        if from_start:
            program = await self.guide.guide.current_program(channel.id, dt_util.utcnow())
            if program:
                try:
                    return await self.client.stream_url(channel.id, protocol, program.start, slot)
                except WaipuError as err:
                    LOGGER.debug("No time-shift for %s (%s), playing live", channel.id, err)
        return await self.client.stream_url(channel.id, protocol, slot=slot)

    async def async_stream_url(
        self, channel: Channel, protocol: str, from_start: bool, slot: int
    ) -> str:
        return await _call(self.stream_url(channel, protocol, from_start, slot))

    async def async_recording_url(self, recording_id: str, protocol: str, slot: int) -> str:
        return await _call(self.client.recording_url(recording_id, protocol, slot))

    def recording_title(self, recording_id: str) -> str:
        for recording in self.recordings.data.recordings:
            if recording.id == recording_id:
                return recording.title
        return recording_id

    async def async_license(self, system: str, challenge: bytes) -> bytes:
        """Widevine (Chrome, Firefox, Android) or FairPlay (Safari, iOS) license for the player."""
        if system == "fairplay":
            return await _call(self.client.fairplay_license(challenge))
        return await _call(self.client.widevine_license(challenge))

    async def async_fairplay_certificate(self) -> bytes:
        return await _call(self.client.fairplay_certificate())


def loaded_data(hass: HomeAssistant) -> WaipuTvData:
    """The one waipu.tv account, for actions and the panel."""
    entries: list[WaipuTvConfigEntry] = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_loaded")
    return entries[0].runtime_data


async def _call[T](request: Awaitable[T]) -> T:
    try:
        return await request
    except WaipuError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="api_error",
            translation_placeholders={"error": str(err)},
        ) from err


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

    def days(self) -> list[datetime]:
        """Local midnight of each guide day, from today; DST-safe wall-clock arithmetic."""
        today = dt_util.start_of_local_day()
        return [
            today + timedelta(days=i) for i in range(self.config_entry.options[CONF_GUIDE_DAYS])
        ]

    def range(self) -> tuple[datetime, datetime]:
        """Nothing from earlier days: the guide starts at midnight today."""
        days = self.days()
        return days[0], days[-1] + timedelta(days=1)

    def channels(self) -> list[Channel]:
        return self._channels.data.imported(self.config_entry.options[CONF_CHANNELS])

    @override
    async def _async_update_data(self) -> None:
        # broken windows are skipped and logged by the guide, never fail the whole update
        await self.guide.warm([c.id for c in self.channels()], *self.range())
        await self._warm_details()

    async def async_reload(self) -> None:
        """Fetch the whole guide again, e.g. from the refresh button."""
        await self.guide.warm([c.id for c in self.channels()], *self.range(), force=True)
        await self._warm_details()
        self.async_update_listeners()

    async def _warm_details(self) -> None:
        """Details for the favorites' programs, like pvr.waipu: one request per program is too
        many for all channels."""
        favorites = []
        if self.config_entry.options[CONF_GUIDE_DETAILS]:
            favorites = [c.id for c in self.channels() if c.favorite]
        programs = self.guide.cached(favorites, *self.range())
        await self.guide.warm_details(p.id for ps in programs.values() for p in ps)

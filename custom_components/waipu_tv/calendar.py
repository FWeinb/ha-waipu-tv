"""calendar.waipu_tv: the favorite channels' guide plus scheduled and running recordings."""

from datetime import datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .api import Program, Recording
from .coordinator import GuideCoordinator, WaipuTvConfigEntry
from .entity import WaipuTvEntity

PARALLEL_UPDATES = 0

RECORDING_MARK = "⏺ "


async def async_setup_entry(
    hass: HomeAssistant,
    entry: WaipuTvConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([WaipuTvCalendar(entry.runtime_data.guide, "guide")])


class WaipuTvCalendar(WaipuTvEntity[GuideCoordinator], CalendarEntity):
    """Each event's uid is waipu.tv's program id, so a calendar trigger can pass it straight to
    waipu_tv.record_program."""

    # the entity is the device's main feature: calendar.waipu_tv
    _attr_name = None

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        recordings = self.coordinator.config_entry.runtime_data.recordings
        self.async_on_remove(recordings.async_add_listener(self._handle_coordinator_update))

    def _events(
        self, programs: dict[str, list[Program]], start: datetime, end: datetime
    ) -> list[CalendarEvent]:
        data = self.coordinator.config_entry.runtime_data
        names = {c.id: c.name for c in data.channels.data.channels}
        recordings: dict[str, Recording] = {
            r.program_id or r.id: r
            for r in data.recordings.data.recordings
            if r.status in ("SCHEDULED", "RECORDING") and r.start
        }
        events = []
        for channel_programs in programs.values():
            for p in channel_programs:
                # a recorded program shows once, as recording
                if p.id not in recordings:
                    events.append(
                        CalendarEvent(
                            start=p.start,
                            end=p.stop,
                            summary=p.title,
                            description=p.episode_title,
                            location=names.get(p.channel_id, p.channel_id),
                            uid=p.id,
                        )
                    )
        for uid, r in recordings.items():
            if r.start and r.start < end and r.start + r.duration > start:
                events.append(
                    CalendarEvent(
                        start=r.start,
                        end=r.start + r.duration,
                        summary=RECORDING_MARK + r.title,
                        description=r.episode_title,
                        location=names.get(r.channel_id, r.channel_id),
                        uid=uid,
                    )
                )
        return sorted(events, key=lambda e: (e.start, e.end))

    def _favorites(self) -> list[str]:
        return [c.id for c in self.coordinator.channels() if c.favorite]

    @property
    def event(self) -> CalendarEvent | None:
        """The running or next event, from what is cached."""
        now = dt_util.utcnow()
        end = now + timedelta(days=1)
        programs = self.coordinator.guide.cached(self._favorites(), now, end)
        return next(iter(self._events(programs, now, end)), None)

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        guide_start, guide_end = self.coordinator.range()
        start, end = max(start_date, guide_start), min(end_date, guide_end)
        programs = (
            await self.coordinator.guide.programs(self._favorites(), start, end)
            if start < end
            else {}
        )
        return self._events(programs, start_date, end_date)

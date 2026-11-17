"""Parallel streams: which waipu.tv device (slot) plays what, for whom.

waipu.tv plays one stream per device, so each stream gets a slot of its own, up to the configured
maximum. Home Assistant never sees a stream end: panel players hold their slot through a
websocket subscription, IPTV clients until a timeout after their last request.
"""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_call_later
from homeassistant.util import dt as dt_util

from .const import DOMAIN

# an IPTV client counts as watching this long after its last request; through the HLS proxy its
# player keeps refreshing the playlist, without it Home Assistant only sees channel switches
IPTV_TIMEOUT = timedelta(hours=4)
HLS_PROXY_TIMEOUT = timedelta(seconds=30)

type Kind = Literal["live", "recording", "mediathek"]


@dataclass
class Stream:
    slot: int
    viewer: str  # the Home Assistant user's name, or the IPTV client's address
    kind: Kind
    title: str
    started: datetime
    seen: datetime  # last request
    expires: datetime | None  # IPTV only; panel players hold their slot until they let go
    on_end: CALLBACK_TYPE | None = None  # tells a panel player its slot is gone


class StreamsBusy(HomeAssistantError):
    """Every slot is held by a panel player."""

    def __init__(self, maximum: int, viewers: list[str]) -> None:
        self.text = f"all {maximum} streams are in use: {', '.join(viewers)}"
        super().__init__(
            translation_domain=DOMAIN,
            translation_key="streams_busy",
            translation_placeholders={"maximum": str(maximum), "viewers": ", ".join(viewers)},
        )


class Streams:
    def __init__(self, hass: HomeAssistant, maximum: int) -> None:
        self.hass = hass
        self.maximum = maximum
        self._streams: dict[str, Stream] = {}  # by holder: a panel subscription or IPTV client
        self._listeners: list[CALLBACK_TYPE] = []
        self._timer: CALLBACK_TYPE | None = None

    def active(self) -> list[Stream]:
        return sorted(self._streams.values(), key=lambda s: s.slot)

    @callback
    def acquire(
        self,
        holder: str,
        viewer: str,
        kind: Kind,
        title: str,
        timeout: timedelta | None = None,
        on_end: CALLBACK_TYPE | None = None,
    ) -> int:
        """The slot to play on: the holder's own, a free one, or the one of the IPTV client
        that has been quiet the longest. Panel players are never taken over."""
        now = dt_util.utcnow()
        self._expire(now)
        expires = now + timeout if timeout else None
        if stream := self._streams.get(holder):
            slot = stream.slot  # zapping keeps the device
        else:
            used = {s.slot for s in self._streams.values()}
            free = [n for n in range(self.maximum) if n not in used]
            if free:
                slot = free[0]
            else:
                iptv = [s for s in self._streams.items() if s[1].expires]
                if not iptv:
                    raise StreamsBusy(self.maximum, [s.viewer for s in self.active()])
                taken, stream = min(iptv, key=lambda s: s[1].seen)
                del self._streams[taken]
                slot = stream.slot
        self._streams[holder] = Stream(slot, viewer, kind, title, now, now, expires, on_end)
        self._changed()
        return slot

    @callback
    def touch(self, holder: str, timeout: timedelta) -> None:
        """The IPTV client is still watching."""
        if (stream := self._streams.get(holder)) and stream.expires:
            stream.seen = dt_util.utcnow()
            stream.expires = max(stream.expires, stream.seen + timeout)
            self._schedule()

    @callback
    def release(self, holder: str) -> None:
        if self._streams.pop(holder, None):
            self._changed()

    @callback
    def close(self) -> None:
        """The integration unloads: panel players are told, so they can ask again."""
        if self._timer:
            self._timer()
            self._timer = None
        streams, self._streams = self._streams, {}
        for stream in streams.values():
            if stream.on_end:
                stream.on_end()

    @callback
    def add_listener(self, listener: CALLBACK_TYPE) -> Callable[[], None]:
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)

    def _expire(self, now: datetime) -> bool:
        expired = [h for h, s in self._streams.items() if s.expires and s.expires <= now]
        for holder in expired:
            del self._streams[holder]
        return bool(expired)

    def _changed(self) -> None:
        self._schedule()
        for listener in list(self._listeners):
            listener()

    def _schedule(self) -> None:
        """Wake up when the next IPTV stream times out, so the sensor drops it then."""
        if self._timer:
            self._timer()
            self._timer = None
        expiries = [s.expires for s in self._streams.values() if s.expires]
        if expiries:
            delay = max((min(expiries) - dt_util.utcnow()).total_seconds(), 0)
            self._timer = async_call_later(self.hass, delay, self._on_timer)

    @callback
    def _on_timer(self, _now: datetime) -> None:
        self._timer = None
        if self._expire(dt_util.utcnow()):
            self._changed()
        else:
            self._schedule()

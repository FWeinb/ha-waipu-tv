"""Guide cache: the grid API serves 4 h windows per channel, and a full guide takes thousands of
requests, so windows are cached, shared by all users of the guide, fetched with a bounded number
of parallel requests and refreshed in the background while the previous data is still served."""

import asyncio
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
import logging

from .client import EPG_WINDOW, WaipuClient, WaipuError
from .models import Program

_LOGGER = logging.getLogger(__name__)

RETRY_FAILED = timedelta(minutes=5)  # a broken window is retried after this, not on every use


def window_starts(start: datetime, end: datetime) -> list[datetime]:
    """The grid windows (aligned to 4 h in UTC) that overlap [start, end)."""
    start = start.astimezone(UTC)
    first = start.replace(minute=0, second=0, microsecond=0, hour=start.hour - start.hour % 4)
    windows = []
    while first < end:
        windows.append(first)
        first += EPG_WINDOW
    return windows


@dataclass
class _Window:
    fetched: datetime
    programs: list[Program] | None  # None: the fetch failed
    refresh: asyncio.Task[None] | None = field(default=None, repr=False)


class Guide:
    def __init__(self, client: WaipuClient, ttl: timedelta, parallel: int) -> None:
        self._client = client
        self._ttl = ttl
        self._limit = asyncio.Semaphore(parallel)
        self._windows: dict[tuple[str, datetime], _Window] = {}
        self._loading: dict[tuple[str, datetime], asyncio.Task[None]] = {}

    async def _fetch(self, key: tuple[str, datetime]) -> None:
        channel_id, start = key
        async with self._limit:
            try:
                programs = await self._client.epg_window(channel_id, start)
            except WaipuError as err:
                # one broken window must not break the whole guide
                _LOGGER.warning("Guide for %s at %s skipped: %s", channel_id, start, err)
                programs = None
        old = self._windows.get(key)
        if programs is None and old and old.programs is not None:
            programs = old.programs  # keep serving the previous data
        self._windows[key] = _Window(datetime.now(UTC), programs)

    def _stale(self, window: _Window, now: datetime) -> bool:
        age = now - window.fetched
        return age >= (self._ttl if window.programs is not None else RETRY_FAILED)

    def _load(self, key: tuple[str, datetime]) -> asyncio.Task[None]:
        """One fetch per window at a time."""
        if (task := self._loading.get(key)) is None:
            task = asyncio.create_task(self._fetch(key), name=f"waipu.tv guide {key}")
            self._loading[key] = task
            task.add_done_callback(lambda _: self._loading.pop(key, None))
        return task

    async def warm(
        self, channel_ids: Iterable[str], start: datetime, end: datetime, force: bool = False
    ) -> None:
        """Fetch missing and stale windows (all with force); forget windows that ended before
        start."""
        now = datetime.now(UTC)
        for key in [k for k in self._windows if k[1] + EPG_WINDOW <= start]:
            del self._windows[key]
        keys = [(c, window) for c in channel_ids for window in window_starts(start, end)]
        tasks = [
            self._load(key)
            for key in keys
            if force or key not in self._windows or self._stale(self._windows[key], now)
        ]
        if tasks:
            await asyncio.gather(*tasks)

    async def programs(
        self, channel_ids: Iterable[str], start: datetime, end: datetime
    ) -> dict[str, list[Program]]:
        """Programs overlapping [start, end) per channel. Waits only for windows never loaded;
        stale windows are served as they are and refreshed in the background."""
        channel_ids = list(channel_ids)
        now = datetime.now(UTC)
        missing = []
        for channel_id in channel_ids:
            for window in window_starts(start, end):
                key = (channel_id, window)
                if (cached := self._windows.get(key)) is None:
                    missing.append(self._load(key))
                elif self._stale(cached, now):
                    self._load(key)
        if missing:
            await asyncio.gather(*missing)
        return self.cached(channel_ids, start, end)

    def cached(
        self, channel_ids: Iterable[str], start: datetime, end: datetime
    ) -> dict[str, list[Program]]:
        """What is cached right now, without fetching."""
        result = {}
        for channel_id in channel_ids:
            seen: set[str] = set()
            programs = []
            for window in window_starts(start, end):
                cached = self._windows.get((channel_id, window))
                for program in (cached.programs or []) if cached else []:
                    # a program spanning two windows is listed in both
                    if program.id not in seen and program.stop > start and program.start < end:
                        seen.add(program.id)
                        programs.append(program)
            result[channel_id] = sorted(programs, key=lambda p: p.start)
        return result

    async def current_program(self, channel_id: str, now: datetime) -> Program | None:
        """The program running now, e.g. for time-shift from program start."""
        # a program that started in the previous window may only be listed there
        programs = await self.programs([channel_id], now - EPG_WINDOW, now + timedelta(seconds=1))
        return next((p for p in programs[channel_id] if p.start <= now < p.stop), None)

    async def close(self) -> None:
        """Cancel fetches in flight."""
        tasks = list(self._loading.values())
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

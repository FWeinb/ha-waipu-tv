"""Guide cache: shared windows, stale data while refreshing, broken windows skipped."""

import asyncio
from datetime import UTC, datetime, timedelta

from freezegun import freeze_time

from custom_components.waipu_tv.api import Guide, Program, WaipuError
from custom_components.waipu_tv.api.guide import window_starts

NOW = datetime(2026, 11, 14, 13, 30, tzinfo=UTC)
DAY = datetime(2026, 11, 14, tzinfo=UTC)


def program(channel_id, start, minutes=60, title="Show"):
    return Program(
        id=f"{channel_id}-{start:%H%M}-{title}",
        channel_id=channel_id,
        title=title,
        episode_title=None,
        genre=None,
        start=start,
        stop=start + timedelta(minutes=minutes),
        image=None,
        series_id=None,
        recordable=True,
    )


class FakeClient:
    """Each grid window holds hourly programs; records the requests and their concurrency."""

    def __init__(self):
        self.requests = []
        self.fail = set()
        self.title = "Show"
        self.running = 0
        self.max_running = 0

    async def epg_window(self, channel_id, start):
        self.requests.append((channel_id, start))
        self.running += 1
        self.max_running = max(self.max_running, self.running)
        await asyncio.sleep(0)
        self.running -= 1
        if (channel_id, start) in self.fail:
            raise WaipuError("HTTP 500")
        return [program(channel_id, start + timedelta(hours=h), title=self.title) for h in range(4)]

    async def program_details(self, program_id):
        self.requests.append(program_id)
        self.running += 1
        self.max_running = max(self.max_running, self.running)
        await asyncio.sleep(0)
        self.running -= 1
        if program_id in self.fail:
            raise WaipuError("HTTP 500")
        return {"id": program_id, "textContent": {"descLong": f"About {program_id}"}}


def make_guide(client, parallel=4):
    return Guide(client, ttl=timedelta(hours=2), parallel=parallel)


def test_window_starts():
    assert window_starts(DAY, DAY + timedelta(days=1)) == [
        DAY + timedelta(hours=h) for h in range(0, 24, 4)
    ]
    assert window_starts(NOW, NOW + timedelta(minutes=1)) == [DAY + timedelta(hours=12)]


@freeze_time(NOW)
async def test_windows_are_shared_between_selections():
    client = FakeClient()
    guide = make_guide(client)

    await guide.programs(["ard", "zdf"], DAY, DAY + timedelta(days=1))
    favorites = await guide.programs(["ard"], DAY, DAY + timedelta(days=1))

    assert len(client.requests) == 12
    assert len(favorites["ard"]) == 24
    assert favorites["ard"] == sorted(favorites["ard"], key=lambda p: p.start)


@freeze_time(NOW)
async def test_requests_are_limited_to_parallel_setting():
    client = FakeClient()

    await make_guide(client, parallel=2).warm(["ard", "zdf", "arte"], DAY, DAY + timedelta(days=2))

    assert len(client.requests) == 36
    assert client.max_running == 2


@freeze_time(NOW)
async def test_programs_are_clipped_to_the_range():
    guide = make_guide(FakeClient())

    programs = await guide.programs(["ard"], NOW, NOW + timedelta(hours=1))

    assert [p.start.hour for p in programs["ard"]] == [13, 14]


async def test_stale_windows_served_while_refreshing():
    client = FakeClient()
    guide = make_guide(client)
    with freeze_time(NOW) as frozen:
        await guide.warm(["ard"], DAY, DAY + timedelta(hours=4))
        client.title = "New"
        frozen.tick(timedelta(hours=3))

        first = await guide.programs(["ard"], DAY, DAY + timedelta(hours=4))
        assert {p.title for p in first["ard"]} == {"Show"}  # no waiting for the refresh
        await guide.warm(["ard"], DAY, DAY + timedelta(hours=4))  # joins the refresh in flight
        second = await guide.programs(["ard"], DAY, DAY + timedelta(hours=4))

    assert {p.title for p in second["ard"]} == {"New"}
    assert len(client.requests) == 2


async def test_failed_windows_are_skipped_and_retried():
    client = FakeClient()
    client.fail.add(("ard", DAY + timedelta(hours=4)))
    guide = make_guide(client)
    with freeze_time(NOW) as frozen:
        programs = await guide.programs(["ard"], DAY, DAY + timedelta(hours=8))
        assert len(programs["ard"]) == 4  # the other window still shows

        await guide.warm(["ard"], DAY, DAY + timedelta(hours=8))
        assert len(client.requests) == 2  # not retried right away

        client.fail.clear()
        frozen.tick(timedelta(minutes=6))
        await guide.warm(["ard"], DAY, DAY + timedelta(hours=8))

    assert len(client.requests) == 3
    assert len(guide.cached(["ard"], DAY, DAY + timedelta(hours=8))["ard"]) == 8


async def test_failed_refresh_keeps_previous_data():
    client = FakeClient()
    guide = make_guide(client)
    with freeze_time(NOW) as frozen:
        await guide.warm(["ard"], DAY, DAY + timedelta(hours=4))
        client.fail.add(("ard", DAY))
        frozen.tick(timedelta(hours=3))
        await guide.warm(["ard"], DAY, DAY + timedelta(hours=4))

    assert len(guide.cached(["ard"], DAY, DAY + timedelta(hours=4))["ard"]) == 4


async def test_warm_forgets_earlier_days():
    client = FakeClient()
    guide = make_guide(client)
    with freeze_time(NOW):
        await guide.warm(["ard"], DAY, DAY + timedelta(days=1))
        tomorrow = DAY + timedelta(days=1)
        await guide.warm(["ard"], tomorrow, tomorrow + timedelta(days=1))

    assert guide.cached(["ard"], DAY, tomorrow) == {"ard": []}


@freeze_time(NOW)
async def test_current_program():
    guide = make_guide(FakeClient())

    current = await guide.current_program("ard", NOW)

    assert current.start == datetime(2026, 11, 14, 13, tzinfo=UTC)


async def test_details_are_fetched_once_and_forgotten_when_not_wanted():
    client = FakeClient()
    guide = make_guide(client, parallel=2)

    await guide.warm_details(["a", "b", "c", "a"])
    await guide.warm_details(["b", "c", "d"])

    assert client.requests == ["a", "b", "c", "d"]
    assert client.max_running == 2
    assert set(guide.details()) == {"b", "c", "d"}
    assert guide.details()["b"].description == "About b"


async def test_failed_details_are_retried():
    client = FakeClient()
    client.fail = {"a"}
    guide = make_guide(client)

    await guide.warm_details(["a", "b"])
    assert set(guide.details()) == {"b"}
    client.fail = set()
    await guide.warm_details(["a", "b"])

    assert client.requests == ["a", "b", "a"]
    assert set(guide.details()) == {"a", "b"}


@freeze_time(NOW)
async def test_starting_many_windows_yields_to_the_event_loop():
    guide = make_guide(FakeClient())
    started = []

    async def other_work():
        started.append(len(guide._loading))

    # 100 channels x 6 windows; other work runs before all 600 fetches are started
    warm = asyncio.create_task(
        guide.warm([f"ch{i}" for i in range(100)], DAY, DAY + timedelta(days=1))
    )
    asyncio.create_task(other_work())
    await warm

    assert started and started[0] < 600

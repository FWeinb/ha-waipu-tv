"""Parallel-stream slots: who plays on which waipu.tv device."""

from datetime import timedelta

import pytest
from pytest_homeassistant.common import async_fire_time_changed

from custom_components.waipu_tv.streams import Streams, StreamsBusy

HOUR = timedelta(hours=1)


@pytest.fixture
def streams(hass, freezer):
    freezer.move_to("2026-11-14T12:30:00+00:00")
    streams = Streams(hass, 2)
    yield streams
    streams.close()  # no timer left behind


async def test_free_slots_first_and_zapping_keeps_the_slot(streams):
    assert streams.acquire("iptv:a", "a", "live", "ARD", HOUR) == 0
    assert streams.acquire("panel:1", "Ann", "live", "ZDF") == 1
    assert streams.acquire("iptv:a", "a", "live", "arte", HOUR) == 0

    assert [(s.slot, s.title) for s in streams.active()] == [(0, "arte"), (1, "ZDF")]


async def test_takes_over_the_quietest_iptv_client(streams, freezer):
    streams.acquire("iptv:a", "a", "live", "ARD", HOUR)
    freezer.tick(60)
    streams.acquire("iptv:b", "b", "live", "ZDF", HOUR)
    freezer.tick(60)
    streams.touch("iptv:a", HOUR)

    assert streams.acquire("iptv:c", "c", "live", "arte", HOUR) == 1
    assert {s.viewer for s in streams.active()} == {"a", "c"}


async def test_panel_players_are_never_taken_over(streams):
    streams.acquire("panel:1", "Ann", "live", "ARD")
    streams.acquire("panel:2", "Ben", "recording", "Program C")

    with pytest.raises(StreamsBusy) as err:
        streams.acquire("iptv:a", "a", "live", "ZDF", HOUR)
    assert err.value.text == "all 2 streams are in use: Ann, Ben"


async def test_iptv_clients_time_out(hass, streams, freezer):
    changes = []
    streams.add_listener(lambda: changes.append(len(streams.active())))
    streams.acquire("iptv:a", "a", "live", "ARD", timedelta(seconds=30))
    freezer.tick(20)
    streams.touch("iptv:a", timedelta(seconds=30))

    freezer.tick(20)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(streams.active()) == 1

    freezer.tick(20)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert streams.active() == []
    assert changes == [1, 0]


async def test_close_tells_panel_players(streams):
    ended = []
    streams.acquire("panel:1", "Ann", "live", "ARD", on_end=lambda: ended.append(1))
    streams.acquire("iptv:a", "a", "live", "ZDF", HOUR)

    streams.close()

    assert ended == [1]
    assert streams.active() == []

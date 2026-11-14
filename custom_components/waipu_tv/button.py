"""Reload channels, favorites, recordings and the guide from waipu.tv."""

import asyncio

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ChannelsCoordinator, WaipuTvConfigEntry
from .entity import WaipuTvEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: WaipuTvConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([RefreshButton(entry.runtime_data.channels, "refresh")])


class RefreshButton(WaipuTvEntity[ChannelsCoordinator], ButtonEntity):
    async def async_press(self) -> None:
        data = self.coordinator.config_entry.runtime_data
        await asyncio.gather(
            data.channels.async_request_refresh(), data.recordings.async_request_refresh()
        )
        # thousands of requests for a full guide: don't keep the button waiting
        self.coordinator.config_entry.async_create_background_task(
            self.hass, data.guide.async_reload(), "waipu.tv guide reload"
        )

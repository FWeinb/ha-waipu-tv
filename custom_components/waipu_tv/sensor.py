"""Subscription, recording storage, number of finished recordings and active streams."""

from typing import Any, override

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ChannelsCoordinator, RecordingsCoordinator, WaipuTvConfigEntry
from .entity import WaipuTvEntity
from .streams import Streams

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: WaipuTvConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    data = entry.runtime_data
    async_add_entities(
        [
            SubscriptionSensor(data.channels, "subscription"),
            RecordingStorageSensor(data.recordings, "recording_storage"),
            RecordingsSensor(data.recordings, "recordings"),
            ActiveStreamsSensor(data.channels, "active_streams"),
        ]
    )


class SubscriptionSensor(WaipuTvEntity[ChannelsCoordinator], SensorEntity):
    @property
    def native_value(self) -> str | None:
        return self.coordinator.data.account.subscription


class RecordingStorageSensor(WaipuTvEntity[RecordingsCoordinator], SensorEntity):
    """Hours used by finished recordings; the booked hours as an attribute."""

    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_suggested_display_precision = 1
    _attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def native_value(self) -> float:
        return round(self.coordinator.data.recorded_seconds / 3600, 2)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"booked_hours": self.coordinator.data.booked_hours}


class RecordingsSensor(WaipuTvEntity[RecordingsCoordinator], SensorEntity):
    """Number of finished recordings."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def native_value(self) -> int:
        return sum(r.status == "FINISHED" for r in self.coordinator.data.recordings)


class ActiveStreamsSensor(WaipuTvEntity[ChannelsCoordinator], SensorEntity):
    """Streams playing now, in the panel and IPTV players; updated as they start and stop."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    @override
    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self._streams.add_listener(self.async_write_ha_state))

    @property
    def _streams(self) -> Streams:
        return self.coordinator.config_entry.runtime_data.streams

    @property
    def native_value(self) -> int:
        return len(self._streams.active())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "maximum": self._streams.maximum,
            "streams": [
                {
                    "slot": s.slot,
                    "type": s.kind,
                    "title": s.title,
                    "viewer": s.viewer,
                    "since": s.started.isoformat(),
                }
                for s in self._streams.active()
            ],
        }

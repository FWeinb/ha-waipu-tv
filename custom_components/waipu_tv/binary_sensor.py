"""On while a recording runs."""

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import RecordingsCoordinator, WaipuTvConfigEntry
from .entity import WaipuTvEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: WaipuTvConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([RecordingBinarySensor(entry.runtime_data.recordings, "recording")])


class RecordingBinarySensor(WaipuTvEntity[RecordingsCoordinator], BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.RUNNING

    @property
    def is_on(self) -> bool:
        return any(r.status == "RECORDING" for r in self.coordinator.data.recordings)

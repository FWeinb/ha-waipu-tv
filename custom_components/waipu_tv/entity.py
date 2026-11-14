"""Base entity: everything belongs to one "waipu.tv" service device."""

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import WaipuTvCoordinator


class WaipuTvEntity[C: WaipuTvCoordinator](CoordinatorEntity[C]):
    _attr_has_entity_name = True

    def __init__(self, coordinator: C, key: str) -> None:
        super().__init__(coordinator)
        entry = coordinator.config_entry
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            entry_type=DeviceEntryType.SERVICE,
            manufacturer="Exaring AG",
            name="waipu.tv",
            configuration_url="https://play.waipu.tv",
        )

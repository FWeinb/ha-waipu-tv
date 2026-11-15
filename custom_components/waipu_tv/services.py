"""Actions: record a program or series, stop a series, delete recordings, set a favorite."""

import probatio

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .coordinator import loaded_data

ATTR_PROGRAM_ID = "program_id"
ATTR_RECORDING_IDS = "recording_ids"
ATTR_CHANNEL = "channel"
ATTR_FAVORITE = "favorite"

PROGRAM_SCHEMA = probatio.Schema({probatio.Required(ATTR_PROGRAM_ID): cv.string})
DELETE_SCHEMA = probatio.Schema(
    {probatio.Required(ATTR_RECORDING_IDS): probatio.All(cv.ensure_list, [cv.string])}
)
FAVORITE_SCHEMA = probatio.Schema(
    {probatio.Required(ATTR_CHANNEL): cv.string, probatio.Required(ATTR_FAVORITE): cv.boolean}
)


async def _record_program(call: ServiceCall) -> None:
    await loaded_data(call.hass).async_record_program(call.data[ATTR_PROGRAM_ID])


async def _record_series(call: ServiceCall) -> None:
    await loaded_data(call.hass).async_record_series(call.data[ATTR_PROGRAM_ID])


async def _cancel_series(call: ServiceCall) -> None:
    await loaded_data(call.hass).async_cancel_series(call.data[ATTR_PROGRAM_ID])


async def _delete_recordings(call: ServiceCall) -> None:
    await loaded_data(call.hass).async_delete_recordings(call.data[ATTR_RECORDING_IDS])


async def _set_favorite(call: ServiceCall) -> None:
    await loaded_data(call.hass).async_set_favorite(
        call.data[ATTR_CHANNEL], call.data[ATTR_FAVORITE]
    )


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    hass.services.async_register(DOMAIN, "record_program", _record_program, PROGRAM_SCHEMA)
    hass.services.async_register(DOMAIN, "record_series", _record_series, PROGRAM_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_series", _cancel_series, PROGRAM_SCHEMA)
    hass.services.async_register(DOMAIN, "delete_recordings", _delete_recordings, DELETE_SCHEMA)
    hass.services.async_register(DOMAIN, "set_favorite", _set_favorite, FAVORITE_SCHEMA)

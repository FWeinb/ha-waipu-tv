"""Diagnostics download, without login data, the access key or the account's identity."""

from collections import Counter
from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from .const import CONF_ACCESS_KEY, CONF_DEVICE_ID, CONF_REFRESH_TOKEN
from .coordinator import WaipuTvConfigEntry

TO_REDACT = {CONF_ACCESS_KEY, CONF_DEVICE_ID, CONF_REFRESH_TOKEN, "email", "user_handle"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: WaipuTvConfigEntry
) -> dict[str, Any]:
    data = entry.runtime_data
    channels = data.channels.data
    recordings = data.recordings.data
    return {
        "options": async_redact_data(dict(entry.options), TO_REDACT),
        "account": {
            "subscription": channels.account.subscription,
            "instant_restart": channels.account.instant_restart,
            "booked_hours": recordings.booked_hours,
        },
        "channels": {
            "total": len(channels.channels),
            "visible": sum(c.visible for c in channels.channels),
            "favorites": sum(c.favorite for c in channels.channels),
            "on_demand": sum(c.vod for c in channels.channels),
            "hls": sum(c.hls for c in channels.channels),
        },
        "guide": {
            **data.guide.guide.status(),
            "channels": len(data.guide.channels()),
            "range": [t.isoformat() for t in data.guide.range()],
        },
        "recordings": dict(Counter(r.status for r in recordings.recordings)),
        "last_errors": [{"time": t.isoformat(), "error": e} for t, e in data.client.errors],
    }

"""Websocket commands for the panel; Home Assistant handles login and permissions."""

import base64
from dataclasses import asdict
from datetime import datetime
from typing import Any

import probatio

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .api import Program, Recording
from .api.playlist import FILTERS
from .const import (
    CONF_ACCESS_KEY,
    CONF_HLS_PROXY,
    CONF_PLAYLISTS,
    CONF_TIMESHIFT,
    DOMAIN,
)
from .coordinator import WaipuTvData, loaded_data

type Connection = websocket_api.ActiveConnection


@callback
def async_setup_websocket(hass: HomeAssistant) -> None:
    for command in (
        ws_channels,
        ws_guide,
        ws_program,
        ws_recordings,
        ws_record,
        ws_cancel_series,
        ws_delete_recordings,
        ws_set_favorite,
        ws_playlists,
        ws_stream,
        ws_recording_stream,
        ws_license,
        ws_fairplay_certificate,
    ):
        websocket_api.async_register_command(hass, command)


def _time(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _program(p: Program) -> dict[str, Any]:
    return {**asdict(p), "start": _time(p.start), "stop": _time(p.stop)}


def _recording(r: Recording) -> dict[str, Any]:
    return {
        **asdict(r),
        "start": _time(r.start),
        "duration": int(r.duration.total_seconds()),
    }


@websocket_api.websocket_command({probatio.Required("type"): f"{DOMAIN}/channels"})
@callback
def ws_channels(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """All channels of the account, favorites marked, in the account's order."""
    data = loaded_data(hass).channels.data
    connection.send_result(
        msg["id"],
        {
            "subscription": data.account.subscription,
            "instant_restart": data.account.instant_restart,
            "channels": [asdict(c) for c in data.channels],
        },
    )


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/guide",
        probatio.Required("start"): cv.datetime,
        probatio.Required("end"): cv.datetime,
        probatio.Optional("channels"): [cv.string],
    }
)
@websocket_api.async_response
async def ws_guide(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """Programs of the imported channels (or the given ones) within the guide's days."""
    data = loaded_data(hass)
    guide_start, guide_end = data.guide.range()
    start = max(dt_util.as_utc(msg["start"]), guide_start)
    end = min(dt_util.as_utc(msg["end"]), guide_end)
    channel_ids = msg.get("channels") or [c.id for c in data.guide.channels()]
    programs = await data.guide.guide.programs(channel_ids, start, end) if start < end else {}
    connection.send_result(
        msg["id"],
        {
            "start": _time(guide_start),
            "end": _time(guide_end),
            "days": [_time(day) for day in data.guide.days()],
            "programs": {cid: [_program(p) for p in ps] for cid, ps in programs.items()},
        },
    )


@websocket_api.websocket_command(
    {probatio.Required("type"): f"{DOMAIN}/program", probatio.Required("program_id"): cv.string}
)
@websocket_api.async_response
async def ws_program(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """waipu.tv's full program details (description, cast, images) for the program dialog."""
    data = loaded_data(hass)
    connection.send_result(msg["id"], await data.client.program_details(msg["program_id"]))


@websocket_api.websocket_command({probatio.Required("type"): f"{DOMAIN}/recordings"})
@callback
def ws_recordings(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    data = loaded_data(hass).recordings.data
    connection.send_result(
        msg["id"],
        {
            "recordings": [_recording(r) for r in data.recordings],
            "recorded_hours": round(data.recorded_seconds / 3600, 2),
            "booked_hours": data.booked_hours,
        },
    )


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/record",
        probatio.Required("program_id"): cv.string,
        probatio.Optional("series", default=False): cv.boolean,
    }
)
@websocket_api.async_response
async def ws_record(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    data: WaipuTvData = loaded_data(hass)
    if msg["series"]:
        await data.async_record_series(msg["program_id"])
    else:
        await data.async_record_program(msg["program_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/cancel_series",
        probatio.Required("program_id"): cv.string,
    }
)
@websocket_api.async_response
async def ws_cancel_series(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    await loaded_data(hass).async_cancel_series(msg["program_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/delete_recordings",
        probatio.Required("recording_ids"): [cv.string],
    }
)
@websocket_api.async_response
async def ws_delete_recordings(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    await loaded_data(hass).async_delete_recordings(msg["recording_ids"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/set_favorite",
        probatio.Required("channel"): cv.string,
        probatio.Required("favorite"): cv.boolean,
    }
)
@websocket_api.async_response
async def ws_set_favorite(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    await loaded_data(hass).async_set_favorite(msg["channel"], msg["favorite"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({probatio.Required("type"): f"{DOMAIN}/playlists"})
@websocket_api.require_admin
@callback
def ws_playlists(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """Playlist and guide paths; they contain the access key, hence admins only. The panel
    prefixes its own address, the same one players on that network reach."""
    data = loaded_data(hass)
    entry = data.channels.config_entry
    base = f"/api/{DOMAIN}"
    key = entry.options[CONF_ACCESS_KEY]
    urls = {
        **{name: f"{base}/{name}.m3u?key={key}" for name in FILTERS},
        "recordings": f"{base}/recordings.m3u?key={key}",
        "epg": f"{base}/epg.xml?key={key}",
    }
    connection.send_result(
        msg["id"],
        {
            "enabled": entry.options[CONF_PLAYLISTS],
            "entry_id": entry.entry_id,
            "urls": urls,
            # defaults of the per-playlist options, for the panel's explanation
            "defaults": {
                "timeshift": entry.options[CONF_TIMESHIFT],
                "hls_proxy": entry.options[CONF_HLS_PROXY],
            },
            "instant_restart": data.channels.data.account.instant_restart,
        },
    )


# --- player: stream URLs and DRM licenses, for every user who can open the panel ---------------

PROTOCOL = probatio.In(["dash", "hls"])


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/stream",
        probatio.Required("channel"): cv.string,
        probatio.Required("protocol"): PROTOCOL,
        probatio.Optional("from_start", default=False): cv.boolean,
    }
)
@websocket_api.async_response
async def ws_stream(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """A fresh stream URL; from_start plays the running program from its start (time-shift)."""
    url = await loaded_data(hass).async_stream_url(
        msg["channel"], msg["protocol"], msg["from_start"]
    )
    connection.send_result(msg["id"], {"url": url})


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/recording_stream",
        probatio.Required("recording_id"): cv.string,
        probatio.Required("protocol"): PROTOCOL,
    }
)
@websocket_api.async_response
async def ws_recording_stream(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    url = await loaded_data(hass).async_recording_url(msg["recording_id"], msg["protocol"])
    connection.send_result(msg["id"], {"url": url})


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/license",
        probatio.Required("system"): probatio.In(["widevine", "fairplay"]),
        probatio.Required("challenge"): cv.string,
    }
)
@websocket_api.async_response
async def ws_license(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """Relays the player's license request; binary data travels as base64."""
    license_ = await loaded_data(hass).async_license(
        msg["system"], base64.b64decode(msg["challenge"])
    )
    connection.send_result(msg["id"], {"license": base64.b64encode(license_).decode()})


@websocket_api.websocket_command({probatio.Required("type"): f"{DOMAIN}/fairplay_certificate"})
@websocket_api.async_response
async def ws_fairplay_certificate(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    certificate = await loaded_data(hass).async_fairplay_certificate()
    connection.send_result(msg["id"], {"certificate": base64.b64encode(certificate).decode()})

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

from .api import MediathekItem, Program, Recording
from .api.client import MEDIATHEK_SORTS
from .api.playlist import FILTERS
from .const import (
    AUDIO_DEFAULT,
    CONF_ACCESS_KEY,
    CONF_AUDIO_LANGUAGE,
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
        ws_mediathek_categories,
        ws_mediathek,
        ws_mediathek_series,
        ws_mediathek_content,
        ws_stream,
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


def _mediathek_item(i: MediathekItem) -> dict[str, Any]:
    return {
        **asdict(i),
        "duration": int(i.duration.total_seconds()),
        "expires": _time(i.expires),
    }


@websocket_api.websocket_command({probatio.Required("type"): f"{DOMAIN}/channels"})
@callback
def ws_channels(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """All channels of the account, favorites marked, in the account's order, and the player's
    default audio language (users can override it; the panel keeps that in their user data)."""
    coordinator = loaded_data(hass).channels
    data = coordinator.data
    language = coordinator.config_entry.options.get(CONF_AUDIO_LANGUAGE, AUDIO_DEFAULT)
    connection.send_result(
        msg["id"],
        {
            "subscription": data.account.subscription,
            "channels": [asdict(c) for c in data.channels],
            "audio_language": None if language == AUDIO_DEFAULT else language,
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
    prefixes its own address, the same one players on that network reach. base and key let it
    put together other playlists: one per Mediathek category, and custom ones."""
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
            "base": base,
            "key": key,
            # defaults of the per-playlist options, for the panel's explanation
            "defaults": {
                "timeshift": entry.options[CONF_TIMESHIFT],
                "hls_proxy": entry.options[CONF_HLS_PROXY],
            },
            "instant_restart": data.channels.data.account.instant_restart,
        },
    )


# --- Mediathek: the on-demand library ---------------------------------------------------------


@websocket_api.websocket_command({probatio.Required("type"): f"{DOMAIN}/mediathek_categories"})
@websocket_api.async_response
async def ws_mediathek_categories(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    categories = await loaded_data(hass).async_mediathek_categories()
    connection.send_result(
        msg["id"],
        {
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "genres": [{"id": id_, "name": name} for id_, name in c.genres],
                }
                for c in categories
            ]
        },
    )


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/mediathek",
        probatio.Required("category"): cv.string,
        probatio.Optional("sort", default="mostWatched"): probatio.In(MEDIATHEK_SORTS),
        probatio.Optional("genre"): cv.string,
        probatio.Optional("page", default=0): probatio.All(int, probatio.Range(min=0)),
    }
)
@websocket_api.async_response
async def ws_mediathek(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """One page of a category's cards (titles and seasons of series) and whether more follow."""
    items, more = await loaded_data(hass).async_mediathek_page(
        msg["category"], msg["sort"], msg.get("genre"), msg["page"]
    )
    connection.send_result(
        msg["id"], {"items": [_mediathek_item(i) for i in items], "more": more}
    )


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/mediathek_series",
        probatio.Required("season_id"): cv.string,
    }
)
@websocket_api.async_response
async def ws_mediathek_series(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    """The series of a season: all its seasons with their episodes, so the panel switches
    seasons without asking again."""
    series = await loaded_data(hass).async_mediathek_series(msg["season_id"])
    connection.send_result(
        msg["id"],
        {
            "channel": series.channel,
            "title": series.title,
            "seasons": [
                {
                    "id": season.id,
                    "title": season.title,
                    "season": season.number,
                    "episodes": [
                        {
                            **asdict(e),
                            "duration": int(e.duration.total_seconds()),
                            "expires": _time(e.expires),
                        }
                        for e in season.episodes
                    ],
                }
                for season in series.seasons
            ],
        },
    )


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/mediathek_content",
        probatio.Required("content_id"): cv.string,
    }
)
@websocket_api.async_response
async def ws_mediathek_content(
    hass: HomeAssistant, connection: Connection, msg: dict[str, Any]
) -> None:
    """A title's details for the player's info card."""
    doc = await loaded_data(hass).async_mediathek_content(msg["content_id"])
    images = doc.get("previewImages") or []
    connection.send_result(
        msg["id"],
        {
            "id": msg["content_id"],
            "title": doc.get("title") or "",
            "description": doc.get("description") or "",
            "channel": doc.get("channelDisplay"),
            "station_id": doc.get("stationId"),
            "genre": doc.get("genreDisplayName") or doc.get("genre"),
            "duration": int(doc.get("duration") or 0) * 60,
            "image": images[0] if images else None,
        },
    )


# --- player: stream URLs and DRM licenses, for every user who can open the panel ---------------

PROTOCOL = probatio.In(["dash", "hls"])


@websocket_api.websocket_command(
    {
        probatio.Required("type"): f"{DOMAIN}/stream",
        probatio.Exclusive("channel", "target"): cv.string,
        probatio.Exclusive("recording_id", "target"): cv.string,
        probatio.Exclusive("mediathek", "target"): cv.string,
        probatio.Required("protocol"): PROTOCOL,
    }
)
@websocket_api.async_response
async def ws_stream(hass: HomeAssistant, connection: Connection, msg: dict[str, Any]) -> None:
    """A subscription for as long as the player plays: it holds a parallel-stream slot (see
    streams.py), and its first event is a fresh URL from that slot's device. Live channels play
    time-shifted when the account has instant restart: the stream reaches back to the running
    program's start, and the player opens it at its live edge (or at its start, From start).
    On-demand channels' events also carry "start", the clock time at the stream's position 0
    (see Data.asset_start), when the guide has it. An "ended" event means the integration
    unloaded and the slot is gone."""
    data = loaded_data(hass)
    recording_id = msg.get("recording_id")
    content_id = msg.get("mediathek")
    if content_id is not None:
        content = await data.async_mediathek_content(content_id)
        kind, title = "mediathek", str(content.get("title") or content_id)
    elif recording_id is not None:
        kind, title = "recording", data.recording_title(recording_id)
    elif "channel" in msg:
        channel = data.channel(msg["channel"])
        kind, title = "live", channel.name
    else:
        connection.send_error(msg["id"], "invalid_format", "channel, recording_id or mediathek")
        return
    holder = f"panel:{id(connection)}:{msg['id']}"
    slot = data.streams.acquire(
        holder,
        connection.user.name or "",
        kind,
        title,
        on_end=lambda: connection.send_message(
            websocket_api.event_message(msg["id"], {"ended": True})
        ),
    )
    # registered first: a connection that closes meanwhile still gives the slot back
    connection.subscriptions[msg["id"]] = lambda: data.streams.release(holder)
    event: dict[str, Any] = {}
    try:
        if content_id is not None:
            url = await data.async_mediathek_url(
                content["streamUrlProvider"], msg["protocol"], slot
            )
        elif recording_id is not None:
            url = await data.async_recording_url(recording_id, msg["protocol"], slot)
        else:
            if channel.vod and (start := await data.asset_start(channel)):
                event["start"] = start.isoformat()
            timeshift = data.channels.data.account.instant_restart
            url = await data.async_stream_url(channel, msg["protocol"], timeshift, slot)
    except Exception:
        connection.subscriptions.pop(msg["id"], None)
        data.streams.release(holder)
        raise
    connection.send_result(msg["id"])
    connection.send_message(websocket_api.event_message(msg["id"], {"url": url, **event}))


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

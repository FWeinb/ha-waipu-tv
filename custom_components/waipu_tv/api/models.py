"""waipu.tv data, parsed from the API responses (field names as in pvr.waipu and ha-waipu)."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from importlib import resources
from typing import Any


def _load_hls_allowlist() -> frozenset[str]:
    """Stations pvr.waipu plays via HLS without DRM; everything else is DASH + Widevine."""
    text = resources.files(__package__).joinpath("hls_allowlist.txt").read_text()
    return frozenset(line.strip() for line in text.splitlines() if line.strip())


HLS_ALLOWLIST = _load_hls_allowlist()


def parse_time(value: Any) -> datetime | None:
    """waipu.tv's ISO 8601 times, e.g. 2019-02-03T18:05:00.000Z, as aware datetimes."""
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _str(value: Any) -> str | None:
    return str(value) if value not in (None, "") else None


def _image(value: Any) -> str | None:
    """Image URLs come as templates with a ${resolution} placeholder."""
    url = _str(value)
    return url.replace("${resolution}", "480x270") if url else None


@dataclass(frozen=True)
class Channel:
    id: str  # lowercase station id, e.g. "ard"
    name: str
    number: int  # position in the user's channel list
    logo: str
    favorite: bool
    visible: bool
    vod: bool  # "newTv" on-demand channel
    hls: bool  # playable via HLS without DRM; otherwise DASH + Widevine

    @property
    def station(self) -> str:
        """The stream and recording APIs expect upper case station ids."""
        return self.id.upper()


def parse_channels(station_config: dict[str, Any], user_stations: list[Any]) -> list[Channel]:
    """Join the public station config with the account's station list, in the account's order."""
    configs = {s.get("id"): s for s in station_config.get("stations") or []}
    channels = []
    for number, station in enumerate(user_stations, start=1):
        sid = station.get("stationId")
        config = configs.get(sid)
        if not sid or station.get("locked") or config is None:
            continue
        settings = station.get("userSettings") or {}
        logo = (
            (config.get("logoTemplateUrl") or "")
            .replace("${streamQuality}", station.get("streamQuality") or "")
            .replace("${shape}", "standard")
            .replace("${resolution}", "320x180")
        )
        channels.append(
            Channel(
                id=sid.lower(),
                name=station.get("displayName") or sid,
                number=number,
                logo=logo,
                favorite=bool(settings.get("favorite", False)),
                visible=bool(settings.get("visible", True)),
                vod=bool(config.get("newTv", False)),
                hls=sid.upper() in HLS_ALLOWLIST,
            )
        )
    return channels


@dataclass(frozen=True)
class Program:
    """A guide entry from the EPG grid."""

    id: str
    channel_id: str
    title: str
    episode_title: str | None
    genre: str | None
    start: datetime
    stop: datetime
    image: str | None
    series_id: str | None
    recordable: bool


def parse_program(data: dict[str, Any], channel_id: str) -> Program | None:
    """None for entries without id or times; one bad entry must not break the window."""
    start, stop = parse_time(data.get("startTime")), parse_time(data.get("stopTime"))
    if not data.get("id") or start is None or stop is None:
        return None
    return Program(
        id=str(data["id"]),
        channel_id=channel_id,
        title=str(data.get("title") or ""),
        episode_title=_str(data.get("episodeTitle")),
        genre=_str(data.get("genre")),
        start=start,
        stop=stop,
        image=_image(data.get("previewImage")),
        series_id=_str(data.get("seriesId")),
        recordable=not data.get("recordingForbidden", False),
    )


@dataclass(frozen=True)
class Recording:
    id: str
    program_id: str | None
    channel_id: str  # lowercase, like Channel.id
    title: str
    episode_title: str | None
    status: str  # SCHEDULED, RECORDING, FINISHED or FAILED
    start: datetime | None  # program start in the guide
    duration: timedelta
    group: int | None  # series recordings share a group
    image: str | None
    season: str | None
    episode: str | None


def parse_recording(data: dict[str, Any]) -> Recording | None:
    if not data.get("id") or data.get("locked"):
        return None
    group = data.get("recordingGroup")
    return Recording(
        id=str(data["id"]),
        program_id=_str(data.get("programId")),
        channel_id=str(data.get("stationId") or "").lower(),
        title=str(data.get("title") or ""),
        episode_title=_str(data.get("episodeTitle")),
        status=str(data.get("status") or ""),
        start=parse_time(data.get("epgStartTime")),
        duration=timedelta(seconds=int(data.get("durationSeconds") or 0)),
        group=group if isinstance(group, int) else None,
        image=_image(data.get("previewImage")),
        season=_str(data.get("season")),
        episode=_str(data.get("episode")),
    )

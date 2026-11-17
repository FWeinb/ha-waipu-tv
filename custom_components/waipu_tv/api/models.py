"""waipu.tv data, parsed from the API responses (field names as in pvr.waipu and ha-waipu)."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from importlib import resources
from typing import Any
from urllib.parse import parse_qs, urlsplit


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
class ProgramDetails:
    """What the program API adds to a guide entry, as pvr.waipu reads it."""

    description: str | None
    year: str | None
    season: str | None
    episode: str | None
    cast: tuple[tuple[str, str | None], ...]  # (name, role)


def parse_program_details(data: dict[str, Any]) -> ProgramDetails:
    text = data.get("textContent") or {}
    production = data.get("production") or {}
    series = data.get("series") or {}
    members = production.get("castMembers")
    cast = tuple(
        (str(m["name"]), _str(m.get("role")))
        for m in (members if isinstance(members, list) else [])
        if isinstance(m, dict) and m.get("name")
    )
    return ProgramDetails(
        description=_str(text.get("descLong")) or _str(text.get("descShort")),
        year=_str(production.get("year")),
        season=_str(series.get("seasonNumber")),
        episode=_str(series.get("episodeNumber")),
        cast=cast,
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


@dataclass(frozen=True)
class MediathekCategory:
    id: str
    name: str
    genres: tuple[tuple[str, str], ...]  # (id, name)


def parse_mediathek_category(data: dict[str, Any]) -> MediathekCategory | None:
    if not data.get("categoryId"):
        return None
    genres = tuple(
        (str(g["genreId"]), str(g.get("displayName") or g["genreId"]))
        for g in data.get("genres") or []
        if isinstance(g, dict) and g.get("genreId")
    )
    return MediathekCategory(
        id=str(data["categoryId"]),
        name=str(data.get("displayName") or data["categoryId"]),
        genres=genres,
    )


@dataclass(frozen=True)
class MediathekItem:
    """A card in a Mediathek (on-demand library) category: a title to play, or a season of a
    series, which lists its episodes (MediathekSeason)."""

    # a title's content id, "<collection>:<category>:<video>"; a season's "<collection>:<category>"
    id: str
    title: str
    image: str | None
    genre: str | None
    duration: timedelta  # titles only
    channel: str | None
    expires: datetime | None
    series: bool
    season: int | None  # seasons only


def parse_mediathek_item(data: dict[str, Any]) -> MediathekItem | None:
    """End cards ("more") aren't titles; locked titles aren't in the package. A season's card
    names its collection and category in the app link (channelId, categoryId); its tracking id
    doesn't always."""
    tracking = str(data.get("trackingContentId") or "")
    if not tracking.startswith("vod/") or data.get("locked"):
        return None
    series = bool(data.get("series"))
    if series:
        query = parse_qs(urlsplit(str(data.get("url") or "")).query)
        collection, category = query.get("channelId", [""])[0], query.get("categoryId", [""])[0]
        if not (collection and category):
            return None
        id_ = f"{collection}:{category}"
    else:
        id_ = tracking.removeprefix("vod/")
    season = data.get("season")
    return MediathekItem(
        id=id_,
        title=str(data.get("title") or ""),
        image=_str(data.get("img")),
        genre=_str(data.get("genre")),
        duration=timedelta(minutes=int(data.get("duration") or 0)),
        channel=_str(data.get("channelDisplay")),
        expires=parse_time(data.get("expiresAt")),
        series=series,
        season=season if isinstance(season, int) else None,
    )


@dataclass(frozen=True)
class MediathekEpisode:
    id: str  # content id, played like a title
    title: str
    description: str | None
    image: str | None
    season: int | None
    episode: int | None
    duration: timedelta
    expires: datetime | None


@dataclass(frozen=True)
class MediathekSeason:
    id: str  # "<collection>:<category>", like the season's MediathekItem
    title: str
    number: int | None
    episodes: tuple[MediathekEpisode, ...]


@dataclass(frozen=True)
class MediathekSeries:
    """A series with all its seasons and their episodes, as one collection holds them."""

    channel: str | None  # the collection's name, e.g. "13th Street"
    title: str
    seasons: tuple[MediathekSeason, ...]


def _episode(data: dict[str, Any]) -> MediathekEpisode | None:
    video = data.get("video")
    if data.get("type") != "tvfuse:video" or not isinstance(video, dict) or not video.get("id"):
        return None
    if video.get("locked"):
        return None
    window = data.get("publicationWindow") or {}
    return MediathekEpisode(
        id=str(video["id"]),
        title=str(video.get("title") or ""),
        description=_str(video.get("description")),
        image=_str(video.get("img")),
        season=video.get("season") if isinstance(video.get("season"), int) else None,
        episode=video.get("episode") if isinstance(video.get("episode"), int) else None,
        duration=timedelta(milliseconds=int(video.get("duration") or 0)),
        expires=parse_time(window.get("publishedUntil")),
    )


def parse_mediathek_series(
    microsite: dict[str, Any], collection: str, category: str
) -> MediathekSeries | None:
    """The series of a season out of a collection's microsite: its categories are seasons, each
    with its episodes, and a series' seasons are the categories whose episodes share a
    seriesId (a collection holds several series)."""
    categories = [c for c in microsite.get("categories") or [] if isinstance(c, dict)]
    found = next((c for c in categories if c.get("id") == category), None)
    if found is None:
        return None

    def episodes(c: dict[str, Any]) -> tuple[MediathekEpisode, ...]:
        parsed = (_episode(e) for e in c.get("contents") or [] if isinstance(e, dict))
        listed = (e for e in parsed if e)
        return tuple(sorted(listed, key=lambda e: (e.season or 0, e.episode or 0)))

    def series_of(c: dict[str, Any]) -> tuple[str | None, str | None]:
        videos = (e.get("video") for e in c.get("contents") or [] if isinstance(e, dict))
        video = next((v for v in videos if isinstance(v, dict)), {})
        return _str(video.get("seriesId")), _str(video.get("seriesTitle"))

    series_id, series_title = series_of(found)
    seasons = []
    for c in categories:
        if c is found or (series_id and series_of(c)[0] == series_id):
            listed = episodes(c)
            number = listed[0].season if listed else None
            title = str(c.get("title") or "")
            seasons.append(MediathekSeason(f"{collection}:{c['id']}", title, number, listed))
    seasons.sort(key=lambda s: (s.number is None, s.number or 0, s.title))
    return MediathekSeries(
        channel=_str(microsite.get("title")),
        title=series_title or str(found.get("title") or ""),
        seasons=tuple(seasons),
    )

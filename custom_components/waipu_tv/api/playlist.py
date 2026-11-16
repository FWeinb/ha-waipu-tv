"""M3U, XMLTV and HLS playlist rendering for IPTV players."""

from collections.abc import Callable, Iterable, Mapping
from datetime import UTC, datetime
import re
from urllib.parse import quote, urljoin
from xml.sax.saxutils import escape, quoteattr

from .models import Channel, Program, ProgramDetails, Recording

FILTERS = ("all", "favorites", "live", "vod")


def select_channels(
    channels: Iterable[Channel], selection: str = "all", hidden: bool = False, drm: bool = True
) -> list[Channel]:
    """The channel filters pvr.waipu offers."""
    if selection not in FILTERS:
        raise ValueError(f"filter must be one of {', '.join(FILTERS)}")
    return [
        c
        for c in channels
        if (hidden or c.visible)
        and (selection != "favorites" or c.favorite)
        and (selection != "live" or not c.vod)
        and (selection != "vod" or c.vod)
        and (drm or c.hls)
    ]


def channel_protocol(channel: Channel, protocol: str = "auto") -> str:
    if protocol == "auto":
        return "hls" if channel.hls else "dash"
    return protocol


def _with_key(url: str, key: str) -> str:
    return url + ("&" if "?" in url else "?") + "key=" + quote(key)


def _with_params(url: str, params: dict[str, str | None]) -> str:
    """Append params, None values skipped."""
    query = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)
    return url + ("?" + query if query else "")


def _dash_props(base_url: str, key: str) -> list[str]:
    # Widevine protected MPEG-DASH: the player decrypts with its own CDM; Home Assistant only
    # relays the license request (adding waipu.tv's custom data header and unwrapping JSON)
    license_url = _with_key(base_url + "/license", key)
    return [
        "#KODIPROP:inputstream=inputstream.adaptive",
        "#KODIPROP:inputstream.adaptive.manifest_type=mpd",
        "#KODIPROP:mimetype=application/dash+xml",
        "#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha",
        f"#KODIPROP:inputstream.adaptive.license_key={license_url}||R{{SSM}}|",
        f"#KODIPROP:inputstream.adaptive.drm_legacy=com.widevine.alpha|{license_url}",
    ]


def render_m3u(
    channels: Iterable[Channel],
    base_url: str,
    key: str,
    epg_url: str,
    protocol: str = "auto",
    hls_proxy: bool | None = None,
    timeshift: bool = False,
    restart: bool = False,
) -> str:
    """hls_proxy: True/False adds proxy=1/0 to HLS stream URLs, None keeps the server default.
    timeshift: live channels' streams reach back to the start of the running program; on-demand
    channels always do when restart, the account's instant restart, allows it.
    No catch-up attributes: waipu.tv can't play programs from the guide's past."""
    epg_url = _with_key(epg_url, key)
    lines = [f'#EXTM3U url-tvg="{epg_url}" x-tvg-url="{epg_url}"']
    for ch in channels:
        groups = (["Favoriten"] if ch.favorite else []) + ["VoD" if ch.vod else "Live TV"]
        name = ch.name.replace(",", " ")
        is_dash = channel_protocol(ch, protocol) == "dash"
        stream = f"{base_url}/stream/{ch.id}.{'mpd' if is_dash else 'm3u8'}"
        proxy = None if is_dash or hls_proxy is None else ("1" if hls_proxy else "0")
        attrs = (
            f'tvg-id="{ch.id}" tvg-chno="{ch.number}" tvg-name="{name}" '
            f'tvg-logo="{ch.logo}" group-title="{";".join(groups)}"'
        )
        lines.append(f"#EXTINF:-1 {attrs},{name}")
        if is_dash:
            lines += _dash_props(base_url, key)
        shift = restart if ch.vod else timeshift
        live = {"proxy": proxy, "timeshift": "1" if shift else None}
        lines.append(_with_key(_with_params(stream, live), key))
    return "\n".join(lines) + "\n"


def render_recordings_m3u(
    recordings: Iterable[Recording], base_url: str, key: str, protocol: str = "dash"
) -> str:
    lines = ["#EXTM3U"]
    ext = "mpd" if protocol == "dash" else "m3u8"
    for rec in recordings:
        title = rec.title or rec.id
        if rec.season and rec.episode:
            title += f" S{rec.season}E{rec.episode}"
        if rec.episode_title:
            title += f" – {rec.episode_title}"
        if rec.start:
            title += f" ({rec.start:%Y-%m-%d})"
        group = (rec.title if rec.group is not None else "") or "Aufnahmen"
        lines.append(
            f"#EXTINF:{int(rec.duration.total_seconds()) or -1} "
            f'tvg-logo="{rec.image or ""}" group-title="{group.replace(chr(34), "")}",'
            + title.replace(",", " ")
        )
        if protocol == "dash":
            lines += _dash_props(base_url, key)
        lines.append(_with_key(f"{base_url}/recording/{quote(rec.id, safe='')}.{ext}", key))
    return "\n".join(lines) + "\n"


# --- HLS ----------------------------------------------------------------------------------------

_URI_ATTR = re.compile(r'URI="([^"]+)"')


def rewrite_hls(playlist: str, playlist_url: str, proxy: Callable[[str], str]) -> str:
    """Make all URIs in an HLS playlist absolute.

    Nested playlists (variants, alternative renditions) are passed through proxy(url), because
    waipu.tv's edge reportedly rejects playlist requests without gzip, which ffmpeg-based players
    don't send. Segments, keys and init sections stay direct links to the CDN.
    """
    is_master = "#EXT-X-STREAM-INF" in playlist
    nested_tags = ("#EXT-X-MEDIA", "#EXT-X-I-FRAME-STREAM-INF")
    out = []
    for line in playlist.splitlines():
        stripped = line.strip()
        if not stripped:
            out.append(line)
        elif stripped.startswith("#"):
            nested = is_master and stripped.startswith(nested_tags)

            def repl(m: re.Match[str], nested: bool = nested) -> str:
                url = urljoin(playlist_url, m.group(1))
                return f'URI="{proxy(url) if nested else url}"'

            out.append(_URI_ATTR.sub(repl, line))
        else:
            url = urljoin(playlist_url, stripped)
            out.append(proxy(url) if is_master else url)
    return "\n".join(out) + "\n"


# --- XMLTV --------------------------------------------------------------------------------------


def _xmltv_time(value: datetime) -> str:
    return value.astimezone(UTC).strftime("%Y%m%d%H%M%S +0000")


def _episode_num(details: ProgramDetails) -> str | None:
    """xmltv_ns counts from zero; either part may be missing."""
    parts = [details.season, details.episode]
    if not any(parts):
        return None
    try:
        season, episode = (str(int(v) - 1) if v else "" for v in parts)
    except ValueError:
        return None
    return f"{season}.{episode}."


def render_xmltv(
    channel_programs: Iterable[tuple[Channel, list[Program]]],
    details: Mapping[str, ProgramDetails] | None = None,
) -> str:
    channel_programs = list(channel_programs)
    details = details or {}
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<tv generator-info-name="waipu.tv">']
    for ch, _ in channel_programs:
        icon = f"<icon src={quoteattr(ch.logo)}/>" if ch.logo else ""
        out.append(
            f"  <channel id={quoteattr(ch.id)}>"
            f"<display-name>{escape(ch.name)}</display-name>{icon}</channel>"
        )
    for ch, programs in channel_programs:
        for p in programs:
            if not p.title:
                continue
            out.append(
                f'  <programme start="{_xmltv_time(p.start)}" stop="{_xmltv_time(p.stop)}" '
                f"channel={quoteattr(ch.id)}>"
            )
            out.append(f"    <title>{escape(p.title)}</title>")
            if p.episode_title:
                out.append(f"    <sub-title>{escape(p.episode_title)}</sub-title>")
            # the order of the elements is fixed by the XMLTV DTD
            d = details.get(p.id)
            if d and d.description:
                out.append(f"    <desc>{escape(d.description)}</desc>")
            if d and d.cast:
                actors = "".join(
                    f"<actor{f' role={quoteattr(role)}' if role else ''}>{escape(name)}</actor>"
                    for name, role in d.cast
                )
                out.append(f"    <credits>{actors}</credits>")
            if d and d.year:
                out.append(f"    <date>{escape(d.year)}</date>")
            if p.genre:
                out.append(f"    <category>{escape(p.genre)}</category>")
            if p.image:
                out.append(f"    <icon src={quoteattr(p.image)}/>")
            if d and (episode_num := _episode_num(d)):
                out.append(f'    <episode-num system="xmltv_ns">{episode_num}</episode-num>')
            out.append("  </programme>")
    out.append("</tv>")
    return "\n".join(out) + "\n"

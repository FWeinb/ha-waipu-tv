"""Playlist server under /api/waipu_tv: M3U playlists, the XMLTV guide, stream redirects, the
Widevine license relay and the optional HLS playlist proxy.

IPTV players can't log in to Home Assistant, so the view bypasses Home Assistant's auth and
checks the access key (?key=) instead. Streams are never re-encoded or decrypted: each stream
request resolves a fresh waipu.tv URL and redirects the player to the CDN. Each IPTV client
(address and User-Agent) plays on a parallel-stream slot of its own, see streams.py.
"""

import gzip
import hashlib
import hmac
import secrets
from urllib.parse import unquote, urlencode

from aiohttp import web

from homeassistant.core import HomeAssistant
from homeassistant.helpers.http import KEY_HASS, HomeAssistantView
from homeassistant.util import dt as dt_util

from .api import Channel, WaipuError
from .api.playlist import (
    FILTERS,
    channel_protocol,
    render_m3u,
    render_recordings_m3u,
    render_xmltv,
    rewrite_hls,
    select_channels,
)
from .const import (
    CONF_ACCESS_KEY,
    CONF_HLS_PROXY,
    CONF_PLAYLISTS,
    CONF_TIMESHIFT,
    DOMAIN,
    LOGGER,
)
from .coordinator import WaipuTvConfigEntry
from .streams import HLS_PROXY_TIMEOUT, IPTV_TIMEOUT, StreamsBusy

M3U = "audio/x-mpegurl"
HLS = "application/vnd.apple.mpegurl"
EXTENSIONS = {"mpd": "dash", "m3u8": "hls"}


class BadRequest(ValueError):
    """Invalid playlist option; answered with HTTP 400."""


def _flag(query, name: str, default: bool) -> bool:
    value = query.get(name)
    if value is None:
        return default
    if value not in ("0", "1"):
        raise BadRequest(f"{name} must be 0 or 1")
    return value == "1"


class PlaylistView(HomeAssistantView):
    url = f"/api/{DOMAIN}/{{path:.+}}"
    name = f"api:{DOMAIN}:playlists"
    requires_auth = False

    def __init__(self) -> None:
        # signs proxied HLS URLs so the proxy can't be used to fetch arbitrary URLs
        self._secret = secrets.token_bytes(32)

    def _sign(self, url: str) -> str:
        return hmac.new(self._secret, url.encode(), hashlib.sha256).hexdigest()[:32]

    async def get(self, request: web.Request, path: str) -> web.StreamResponse:
        return await self._dispatch(request, path)

    async def post(self, request: web.Request, path: str) -> web.StreamResponse:
        return await self._dispatch(request, path)

    async def _dispatch(self, request: web.Request, path: str) -> web.StreamResponse:
        hass: HomeAssistant = request.app[KEY_HASS]
        entries: list[WaipuTvConfigEntry] = hass.config_entries.async_loaded_entries(DOMAIN)
        if not entries or not entries[0].options[CONF_PLAYLISTS]:
            return web.Response(status=404)
        entry = entries[0]
        key = entry.options[CONF_ACCESS_KEY]
        if not hmac.compare_digest(request.query.get("key", ""), key):
            return web.Response(status=401, text="missing or wrong ?key=")

        handler = _Request(self, hass, entry, request)
        try:
            return await handler.handle(path)
        except BadRequest as err:
            return web.Response(status=400, text=str(err))
        except StreamsBusy as err:
            return web.Response(status=503, text=err.text)
        except WaipuError as err:
            LOGGER.error("%s: %s", path, err)
            status = err.status if err.status and 400 <= err.status < 600 else 502
            return web.Response(status=status, text=str(err))
        except Exception:
            # answer instead of dropping the connection
            LOGGER.exception("%s failed", path)
            return web.Response(status=500, text="internal error, see the Home Assistant log")


class _Request:
    def __init__(
        self,
        view: PlaylistView,
        hass: HomeAssistant,
        entry: WaipuTvConfigEntry,
        request: web.Request,
    ) -> None:
        self.view = view
        self.hass = hass
        self.entry = entry
        self.data = entry.runtime_data
        self.options = entry.options
        self.key = entry.options[CONF_ACCESS_KEY]
        self.request = request
        self.query = request.query
        # the address the player used, so each network gets URLs it can reach
        self.base_url = f"{request.scheme}://{request.host}/api/{DOMAIN}"

    async def handle(self, path: str) -> web.StreamResponse:
        name, _, ext = path.rpartition(".") if "." in path else (path, "", "")
        if ext == "m3u" and name in FILTERS:
            return self.playlist(name)
        if path == "recordings.m3u":
            return self.recordings()
        if path == "epg.xml":
            return await self.epg()
        if path == "license":
            return await self.license()
        if path == "hls":
            return await self.hls()
        if name.startswith("stream/") and ext in EXTENSIONS:
            return await self.stream(name.removeprefix("stream/"), EXTENSIONS[ext])
        if name.startswith("recording/") and ext in EXTENSIONS:
            return await self.recording(unquote(name.removeprefix("recording/")), EXTENSIONS[ext])
        return web.Response(status=404)

    # --- playlists ------------------------------------------------------------------------------

    def _channels(self, selection: str | None = None) -> list[Channel]:
        return select_channels(
            self.data.channels.data.channels,
            selection or self.query.get("filter", "all"),
            hidden=_flag(self.query, "hidden", False),
            drm=_flag(self.query, "drm", True),
        )

    def playlist(self, selection: str) -> web.Response:
        protocol = self.query.get("protocol", "auto")
        if protocol not in ("auto", "hls", "dash"):
            raise BadRequest("protocol must be auto, hls or dash")
        # only an explicit ?hls_proxy= is written into the stream URLs; otherwise the option
        # applies when the stream is requested
        hls_proxy = _flag(self.query, "hls_proxy", False) if "hls_proxy" in self.query else None
        # the guide for the same channel selection, so players don't load the full guide
        guide = {
            "filter": selection,
            "hidden": self.query.get("hidden"),
            "drm": self.query.get("drm"),
        }
        guide = {k: v for k, v in guide.items() if v and v != "all"}
        epg_url = f"{self.base_url}/epg.xml" + ("?" + urlencode(guide) if guide else "")
        # time-shift needs the account's instant restart
        restart = self.data.channels.data.account.instant_restart
        body = render_m3u(
            self._channels(selection),
            self.base_url,
            self.key,
            epg_url,
            protocol,
            hls_proxy=hls_proxy,
            timeshift=restart and _flag(self.query, "timeshift", self.options[CONF_TIMESHIFT]),
        )
        return web.Response(
            text=body,
            content_type=M3U,
            headers={"Content-Disposition": f'inline; filename="waipu-{selection}.m3u"'},
        )

    def recordings(self) -> web.Response:
        protocol = self.query.get("protocol", "dash")
        if protocol not in ("hls", "dash"):
            raise BadRequest("protocol must be hls or dash")
        finished = [r for r in self.data.recordings.data.recordings if r.status == "FINISHED"]
        finished.sort(key=lambda r: r.start or dt_util.utc_from_timestamp(0), reverse=True)
        return web.Response(
            text=render_recordings_m3u(finished, self.base_url, self.key, protocol),
            content_type=M3U,
            headers={"Content-Disposition": 'inline; filename="waipu-recordings.m3u"'},
        )

    async def epg(self) -> web.Response:
        channels = self._channels()
        start, end = self.data.guide.range()
        guide = self.data.guide.guide
        programs = await guide.programs([c.id for c in channels], start, end)
        xml = render_xmltv(((c, programs[c.id]) for c in channels), guide.details()).encode()
        headers = {"Vary": "Accept-Encoding"}
        if "gzip" in self.request.headers.get("Accept-Encoding", ""):
            xml = await self.hass.async_add_executor_job(gzip.compress, xml, 6)
            headers["Content-Encoding"] = "gzip"
        return web.Response(
            body=xml, content_type="application/xml", charset="utf-8", headers=headers
        )

    # --- streams --------------------------------------------------------------------------------

    def _channel(self, channel_id: str) -> Channel:
        channel_id = channel_id.lower()
        for channel in self.data.channels.data.channels:
            if channel.id == channel_id:
                return channel
        raise WaipuError(f"unknown channel {channel_id}", 404)

    @property
    def _client(self) -> str:
        """The IPTV client, as the stream slots know it."""
        return f"iptv:{self.request.remote}|{self.request.headers.get('User-Agent', '')}"

    def _proxied(self, protocol: str) -> bool:
        return protocol == "hls" and _flag(self.query, "proxy", self.options[CONF_HLS_PROXY])

    async def stream(self, channel_id: str, protocol: str) -> web.StreamResponse:
        channel = self._channel(channel_id)
        protocol = channel_protocol(channel, protocol)
        timeshift = self.query.get("timeshift") == "1"
        # live playlists through the proxy are refreshed while playing, so a short timeout works
        timeout = HLS_PROXY_TIMEOUT if self._proxied(protocol) else IPTV_TIMEOUT
        slot = self.data.streams.acquire(
            self._client, self.request.remote or "", "live", channel.name, timeout
        )
        try:
            upstream = await self.data.stream_url(channel, protocol, timeshift, slot)
        except WaipuError:
            self.data.streams.release(self._client)
            raise
        LOGGER.debug("Stream %s (%s) on slot %s", channel.id, protocol, slot)
        return await self._serve(upstream, protocol)

    async def recording(self, recording_id: str, protocol: str) -> web.StreamResponse:
        # a recording's playlist is fetched once, so it always gets the long timeout
        slot = self.data.streams.acquire(
            self._client,
            self.request.remote or "",
            "recording",
            self.data.recording_title(recording_id),
            IPTV_TIMEOUT,
        )
        try:
            upstream = await self.data.client.recording_url(recording_id, protocol, slot)
        except WaipuError:
            self.data.streams.release(self._client)
            raise
        return await self._serve(upstream, protocol)

    async def _serve(self, upstream: str, protocol: str) -> web.StreamResponse:
        if self._proxied(protocol):
            return await self._proxy_hls(upstream)
        return web.Response(status=302, headers={"Location": upstream, "Cache-Control": "no-store"})

    # --- HLS playlist proxy ---------------------------------------------------------------------

    def _proxy_url(self, upstream: str) -> str:
        query = urlencode({"u": upstream, "s": self.view._sign(upstream), "key": self.key})
        return f"{self.base_url}/hls?{query}"

    async def hls(self) -> web.StreamResponse:
        upstream = self.query.get("u", "")
        if not upstream.startswith("https://") or not hmac.compare_digest(
            self.query.get("s", ""), self.view._sign(upstream)
        ):
            return web.Response(status=403, text="invalid signature")
        self.data.streams.touch(self._client, HLS_PROXY_TIMEOUT)
        return await self._proxy_hls(upstream)

    async def _proxy_hls(self, upstream: str) -> web.Response:
        status, body = await self.data.client.upstream_get(upstream)
        if status != 200:
            return web.Response(status=502, text=f"upstream playlist returned HTTP {status}")
        playlist = rewrite_hls(body.decode("utf-8", "replace"), upstream, self._proxy_url)
        return web.Response(text=playlist, content_type=HLS, headers={"Cache-Control": "no-store"})

    # --- DRM ------------------------------------------------------------------------------------

    async def license(self) -> web.Response:
        if self.request.method != "POST":
            return web.Response(status=405, text="POST a Widevine challenge here")
        challenge = await self.request.read()
        return web.Response(
            body=await self.data.client.widevine_license(challenge),
            content_type="application/octet-stream",
        )

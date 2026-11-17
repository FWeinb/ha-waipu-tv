"""waipu.tv API client, ported from the Kodi add-on pvr.waipu (https://github.com/flubshi/pvr.waipu)."""

import asyncio
import base64
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import json
import logging
import time
from typing import Any
from urllib.parse import quote
import uuid

import aiohttp

from .models import (
    Channel,
    MediathekCategory,
    MediathekItem,
    MediathekSeries,
    Program,
    Recording,
    parse_channels,
    parse_mediathek_category,
    parse_mediathek_item,
    parse_mediathek_series,
    parse_program,
    parse_recording,
)

_LOGGER = logging.getLogger(__name__)

AUTH_BASIC = "Basic YW5kcm9pZENsaWVudDpzdXBlclNlY3JldA=="
URL_TOKEN = "https://auth.waipu.tv/oauth/token"
URL_DEVICE_CAPS = "https://device-capabilities.waipu.tv/api/device-capabilities"
URL_STATION_CONFIG = "https://web-proxy.waipu.tv/v2/station-config"
URL_USER_STATIONS = "https://user-stations.waipu.tv/api/stations?omitted=false"
URL_USER_SETTINGS = "https://user-stations.waipu.tv/api/stations/user-settings/{station}"
URL_STREAM = "https://stream-url-provider.waipu.tv/api/stream-url"
URL_EPG_GRID = "https://epg-cache.waipu.tv/api/grid/{station}/{start}"
URL_PROGRAM = "https://epg-cache.waipu.tv/api/programs/{program}"
URL_LICENSE = "https://drm.wpstr.tv/license-proxy-widevine/cenc/"
# FairPlay (Safari, iOS): captured from play.waipu.tv, not part of pvr.waipu
URL_FAIRPLAY_CERT = "https://drm.wpstr.tv/license-server-fairplay/cert/exaring"
URL_FAIRPLAY_LICENSE = "https://drm.wpstr.tv/license-server-fairplay"
URL_RECORDINGS = "https://recording.waipu.tv/api/recordings"
URL_RECORDING_SUMMARY = "https://recording.waipu.tv/api/recordings/summary"
URL_SERIALS = "https://recording-scheduler.waipu.tv/api/serials"
URL_DELETE_REQUESTS = "https://recording-scheduler.waipu.tv/api/delete-requests"
URL_MEDIATHEK = "https://waiputhek.waipu.tv/api"

ACCEPT_RECORDINGS = "application/vnd.waipu.recordings-v4+json"
MEDIATHEK_SORTS = ("mostWatched", "latest", "titleAsc", "vanishingSoon")
MEDIATHEK_PAGE = 50
EPG_WINDOW = timedelta(hours=4)  # the grid API serves 4 h windows aligned to UTC

# fixed stream quality: up to 1080p50 H.264 and HEVC up to 2160p50, with AAC audio
DEVICE_CAPABILITIES = {
    "type": "receiver",
    "model": "Home Assistant",
    "manufacturer": "ha-waipu-tv",
    "platform": "Home Assistant-ha-waipu-tv",
    # required: without it waipu.tv answers HTTP 400; a fixed value, not the integration's version
    "appVersion": "1.0.0",
    "capabilities": {
        "audio": {"aac": True},
        "video": {
            "sdpalp25": True,
            "sdpalp50": True,
            "hd720p25": True,
            "hd720p50": True,
            "hd1080p25": True,
            "hd1080p50": True,
            "hevc1080p50": True,
            "hevc2160p50": True,
        },
    },
}

USER_AGENT = "ha-waipu-tv (Home Assistant)"
TIMEOUT = aiohttp.ClientTimeout(total=20)


class WaipuError(Exception):
    """A waipu.tv request failed."""

    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


class WaipuAuthError(WaipuError):
    """waipu.tv rejected the password or the refresh token."""


@dataclass(frozen=True)
class Account:
    """The signed-in account, read from the access token."""

    email: str
    user_handle: str
    subscription: str | None
    instant_restart: bool
    recording_hours: int  # booked recording storage


def _jwt_claims(token: str) -> dict[str, Any]:
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload))
    except IndexError, ValueError:
        return {}


def _jwt_valid(token: str, margin: int = 0) -> bool:
    return bool(token) and _jwt_claims(token).get("exp", 0) - margin > time.time()


class WaipuClient:
    """waipu.tv account session.

    Only the device id and the refresh token are kept; ``on_refresh_token`` is called whenever
    waipu.tv hands out a new refresh token, so the caller can store it.
    """

    def __init__(
        self,
        session: aiohttp.ClientSession,
        device_id: str,
        refresh_token: str | None = None,
        on_refresh_token: Callable[[str], None] | None = None,
    ) -> None:
        self._session = session
        self.device_id = device_id
        self.refresh_token = refresh_token
        self._on_refresh_token = on_refresh_token
        self._access_token = ""
        self._slot_tokens: dict[int, str] = {}  # access tokens of the other slots' devices
        self._device_tokens: dict[int, str] = {}  # device capabilities token per slot
        self._lock = asyncio.Lock()
        self.errors: deque[tuple[datetime, str]] = deque(maxlen=10)  # for diagnostics

    def _error[E: WaipuError](self, err: E) -> E:
        self.errors.append((datetime.now(UTC), str(err)))
        return err

    # --- authentication -------------------------------------------------------------------------

    async def login(self, username: str, password: str) -> Account:
        """Sign in with the account password; the password itself is not kept."""
        async with self._lock:
            await self._oauth(
                {"grant_type": "password", "username": username, "password": password}
            )
        return await self.account()

    async def access_token(self) -> str:
        async with self._lock:
            if not _jwt_valid(self._access_token, margin=20 * 60):
                if not self.refresh_token:
                    raise WaipuAuthError("not signed in")
                await self._oauth(
                    {"grant_type": "refresh_token", "refresh_token": self.refresh_token}
                )
            return self._access_token

    async def _oauth(self, form: dict[str, str], device_id: str | None = None) -> dict[str, Any]:
        """Token request; with device_id, for that device, leaving our own access token alone."""
        form["waipu_device_id"] = device_id or self.device_id
        try:
            async with self._session.post(
                URL_TOKEN,
                data=form,
                headers={"Authorization": AUTH_BASIC, "User-Agent": USER_AGENT},
                timeout=TIMEOUT,
            ) as resp:
                status = resp.status
                doc = await resp.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            raise self._error(WaipuError(f"waipu.tv login failed: {err}")) from err

        if status in (400, 401):
            raise self._error(WaipuAuthError(f"waipu.tv login rejected (HTTP {status})", status))
        if status != 200 or not isinstance(doc, dict) or "access_token" not in doc:
            raise self._error(WaipuError(f"waipu.tv login failed (HTTP {status})", status))
        if device_id is None:
            self._access_token = doc["access_token"]
            self._device_tokens.pop(0, None)
        if doc.get("refresh_token") and doc["refresh_token"] != self.refresh_token:
            self.refresh_token = doc["refresh_token"]
            if self._on_refresh_token:
                self._on_refresh_token(self.refresh_token)
        return doc

    async def account(self) -> Account:
        claims = _jwt_claims(await self.access_token())
        assets = claims.get("userAssets") or {}
        return Account(
            email=claims.get("email", ""),
            user_handle=claims.get("userHandle", ""),
            subscription=(assets.get("account") or {}).get("subscription"),
            instant_restart=bool(assets.get("instantRestart", False)),
            recording_hours=int(assets.get("hoursRecording") or 0),
        )

    def slot_device_id(self, slot: int) -> str:
        """waipu.tv plays one stream per device: slot 0 is the signed-in device, the other
        parallel-stream slots are devices with ids derived from it, stable across restarts."""
        if slot == 0:
            return self.device_id
        return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{self.device_id}/{slot}"))

    async def _slot_access_token(self, slot: int) -> str:
        if slot == 0:
            return await self.access_token()
        token = self._slot_tokens.get(slot, "")
        if not _jwt_valid(token, margin=20 * 60):
            await self.access_token()  # refresh our own first, so the refresh token is current
            async with self._lock:
                doc = await self._oauth(
                    {"grant_type": "refresh_token", "refresh_token": self.refresh_token},
                    self.slot_device_id(slot),
                )
            token = self._slot_tokens[slot] = doc["access_token"]
            self._device_tokens.pop(slot, None)
        return token

    async def _slot_auth(self, slot: int) -> dict[str, str]:
        """Authorization and device token headers for a stream request from a slot's device."""
        access = await self._slot_access_token(slot)
        device = self._device_tokens.get(slot, "")
        if not _jwt_valid(device, margin=5 * 60):
            doc = await self._json(
                "POST",
                URL_DEVICE_CAPS,
                DEVICE_CAPABILITIES,
                content_type="application/vnd.dc.device-info-v1+json",
                headers={
                    "Authorization": "Bearer " + access,
                    "X-USERCONTEXT-USERHANDLE": _jwt_claims(access).get("userHandle", ""),
                },
            )
            device = self._device_tokens[slot] = doc["token"]
        return {"Authorization": "Bearer " + access, "X-Device-Token": device}

    # --- HTTP -----------------------------------------------------------------------------------

    async def _request(
        self,
        method: str,
        url: str,
        body: bytes | None = None,
        *,
        headers: dict[str, str] | None = None,
        auth: bool = True,
    ) -> tuple[int, bytes]:
        """Returns (status, body); never raises on an HTTP error status."""
        hdrs = {"User-Agent": USER_AGENT}
        if auth:
            hdrs["Authorization"] = "Bearer " + await self.access_token()
        hdrs.update(headers or {})
        try:
            async with self._session.request(
                method, url, data=body, headers=hdrs, timeout=TIMEOUT
            ) as resp:
                return resp.status, await resp.read()
        except (aiohttp.ClientError, TimeoutError) as err:
            raise self._error(WaipuError(f"{method} {url} failed: {err!r}")) from err

    async def _json(
        self,
        method: str,
        url: str,
        payload: Any = None,
        *,
        content_type: str | None = None,
        accept: str | None = None,
        headers: dict[str, str] | None = None,
        auth: bool = True,
    ) -> Any:
        """Send payload as JSON with waipu.tv's vendor content type, return the parsed reply."""
        hdrs = dict(headers or {})
        if content_type:
            hdrs["Content-Type"] = content_type
        if accept:
            hdrs["Accept"] = accept
        body = json.dumps(payload).encode() if payload is not None else None
        status, data = await self._request(method, url, body, headers=hdrs, auth=auth)
        try:
            doc = json.loads(data) if data else None
        except ValueError:
            doc = None
        if not 200 <= status < 300:
            detail = doc.get("detail") or doc.get("error") if isinstance(doc, dict) else data[:200]
            raise self._error(WaipuError(f"{url} returned HTTP {status}: {detail}", status))
        return doc

    # --- channels -------------------------------------------------------------------------------

    async def channels(self) -> list[Channel]:
        """The account's channels in its order, locked channels left out."""
        config = await self._json("GET", URL_STATION_CONFIG)
        stations = await self._json("GET", URL_USER_STATIONS)
        return parse_channels(config or {}, stations or [])

    async def set_favorite(self, channel_id: str, favorite: bool) -> None:
        """Add or remove a favorite in the account (the call play.waipu.tv makes)."""
        await self._json(
            "PATCH",
            URL_USER_SETTINGS.format(station=quote(channel_id.lower())),
            {"favorite": favorite},
            content_type="application/vnd.waipu.user-stations-station-patch.v1+json",
        )

    async def stream_url(
        self, channel_id: str, protocol: str, start: datetime | None = None, slot: int = 0
    ) -> str:
        """A fresh, short-lived stream URL; protocol is "dash" or "hls".

        start requests the stream from that time (instant restart, needs Account.instant_restart).
        slot is the parallel-stream slot whose device asks; a new stream on a device ends the
        one it was playing.
        """
        stream: dict[str, Any] = {
            "station": channel_id.upper(),
            "protocol": protocol,
            "requestMuxInstrumentation": False,
        }
        if start:
            stream["startTime"] = int(start.timestamp())
        doc = await self._json(
            "POST",
            URL_STREAM,
            {"stream": stream},
            content_type="application/vnd.streamurlprovider.stream-url-request-v1+json",
            headers=await self._slot_auth(slot),
        )
        if not isinstance(doc, dict) or not doc.get("streamUrl"):
            raise WaipuError(f"no stream URL for {channel_id}")
        return doc["streamUrl"]

    # --- guide ----------------------------------------------------------------------------------

    async def epg_window(self, channel_id: str, start: datetime) -> list[Program]:
        """Programs of one grid window; start must be aligned to EPG_WINDOW (UTC)."""
        stamp = start.astimezone(UTC).strftime("%Y-%m-%dT%H:00:00.000Z")
        doc = await self._json(
            "GET", URL_EPG_GRID.format(station=quote(channel_id), start=stamp), auth=False
        )
        if not isinstance(doc, list):
            raise WaipuError(f"unexpected guide response for {channel_id} at {stamp}")
        programs = (parse_program(p, channel_id) for p in doc if isinstance(p, dict))
        return [p for p in programs if p]

    async def program_details(self, program_id: str) -> dict[str, Any]:
        """Full program details: description, cast, images, series and station."""
        doc = await self._json("GET", URL_PROGRAM.format(program=quote(program_id)))
        if not isinstance(doc, dict):
            raise WaipuError(f"unexpected details for program {program_id}")
        return doc

    # --- recordings -----------------------------------------------------------------------------

    async def recordings(self) -> list[Recording]:
        """All recordings (scheduled, running, finished), series groups expanded."""
        top = await self._json("GET", URL_RECORDINGS, accept=ACCEPT_RECORDINGS) or []
        entries = list(top)
        groups = dict.fromkeys(
            r["recordingGroup"] for r in top if isinstance(r.get("recordingGroup"), int)
        )
        for group in groups:
            entries += (
                await self._json(
                    "GET", f"{URL_RECORDINGS}?recordingGroup={group}", accept=ACCEPT_RECORDINGS
                )
                or []
            )
        recordings: dict[str, Recording] = {}
        for entry in entries:
            if isinstance(entry, dict) and (rec := parse_recording(entry)):
                recordings.setdefault(rec.id, rec)
        return list(recordings.values())

    async def recorded_seconds(self) -> int:
        """Storage used by finished recordings."""
        doc = await self._json(
            "GET", URL_RECORDING_SUMMARY, accept="application/vnd.waipu.recording-summary-v2+json"
        )
        return int((doc or {}).get("finishedRecordingsSeconds") or 0)

    async def record_program(self, program_id: str) -> None:
        await self._json(
            "POST",
            URL_RECORDINGS,
            {"programId": program_id},
            content_type="application/vnd.waipu.recording-create-v4+json",
        )

    async def record_series(self, program_id: str) -> None:
        """Record all episodes of the program's series on its channel."""
        details = await self.program_details(program_id)
        series_id = (details.get("series") or {}).get("id")
        station = details.get("stationId")
        title = (details.get("textContent") or {}).get("title")
        if not (isinstance(series_id, str) and isinstance(station, str) and title):
            raise WaipuError(f"program {program_id} is not part of a series", 400)
        await self._json(
            "POST",
            URL_SERIALS,
            {"channel": station.upper(), "title": title, "seriesId": series_id},
            content_type="application/vnd.waipu.recording-scheduler-serials-v1+json",
        )

    async def cancel_series(self, group: int) -> None:
        """Stop a series recording: scheduled episodes are cancelled, running and finished ones
        kept."""
        await self._json(
            "POST",
            URL_DELETE_REQUESTS,
            {
                "serialRecordings": [
                    {
                        "id": group,
                        "deleteFutureRecordings": True,
                        "deleteFinishedRecordings": False,
                        "deleteRunningRecordings": False,
                    }
                ]
            },
            content_type="application/vnd.waipu.recording-scheduler-delete-serial-recordings-v1+json",
        )

    async def delete_recordings(self, recording_ids: list[str]) -> None:
        """Cancels scheduled and deletes finished recordings."""
        if recording_ids:
            await self._json(
                "DELETE",
                URL_RECORDINGS,
                {"ids": recording_ids},
                content_type="application/vnd.waipu.recording-ids-v4+json",
            )

    async def recording_url(self, recording_id: str, protocol: str, slot: int = 0) -> str:
        doc = await self._json(
            "GET",
            f"{URL_RECORDINGS}/{quote(recording_id)}/streamingdetails",
            accept="application/vnd.waipu.recording-streaming-detail-v4+json",
            headers={"Authorization": "Bearer " + await self._slot_access_token(slot)},
        )
        wanted = "MPEG_DASH" if protocol == "dash" else "HLS"
        for stream in (doc or {}).get("streams") or []:
            if stream.get("protocol") == wanted and stream.get("href"):
                return stream["href"]
        raise WaipuError(f"no {protocol} stream for recording {recording_id}", 404)

    # --- Mediathek ------------------------------------------------------------------------------

    async def mediathek_page(
        self, category: str, sort: str = "mostWatched", genre: str | None = None, page: int = 0
    ) -> tuple[list[MediathekItem], bool]:
        """One page of a category's cards in the app's "all" list (titles and seasons of series),
        and whether more pages follow."""
        params = {"sortBy": sort, "page": page, "size": MEDIATHEK_PAGE}
        if genre:
            params["genreId"] = genre
        query = "&".join(f"{k}={quote(str(v))}" for k, v in params.items())
        doc = await self._json(
            "GET",
            f"{URL_MEDIATHEK}/category/{quote(category)}/all?{query}",
            accept="application/vnd.waipu.waiputhek-content-paged-v1+json",
        )
        content = (doc or {}).get("content") or []
        items = [i for c in content if isinstance(c, dict) and (i := parse_mediathek_item(c))]
        pages = int(((doc or {}).get("page") or {}).get("totalPages") or 0)
        return items, page + 1 < pages

    async def mediathek(
        self, category: str, sort: str = "mostWatched", genre: str | None = None, limit: int = 100
    ) -> list[MediathekItem]:
        """A category's titles to play, up to limit; seasons of series left out."""
        items: list[MediathekItem] = []
        page, more = 0, True
        while more and len(items) < limit:
            found, more = await self.mediathek_page(category, sort, genre, page)
            items += [i for i in found if not i.series]
            page += 1
        return items[:limit]

    async def mediathek_categories(self) -> list[MediathekCategory]:
        """The categories with their genres, in the app's order."""
        doc = await self._json(
            "GET",
            f"{URL_MEDIATHEK}/filter",
            accept="application/vnd.waipu.waiputhek-filter-tree-v1+json",
        )
        categories = [c for c in (doc or {}).get("categories") or [] if isinstance(c, dict)]
        categories.sort(key=lambda c: c.get("rank") or 0)
        return [category for c in categories if (category := parse_mediathek_category(c))]

    async def mediathek_series(self, season_id: str) -> MediathekSeries:
        """The series of a season, with all its seasons and episodes, from its collection's
        microsite; season_id is "<collection>:<category>"."""
        collection, _, category = season_id.partition(":")
        doc = await self._json(
            "GET", f"{URL_MEDIATHEK}/v1/tuner/microsites/{quote(collection)}/contents"
        )
        series = None
        if isinstance(doc, dict):
            series = parse_mediathek_series(doc, collection, category)
        if series is None:
            raise WaipuError(f"unknown Mediathek season {season_id}", 404)
        return series

    async def mediathek_content(self, content_id: str) -> dict[str, Any]:
        """A title's details: title, description and its streamUrlProvider."""
        doc = await self._json(
            "GET", f"{URL_MEDIATHEK}/v1/tuner/contents/{quote(content_id, safe=':')}"
        )
        if not isinstance(doc, dict) or not doc.get("streamUrlProvider"):
            raise WaipuError(f"unknown mediathek title {content_id}", 404)
        return doc

    async def mediathek_url(self, provider: str, protocol: str, slot: int = 0) -> str:
        """The stream of a Mediathek title, from its streamUrlProvider; protocol is "dash" or
        "hls"."""
        user_handle = (await self.account()).user_handle
        doc = await self._json(
            "GET", f"{provider}?uh={quote(user_handle)}", headers=await self._slot_auth(slot)
        )
        url = ((doc or {}).get("player") or {}).get("mpd" if protocol == "dash" else "hls")
        if not url:
            raise WaipuError(f"no {protocol} stream at {provider}", 404)
        return url

    # --- DRM ------------------------------------------------------------------------------------

    async def _drm_custom_data(self) -> str:
        """DRMtoday's custom data: which merchant and user a license is for."""
        account = await self.account()
        custom_data = {"merchant": "exaring", "sessionId": "default", "userId": account.user_handle}
        return base64.b64encode(json.dumps(custom_data).encode()).decode()

    async def widevine_license(self, challenge: bytes) -> bytes:
        """Forward a Widevine challenge to waipu.tv's license proxy; returns the raw license."""
        status, body = await self._request(
            "POST",
            URL_LICENSE,
            challenge,
            headers={"Content-Type": "text/xml", "x-dt-custom-data": await self._drm_custom_data()},
            auth=False,
        )
        if status != 200:
            raise WaipuError(f"license server returned HTTP {status}", status)
        try:
            return base64.b64decode(json.loads(body)["license"])
        except (ValueError, KeyError, TypeError) as err:
            raise WaipuError("unexpected license response") from err

    async def fairplay_certificate(self) -> bytes:
        """waipu.tv's FairPlay application certificate (DER), needed to create the SPC."""
        status, body = await self._request("GET", URL_FAIRPLAY_CERT, auth=False)
        if status != 200:
            raise WaipuError(f"FairPlay certificate returned HTTP {status}", status)
        return body

    async def fairplay_license(self, spc: bytes) -> bytes:
        """Forward a FairPlay SPC to waipu.tv's license server; returns the raw CKC. Unlike
        Widevine, the header is dt-custom-data and the answer is base64 text."""
        status, body = await self._request(
            "POST",
            URL_FAIRPLAY_LICENSE,
            spc,
            headers={"dt-custom-data": await self._drm_custom_data()},
            auth=False,
        )
        if status != 200:
            raise WaipuError(f"license server returned HTTP {status}", status)
        try:
            return base64.b64decode(body, validate=True)
        except ValueError as err:
            raise WaipuError("unexpected license response") from err

    # --- CDN ------------------------------------------------------------------------------------

    async def upstream_get(self, url: str) -> tuple[int, bytes]:
        """Unauthenticated GET of a CDN resource (HLS playlists); gzip is accepted, which
        waipu.tv's edge reportedly requires."""
        return await self._request("GET", url, headers={"Accept-Encoding": "gzip"}, auth=False)

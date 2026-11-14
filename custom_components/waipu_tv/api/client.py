"""waipu.tv API client, ported from the Kodi add-on pvr.waipu (https://github.com/flubshi/pvr.waipu)."""

import asyncio
import base64
from collections.abc import Callable
from dataclasses import dataclass
import json
import logging
import time
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)

AUTH_BASIC = "Basic YW5kcm9pZENsaWVudDpzdXBlclNlY3JldA=="
URL_TOKEN = "https://auth.waipu.tv/oauth/token"

USER_AGENT = (
    "Kodi/21.2 (Linux; Android 12) pvr.waipu/22.10.4 "
    "App_Bitness/64 Version/21.2-(21.2.0)-Git:20250101-nogitfound"
)
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
        self._lock = asyncio.Lock()

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

    async def _oauth(self, form: dict[str, str]) -> None:
        form["waipu_device_id"] = self.device_id
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
            raise WaipuError(f"waipu.tv login failed: {err}") from err

        if status in (400, 401):
            raise WaipuAuthError(f"waipu.tv login rejected (HTTP {status})", status)
        if status != 200 or not isinstance(doc, dict) or "access_token" not in doc:
            raise WaipuError(f"waipu.tv login failed (HTTP {status})", status)
        self._access_token = doc["access_token"]
        if doc.get("refresh_token") and doc["refresh_token"] != self.refresh_token:
            self.refresh_token = doc["refresh_token"]
            if self._on_refresh_token:
                self._on_refresh_token(self.refresh_token)

    async def account(self) -> Account:
        claims = _jwt_claims(await self.access_token())
        assets = claims.get("userAssets") or {}
        return Account(
            email=claims.get("email", ""),
            user_handle=claims.get("userHandle", ""),
            subscription=(assets.get("account") or {}).get("subscription"),
            instant_restart=bool(assets.get("instantRestart", False)),
        )

"""Shared test helpers: fake waipu.tv tokens and saved, anonymized waipu.tv responses."""

import base64
import json
from pathlib import Path
import time

import pytest
from pytest_homeassistant.common import MockConfigEntry

from custom_components.waipu_tv.const import (
    CONF_ACCESS_KEY,
    CONF_DEVICE_ID,
    CONF_REFRESH_TOKEN,
    DEFAULT_OPTIONS,
    DOMAIN,
)

FIXTURES = Path(__file__).parent / "fixtures"
URL_TOKEN = "https://auth.waipu.tv/oauth/token"
URL_RECORDINGS = "https://recording.waipu.tv/api/recordings"
USER_HANDLE = "00000000-0000-0000-0000-000000000001"


def load_json(name):
    return json.loads((FIXTURES / name).read_text())


def make_jwt(lifetime=3600, **claims):
    """An unsigned JWT with waipu.tv's claims; the client only reads the payload."""
    payload = {
        **load_json("access_token_claims.json"),
        "exp": int(time.time()) + lifetime,
        **claims,
    }

    def b64(doc):
        return base64.urlsafe_b64encode(json.dumps(doc).encode()).rstrip(b"=").decode()

    return f"{b64({'alg': 'none'})}.{b64(payload)}.sig"


def token_response(refresh_token="refresh-1", lifetime=3600):
    return {
        "access_token": make_jwt(lifetime),
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": lifetime,
    }


@pytest.fixture
def mock_token(aioclient_mock):
    """Answer the token endpoint with a valid token pair."""
    aioclient_mock.post(URL_TOKEN, json=token_response())
    return aioclient_mock


@pytest.fixture
def mock_waipu(mock_token):
    """Everything the integration loads on setup."""
    mock_token.get(
        "https://web-proxy.waipu.tv/v2/station-config", json=load_json("station_config.json")
    )
    mock_token.get(
        "https://user-stations.waipu.tv/api/stations?omitted=false",
        json=load_json("user_stations.json"),
    )
    mock_token.get(f"{URL_RECORDINGS}?recordingGroup=7", json=load_json("recordings_group_7.json"))
    mock_token.get(f"{URL_RECORDINGS}/summary", json={"finishedRecordingsSeconds": 9000})
    mock_token.get(URL_RECORDINGS, json=load_json("recordings.json"))
    return mock_token


@pytest.fixture
def config_entry(hass):
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="user@example.com",
        unique_id=USER_HANDLE,
        data={CONF_DEVICE_ID: "device-old", CONF_REFRESH_TOKEN: "refresh-old"},
        options={**DEFAULT_OPTIONS, CONF_ACCESS_KEY: "aaaa-bbbb-cccc-dddd"},
    )
    entry.add_to_hass(hass)
    return entry

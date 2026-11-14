"""Shared test helpers: fake waipu.tv tokens built from anonymized claims."""

import base64
import json
from pathlib import Path
import time

import pytest

FIXTURES = Path(__file__).parent / "fixtures"
URL_TOKEN = "https://auth.waipu.tv/oauth/token"


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

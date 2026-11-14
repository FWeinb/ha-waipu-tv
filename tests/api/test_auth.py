"""Login, token refresh and account details."""

import asyncio

import pytest

from custom_components.waipu_tv.api import Account, WaipuAuthError, WaipuClient, WaipuError

from ..conftest import URL_TOKEN, make_jwt, token_response


@pytest.fixture
async def session(aioclient_mock):
    return aioclient_mock.create_session(asyncio.get_running_loop())


async def test_login_returns_account_and_refresh_token(aioclient_mock, session):
    aioclient_mock.post(URL_TOKEN, json=token_response("refresh-1"))
    stored = []
    client = WaipuClient(session, "device-1", on_refresh_token=stored.append)

    account = await client.login("user@example.com", "secret")

    assert account == Account(
        email="user@example.com",
        user_handle="00000000-0000-0000-0000-000000000001",
        subscription="perfect plus",
        instant_restart=True,
    )
    assert client.refresh_token == "refresh-1"
    assert stored == ["refresh-1"]
    _, _, form, headers = aioclient_mock.mock_calls[0]
    assert form == {
        "grant_type": "password",
        "username": "user@example.com",
        "password": "secret",
        "waipu_device_id": "device-1",
    }
    assert headers["Authorization"].startswith("Basic ")


@pytest.mark.parametrize("status", [400, 401])
async def test_login_rejected(aioclient_mock, session, status):
    aioclient_mock.post(URL_TOKEN, status=status, json={"error": "invalid_grant"})
    client = WaipuClient(session, "device-1")

    with pytest.raises(WaipuAuthError):
        await client.login("user@example.com", "wrong")


async def test_server_error_is_not_an_auth_error(aioclient_mock, session):
    aioclient_mock.post(URL_TOKEN, status=503, text="unavailable")
    client = WaipuClient(session, "device-1")

    with pytest.raises(WaipuError) as err:
        await client.login("user@example.com", "secret")
    assert not isinstance(err.value, WaipuAuthError)


async def test_connection_error(aioclient_mock, session):
    aioclient_mock.post(URL_TOKEN, exc=TimeoutError)
    client = WaipuClient(session, "device-1")

    with pytest.raises(WaipuError):
        await client.login("user@example.com", "secret")


async def test_refresh_token_is_used_and_rotated(aioclient_mock, session):
    aioclient_mock.post(URL_TOKEN, json=token_response("refresh-2"))
    stored = []
    client = WaipuClient(session, "device-1", "refresh-1", stored.append)

    await client.account()

    _, _, form, _ = aioclient_mock.mock_calls[0]
    assert form == {
        "grant_type": "refresh_token",
        "refresh_token": "refresh-1",
        "waipu_device_id": "device-1",
    }
    assert stored == ["refresh-2"]


async def test_access_token_is_cached_until_close_to_expiry(aioclient_mock, session):
    aioclient_mock.post(URL_TOKEN, json=token_response())
    client = WaipuClient(session, "device-1", "refresh-1")

    await client.access_token()
    await client.access_token()
    assert aioclient_mock.call_count == 1


async def test_access_token_expiring_soon_is_refreshed(aioclient_mock, session):
    # less than 20 minutes left: refreshed before use, like pvr.waipu
    aioclient_mock.post(URL_TOKEN, json={"access_token": make_jwt(lifetime=600)})
    client = WaipuClient(session, "device-1", "refresh-1")

    await client.access_token()
    await client.access_token()
    assert aioclient_mock.call_count == 2


async def test_rejected_refresh_token_needs_reauth(aioclient_mock, session):
    aioclient_mock.post(URL_TOKEN, status=401, json={"error": "invalid_grant"})
    client = WaipuClient(session, "device-1", "refresh-1")

    with pytest.raises(WaipuAuthError):
        await client.account()


async def test_without_refresh_token_needs_login(session):
    with pytest.raises(WaipuAuthError):
        await WaipuClient(session, "device-1").account()

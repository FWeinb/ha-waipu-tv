"""Config flow for waipu.tv: sign in, guide & entities, playlist server."""

from collections.abc import Mapping
import secrets
from typing import Any, override
import uuid

import probatio

from homeassistant.config_entries import (
    SOURCE_REAUTH,
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlowWithReload,
)
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import callback
from homeassistant.data_entry_flow import SectionConfig, section
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .api import WaipuAuthError, WaipuClient, WaipuError
from .const import (
    CHANNELS_FAVORITES,
    CHANNELS_LIVE,
    CHANNELS_VISIBLE,
    CONF_ACCESS_KEY,
    CONF_CATCHUP,
    CONF_CHANNELS,
    CONF_CHANNELS_INTERVAL,
    CONF_DEVICE_ID,
    CONF_GUIDE_DAYS,
    CONF_GUIDE_DETAILS,
    CONF_GUIDE_INTERVAL,
    CONF_GUIDE_PARALLEL,
    CONF_HLS_PROXY,
    CONF_PLAYLISTS,
    CONF_RECORDINGS_INTERVAL,
    CONF_REFRESH_TOKEN,
    CONF_TIMESHIFT,
    CONF_UPDATE_INTERVALS,
    DEFAULT_OPTIONS,
    DOMAIN,
    GUIDE_DAYS,
    LOGGER,
)

LOGIN_SCHEMA = probatio.Schema(
    {
        probatio.Required(CONF_EMAIL): TextSelector(
            TextSelectorConfig(type=TextSelectorType.EMAIL, autocomplete="username")
        ),
        probatio.Required(probatio.Secret(CONF_PASSWORD)): TextSelector(
            TextSelectorConfig(type=TextSelectorType.PASSWORD, autocomplete="current-password")
        ),
    }
)

# update intervals in minutes: (minimum, maximum)
INTERVAL_LIMITS = {
    CONF_CHANNELS_INTERVAL: (15, 24 * 60),
    CONF_RECORDINGS_INTERVAL: (5, 24 * 60),
    CONF_GUIDE_INTERVAL: (30, 24 * 60),
    CONF_GUIDE_PARALLEL: (1, 8),
}


def generate_access_key() -> str:
    """A key like k3v9-tq72-wp4m-x8re, easy to read out and type into a player."""
    alphabet = "abcdefghijkmnpqrstuvwxyz23456789"
    chars = [secrets.choice(alphabet) for _ in range(16)]
    return "-".join("".join(chars[i : i + 4]) for i in range(0, 16, 4))


def _guide_schema(values: Mapping[str, Any]) -> probatio.Schema:
    intervals = {
        probatio.Required(key, default=values[key]): NumberSelector(
            NumberSelectorConfig(
                min=low,
                max=high,
                step=1,
                mode=NumberSelectorMode.BOX,
                **({} if key == CONF_GUIDE_PARALLEL else {"unit_of_measurement": "min"}),
            )
        )
        for key, (low, high) in INTERVAL_LIMITS.items()
    }
    return probatio.Schema(
        {
            probatio.Required(CONF_CHANNELS, default=values[CONF_CHANNELS]): SelectSelector(
                SelectSelectorConfig(
                    options=[CHANNELS_VISIBLE, CHANNELS_FAVORITES, CHANNELS_LIVE],
                    mode=SelectSelectorMode.DROPDOWN,
                    translation_key=CONF_CHANNELS,
                )
            ),
            probatio.Required(
                CONF_GUIDE_DAYS, default=str(values[CONF_GUIDE_DAYS])
            ): SelectSelector(
                SelectSelectorConfig(
                    options=[str(days) for days in GUIDE_DAYS],
                    mode=SelectSelectorMode.DROPDOWN,
                    translation_key=CONF_GUIDE_DAYS,
                )
            ),
            probatio.Required(CONF_GUIDE_DETAILS, default=values[CONF_GUIDE_DETAILS]): bool,
            probatio.Required(CONF_UPDATE_INTERVALS): section(
                probatio.Schema(intervals), SectionConfig(collapsed=True)
            ),
        }
    )


def _guide_options(user_input: dict[str, Any]) -> dict[str, Any]:
    """Flatten the intervals section and convert the selector values."""
    intervals = user_input.pop(CONF_UPDATE_INTERVALS)
    return {
        **user_input,
        CONF_GUIDE_DAYS: int(user_input[CONF_GUIDE_DAYS]),
        **{key: int(intervals[key]) for key in INTERVAL_LIMITS},
    }


def _playlists_schema(values: Mapping[str, Any]) -> probatio.Schema:
    return probatio.Schema(
        {
            probatio.Required(CONF_PLAYLISTS, default=values[CONF_PLAYLISTS]): bool,
            # suggested, not default: clearing the field must stay possible
            probatio.Optional(
                CONF_ACCESS_KEY, description={"suggested_value": values[CONF_ACCESS_KEY]}
            ): str,
            probatio.Required(CONF_CATCHUP, default=values[CONF_CATCHUP]): bool,
            probatio.Required(CONF_TIMESHIFT, default=values[CONF_TIMESHIFT]): bool,
            probatio.Required(CONF_HLS_PROXY, default=values[CONF_HLS_PROXY]): bool,
        }
    )


def _playlists_options(user_input: dict[str, Any]) -> dict[str, Any]:
    """An empty access key gets a new one."""
    access_key = user_input.get(CONF_ACCESS_KEY, "").strip() or generate_access_key()
    return {**user_input, CONF_ACCESS_KEY: access_key}


class WaipuTvConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up a waipu.tv account."""

    VERSION = 1

    def __init__(self) -> None:
        self._title = ""
        self._data: dict[str, Any] = {}
        self._options: dict[str, Any] = {
            **DEFAULT_OPTIONS,
            CONF_ACCESS_KEY: generate_access_key(),
        }

    @staticmethod
    @callback
    @override
    def async_get_options_flow(config_entry: ConfigEntry) -> WaipuTvOptionsFlow:
        return WaipuTvOptionsFlow()

    @override
    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Step 1: sign in."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = await self._async_login(user_input)
            if not errors:
                self._abort_if_unique_id_configured()
                return await self.async_step_guide()

        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(LOGIN_SCHEMA, user_input),
            errors=errors,
        )

    async def async_step_guide(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Step 2: guide & entities."""
        if user_input is not None:
            self._options.update(_guide_options(user_input))
            return await self.async_step_playlists()

        return self.async_show_form(step_id="guide", data_schema=_guide_schema(self._options))

    async def async_step_playlists(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 3: playlist server."""
        if user_input is not None:
            return self.async_create_entry(
                title=self._title,
                data=self._data,
                options={**self._options, **_playlists_options(user_input)},
            )

        return self.async_show_form(
            step_id="playlists", data_schema=_playlists_schema(self._options)
        )

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        """The refresh token was rejected: ask for the password again."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        if user_input is not None:
            errors = await self._async_login(user_input)
            if not errors:
                self._abort_if_unique_id_mismatch(reason="wrong_account")
                return self.async_update_reload_and_abort(entry, data=self._data)

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=self.add_suggested_values_to_schema(
                LOGIN_SCHEMA, user_input or {CONF_EMAIL: entry.title}
            ),
            errors=errors,
        )

    async def _async_login(self, user_input: dict[str, Any]) -> dict[str, str]:
        """Sign in; on success the refresh token is in self._data, the password is dropped."""
        # a fresh device id per login, like a new pvr.waipu installation
        client = WaipuClient(async_get_clientsession(self.hass), str(uuid.uuid4()))
        try:
            account = await client.login(user_input[CONF_EMAIL], user_input[CONF_PASSWORD])
        except WaipuAuthError:
            return {"base": "invalid_auth"}
        except WaipuError:
            return {"base": "cannot_connect"}
        except Exception:
            LOGGER.exception("Unexpected exception")
            return {"base": "unknown"}

        await self.async_set_unique_id(
            account.user_handle, raise_on_progress=self.source != SOURCE_REAUTH
        )
        self._title = account.email or user_input[CONF_EMAIL]
        self._data = {
            CONF_DEVICE_ID: client.device_id,
            CONF_REFRESH_TOKEN: client.refresh_token,
        }
        return {}


class WaipuTvOptionsFlow(OptionsFlowWithReload):
    """Steps 2 and 3 of the setup."""

    def __init__(self) -> None:
        self._options: dict[str, Any] = {}

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            self._options.update(_guide_options(user_input))
            return await self.async_step_playlists()

        self._options = {**DEFAULT_OPTIONS, **self.config_entry.options}
        return self.async_show_form(step_id="init", data_schema=_guide_schema(self._options))

    async def async_step_playlists(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data={**self._options, **_playlists_options(user_input)})

        return self.async_show_form(
            step_id="playlists", data_schema=_playlists_schema(self._options)
        )

"""The sidebar panel: a Lit bundle built from frontend/. Releases ship it (the release workflow
builds it into the zip); a checkout without a build runs without the panel."""

import hashlib
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, LOGGER

PANEL_URL = "waipu-tv"
STATIC_URL = f"/{DOMAIN}_static"
BUNDLE = Path(__file__).parent / "frontend" / "waipu-tv-panel.js"


async def async_register_static(hass: HomeAssistant) -> None:
    if not await hass.async_add_executor_job(BUNDLE.is_file):
        LOGGER.warning("The panel isn't built (%s missing): run npm run build in frontend/", BUNDLE)
        return
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, str(BUNDLE.parent), cache_headers=True)]
    )


async def async_register_panel(hass: HomeAssistant) -> None:
    """Visible to all users; the playlist tab inside is for admins only."""
    if not await hass.async_add_executor_job(BUNDLE.is_file):
        return  # warned about in async_register_static
    # the bundle's hash in the URL makes browsers load a new version after an update
    digest = await hass.async_add_executor_job(
        lambda: hashlib.sha256(BUNDLE.read_bytes()).hexdigest()[:12]
    )
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name="waipu-tv-panel",
        sidebar_title="waipu.tv",
        sidebar_icon="mdi:television-classic",
        module_url=f"{STATIC_URL}/{BUNDLE.name}?v={digest}",
        require_admin=False,
    )


def async_remove_panel(hass: HomeAssistant) -> None:
    frontend.async_remove_panel(hass, PANEL_URL, warn_if_unknown=False)

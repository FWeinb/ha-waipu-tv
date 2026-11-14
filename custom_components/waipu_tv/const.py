"""Constants for waipu.tv."""

import logging

DOMAIN = "waipu_tv"
LOGGER = logging.getLogger(__package__)

CONF_DEVICE_ID = "device_id"
CONF_REFRESH_TOKEN = "refresh_token"

# step 2: guide & entities
CONF_CHANNELS = "channels"
CHANNELS_VISIBLE = "visible"
CHANNELS_FAVORITES = "favorites"
CHANNELS_LIVE = "live"
CONF_GUIDE_DAYS = "guide_days"
CONF_GUIDE_DETAILS = "guide_details"
CONF_UPDATE_INTERVALS = "update_intervals"  # form section, flattened in the options
CONF_CHANNELS_INTERVAL = "channels_interval"
CONF_RECORDINGS_INTERVAL = "recordings_interval"
CONF_GUIDE_INTERVAL = "guide_interval"
CONF_GUIDE_PARALLEL = "guide_parallel"

# step 3: playlist server
CONF_PLAYLISTS = "playlists"
CONF_ACCESS_KEY = "access_key"
CONF_PLAYER_URL = "player_url"
CONF_CATCHUP = "catchup"
CONF_TIMESHIFT = "timeshift"
CONF_HLS_PROXY = "hls_proxy"

GUIDE_DAYS = [1, 2, 3, 7]

# intervals are in minutes
DEFAULT_OPTIONS = {
    CONF_CHANNELS: CHANNELS_VISIBLE,
    CONF_GUIDE_DAYS: 2,
    CONF_GUIDE_DETAILS: True,
    CONF_CHANNELS_INTERVAL: 60,
    CONF_RECORDINGS_INTERVAL: 60,
    CONF_GUIDE_INTERVAL: 120,
    CONF_GUIDE_PARALLEL: 4,
    CONF_PLAYLISTS: True,
    CONF_PLAYER_URL: "",
    CONF_CATCHUP: True,
    CONF_TIMESHIFT: False,
    CONF_HLS_PROXY: False,
}

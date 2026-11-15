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
CONF_TIMESHIFT = "timeshift"
CONF_HLS_PROXY = "hls_proxy"
CONF_AUDIO_LANGUAGE = "audio_language"
CONF_PARALLEL_STREAMS = "parallel_streams"
PARALLEL_STREAMS_MAX = 8

# the player's preferred audio language: waipu.tv's codes as seen in its streams, "qaa" being the
# original language, "qad" audio description and "qks" clear language; others can be typed in
AUDIO_DEFAULT = "default"  # what the stream marks as default
AUDIO_LANGUAGES = [AUDIO_DEFAULT, "de", "en", "fr", "qaa", "qad", "qks"]

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
    CONF_TIMESHIFT: False,
    CONF_HLS_PROXY: False,
    CONF_AUDIO_LANGUAGE: AUDIO_DEFAULT,
    CONF_PARALLEL_STREAMS: 1,
}

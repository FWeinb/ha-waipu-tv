"""waipu.tv library: no Home Assistant imports."""

from .client import EPG_WINDOW, Account, WaipuAuthError, WaipuClient, WaipuError
from .guide import Guide
from .models import (
    Channel,
    MediathekCategory,
    MediathekEpisode,
    MediathekItem,
    MediathekSeason,
    MediathekSeries,
    Program,
    ProgramDetails,
    Recording,
)

__all__ = [
    "EPG_WINDOW",
    "Guide",
    "Account",
    "Channel",
    "Program",
    "ProgramDetails",
    "Recording",
    "MediathekCategory",
    "MediathekEpisode",
    "MediathekItem",
    "MediathekSeason",
    "MediathekSeries",
    "WaipuAuthError",
    "WaipuClient",
    "WaipuError",
]

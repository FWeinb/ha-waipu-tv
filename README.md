# waipu.tv for Home Assistant

A Home Assistant integration for a [waipu.tv](https://www.waipu.tv) account: the TV guide,
favorites and recordings in a sidebar panel, entities and actions for automations, and M3U
playlists plus an XMLTV guide for IPTV players such as Kodi or TiviMate, served by Home Assistant
itself.

Playback inside Home Assistant is out of scope; watching is the IPTV player's job. Nothing is
re-encoded or decrypted: streams go directly from waipu.tv to the player.

> **Unofficial.** waipu.tv has no public API. This integration is not affiliated with waipu.tv or
> exaring AG and may break when waipu.tv changes its services.

## Requirements

- Home Assistant 2026.11 or later
- [HACS](https://hacs.xyz)
- A waipu.tv account with an e-mail login (O2 and other provider logins are not supported)

## Installation

1. In HACS, open the menu, choose **Custom repositories** and add this repository as an
   **Integration**.
2. Install **waipu.tv** and restart Home Assistant.
3. Go to **Settings → Devices & services → Add integration → waipu.tv** and sign in. The password
   is only used once to get a refresh token; it is not stored.

One waipu.tv account per Home Assistant instance.

## Setup and options

Setup has three steps; the last two are also the integration's options.

1. **Sign in** with e-mail and password.
2. **Guide & entities:** which channels to import (all visible, favorites only, live TV only), how
   many guide days to load, whether to load descriptions and cast for the favorites' programs, and
   the update intervals.
3. **Playlist server:** on or off, the access key, catch-up, time-shift from program start and the
   HLS playlist proxy.

## Panel

A **waipu.tv** entry in the sidebar, for all users:

- **Guide:** a timeline of your favorites or all channels. Open a program to record it or its
  series, cancel a recording or add the channel to your favorites.
- **Favorites:** star channels; favorites are stored in your waipu.tv account, so the waipu.tv apps
  see them too.
- **Recordings:** finished, running and scheduled recordings grouped by series, storage used,
  delete (single or several at once) and stop series recordings.
- **Playlists** (admins only): the playlist and guide URLs to copy into your IPTV player.

## Entities

| Entity | State |
| --- | --- |
| `sensor.waipu_tv_subscription` | package, e.g. "perfect plus" |
| `binary_sensor.waipu_tv_recording` | on while a recording runs |
| `sensor.waipu_tv_recording_storage` | hours used; booked hours as attribute |
| `sensor.waipu_tv_recordings` | number of finished recordings |
| `calendar.waipu_tv` | the favorites' guide plus scheduled and running recordings |
| `button.waipu_tv_refresh` | reloads channels, favorites, recordings and guide |

## Actions

| Action | Data |
| --- | --- |
| `waipu_tv.record_program` | `program_id` |
| `waipu_tv.record_series` | `program_id` of any episode |
| `waipu_tv.cancel_series` | `program_id` of a recorded or scheduled episode; finished episodes are kept |
| `waipu_tv.delete_recordings` | `recording_ids`; cancels scheduled, deletes finished |
| `waipu_tv.set_favorite` | `channel` (e.g. `ard`), `favorite` |

Calendar events use waipu.tv's program id as uid, so a calendar trigger can record a program:

```yaml
triggers:
  - trigger: calendar
    entity_id: calendar.waipu_tv
    event: start
    offset: "-0:05:00"
conditions:
  - condition: template
    value_template: "{{ 'Tatort' in trigger.calendar_event.summary }}"
actions:
  - action: waipu_tv.record_program
    data:
      program_id: "{{ trigger.calendar_event.uid }}"
```

## IPTV playlists

Home Assistant serves the playlists under `/api/waipu_tv`. Copy the URLs from the panel's
**Playlists** tab; each one contains the access key (`?key=…`). Anyone with the key can watch on
your account, so treat it like a password. A new key, set in the options, locks out old links.

| URL | Content |
| --- | --- |
| `/api/waipu_tv/all.m3u` | all visible channels |
| `/api/waipu_tv/favorites.m3u` | favorites |
| `/api/waipu_tv/live.m3u` | live TV channels |
| `/api/waipu_tv/vod.m3u` | on-demand channels |
| `/api/waipu_tv/recordings.m3u` | finished recordings |
| `/api/waipu_tv/epg.xml` | XMLTV guide; each playlist links the guide for its channels |

The URLs in a playlist use the address the player requested it from, so players in different
networks or VLANs each get links they can reach.

Options per playlist, added to the URL:

| Option | Effect |
| --- | --- |
| `hidden=1` | include channels hidden in your waipu.tv channel list |
| `drm=0` | leave out DRM channels, for players without Widevine |
| `protocol=hls` / `protocol=dash` | force a protocol instead of choosing per channel |
| `hls_proxy=1` / `hls_proxy=0` | serve HLS playlists through Home Assistant, for ffmpeg-based players such as VLC or Jellyfin |
| `timeshift=1` / `timeshift=0` | open live channels at the start of the running program |
| `catchup=1` / `catchup=0` | restart running and recently started programs from the guide |

Time-shift and catch-up need waipu.tv's instant restart in your package.

**DRM channels** play as DASH with Widevine. They need a player with its own Widevine support, such
as Kodi with inputstream.adaptive, TiviMate or OTT Navigator; Home Assistant only relays the license
request. Channels without DRM play as HLS.

## Credits

The waipu.tv API client is derived from the Kodi add-on
[pvr.waipu](https://github.com/flubshi/pvr.waipu) by flubshi and contributors (GPL-2.0-or-later):
login, channels, streams, the Widevine license, the guide and recordings.
[ha-waipu](https://github.com/GB-1972/ha-waipu) was used to cross-check recording fields.

## License

[GPL-3.0-or-later](LICENSE).

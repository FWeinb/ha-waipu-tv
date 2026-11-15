# Architecture

**waipu.tv for Home Assistant** (`waipu_tv`) is a Home Assistant integration for a waipu.tv account.
It covers the TV guide, favorites and recording management, plus M3U playlists and an XMLTV guide
for IPTV players, served by Home Assistant itself. Playback in Home Assistant is out of scope.

This file records the decisions made so far and why. The UI mockup is
`mockups/homeassistant.html` (static, sample data).

## Sources

The waipu.tv API is undocumented. Only port calls from these sources, never guess endpoints:

| Source | Used for |
| --- | --- |
| [pvr.waipu](https://github.com/flubshi/pvr.waipu) (Kodi add-on, GPL-2.0-or-later) | login, channel list, stream URLs, Widevine license, EPG grid, recordings, instant restart, series recordings |
| [ha-waipu](https://github.com/GB-1972/ha-waipu) (Home Assistant, GPL-3.0) | cross-check of recording fields (`stationId`, `stationDisplay`, …); no code copied |
| play.waipu.tv network capture | setting favorites: `PATCH user-stations.waipu.tv/api/stations/user-settings/<id>` with `{"favorite": true\|false}` |
| play.waipu.tv capture in Safari (2026-11-15, kept local as `*.har`, never committed) | FairPlay: `GET drm.wpstr.tv/license-server-fairplay/cert/exaring` (DER, no auth); `POST drm.wpstr.tv/license-server-fairplay` with the raw SPC and a `dt-custom-data` header (same JSON as Widevine's `x-dt-custom-data`), answered with the base64 CKC |

The integration started as a port of `waipu2m3u`, a standalone playlist server in this repo; the
port is complete and the old package is deleted.

## Product

1. **A Home Assistant integration named `waipu_tv`**, display name "waipu.tv". `waipu` is taken by
   ha-waipu, and custom integrations with the same name can't be installed side by side.
2. **Distributed through Home Assistant's Marketplace only** (HACS until 2026.11). Home Assistant
   core is out of scope: core integrations can't ship their own sidebar panel, and the API is
   reverse engineered.
3. **Requires Home Assistant 2026.11** or later; no compatibility code for older versions.
4. **No standalone server and no Docker image.** The playlist server only exists inside Home
   Assistant.
5. **One waipu.tv account per Home Assistant instance** (`single_config_entry` in the manifest): a
   second setup attempt aborts with Home Assistant's "single instance" message. The entry's unique
   id is waipu.tv's user handle, so re-authentication refuses a different account.
6. **waipu.tv logins only.** No O2 or device-code login, no provider choice.
7. **Translations:** English and German. Channel names and program data stay as waipu.tv delivers
   them.
8. **License:** GPL-3.0-or-later, because the API client is derived from pvr.waipu (GPL-2.0-or-later);
   the README credits pvr.waipu.

## Repository and code

9. **One repo, renamed to `ha-waipu-tv`**:

   ```
   custom_components/waipu_tv/
     api/            waipu.tv library: no Home Assistant imports
     frontend/       built panel bundle (committed)
     ...             integration: config flow, coordinators, entities, actions, views, websocket
   frontend/         panel source (TypeScript, Lit, Vite)
   tests/
     api/            library tests against saved responses (tests/fixtures, anonymized or public)
     integration/    pytest-homeassistant tests
   scripts/dev       local Home Assistant on http://localhost:8123 with the integration; first start
                     onboards an owner "dev" / "dev"; data in config/ (ignored)
   requirements_test.txt
   ARCHITECTURE.md
   ```

   Inside the integration: `api/client.py` (HTTP calls), `api/models.py` (Channel, Program,
   Recording), `api/guide.py` (guide cache), `api/playlist.py` (M3U/XMLTV/HLS rendering);
   `coordinator.py` (runtime data and the shared changes used by actions and panel),
   `views.py` (playlist server), `websocket.py`, `services.py`, `panel.py`, `diagnostics.py`.

   `mockups/` stays local, outside git.

   Nothing is published to PyPI.
10. **The library is async**, built on asyncio and aiohttp, which Home Assistant already ships.
11. **The panel is TypeScript with Lit, built with Vite** into one JS file that is committed, so
    Marketplace users need no build step.
12. **Testing:**
    - library: unit tests against saved waipu.tv responses, anonymized;
    - integration: config flow, coordinators, websocket commands and playlist views with
      `pytest-homeassistant`;
    - before each release, a short manual checklist against a real account: login, a stream in
      Kodi, a DRM license, recording, deleting and a favorite.

## Setup and options

13. **Credentials:** only the refresh token and device id are stored, never the password; each
    sign-in (setup or re-authentication) uses a fresh device id, like a new pvr.waipu install. When the
    refresh token stops working, Home Assistant's re-authentication flow asks for the password again.
14. **Config flow in three steps.** Steps 2 and 3 are also the integration's Options.
    1. **Sign in:** e-mail and password.
    2. **Guide & entities:** channels to import (all visible, favorites only, live TV only), guide days
       (default 2), guide details for favorites, and a collapsible **Update intervals** section:

       | Setting | Default | Limits |
       | --- | --- | --- |
       | Channels & favorites | 1 h | at least 15 min |
       | Recordings | 1 h | at least 5 min |
       | Guide refresh | 2 h | at least 30 min |
       | Parallel guide requests | 4 | 1–8 |

    3. **Playlist server:** on/off, access key (generated, can be replaced), time-shift
       from program start (off), serve HLS playlists through Home Assistant (off).
15. **Changes made through the integration reload the affected data immediately**: recording,
    deleting, setting a favorite. The intervals only apply to changes made elsewhere.
16. **Stream quality is fixed:** the device capabilities sent to waipu.tv are up to 1080p50 H.264
    with AAC audio. No HEVC/UHD setting in v1.

## Guide

17. **The guide is cached per 4-hour window per channel**, shared by the panel, the calendar and the
    XMLTV guide; prefetched in the background and refreshed after the guide refresh interval while
    the old data is still served. Requests to waipu.tv are limited to the parallel-request setting.
    Reason: a full guide is about 5,600 requests; building it on demand took about 52 s.
18. **The guide covers the configured days from today**, nothing from earlier days. Programs that
    ended earlier today are shown greyed out.
19. **A broken guide window is skipped and logged**, never breaks the whole guide.

## Favorites

20. **Favorites are stored in the waipu.tv account**, via the captured `PATCH`, so changes show up in
    the waipu.tv apps.
21. **No reordering.** waipu.tv has no known API for a favorites order; favorites are sorted by channel
    number. Revisit only if a capture shows waipu.tv stores an order.

## Recordings

22. **v1 scope:** list (finished, running, scheduled; series grouped), storage used vs. booked hours,
    record a program, record a series, cancel scheduled recordings, delete finished ones (single and
    bulk). Conflicts and storage limits are left to waipu.tv.

## Panel

23. **A sidebar panel visible to all users**, with four tabs:
    - **Guide:** timeline grid (favorites or all channels), live/recording/scheduled markers, program
      dialog with Record, Record series, Cancel and add-channel-to-favorites;
    - **Favorites:** favorites list and all channels with filters, star toggles;
    - **Recordings:** status filters, series groups, bulk delete, storage meter;
    - **Playlists (admins only):** playlist and guide URLs with Copy buttons, link to the options.
24. **The panel talks to the integration through Home Assistant's websocket API** (commands such as
    `waipu_tv/guide`, `waipu_tv/recordings`, `waipu_tv/record`, `waipu_tv/set_favorite`), so Home
    Assistant handles login and permissions.
25. **Dashboard cards** ("Now on TV", "Upcoming recordings") come after v1.

## Entities and actions

26. **Entities:**

    | Entity | State |
    | --- | --- |
    | `sensor.waipu_tv_subscription` | package, e.g. "perfect plus" |
    | `binary_sensor.waipu_tv_recording` | on while a recording runs |
    | `sensor.waipu_tv_recording_storage` | hours used; booked hours as attribute |
    | `sensor.waipu_tv_recordings` | number of finished recordings (no list attribute) |
    | `calendar.waipu_tv` | see below |
    | `button.waipu_tv_refresh` | reloads channels, favorites, recordings and guide |

    No playlist-server switch and no per-channel "now playing" sensors.
27. **One calendar, `calendar.waipu_tv`,** for all waipu.tv information: the favorite channels'
    guide plus scheduled and running recordings. Each event has the program title as summary
    (recordings marked, e.g. "⏺ Tatort"), the channel as location and waipu.tv's program id as uid.
    Finished recordings and non-favorite channels are left out.
28. **Actions:**

    | Action | Data |
    | --- | --- |
    | `waipu_tv.record_program` | `program_id` |
    | `waipu_tv.record_series` | `program_id` (series and channel are read from the program) |
    | `waipu_tv.cancel_series` | `program_id` of a recorded or scheduled episode (stops the series; finished and running episodes stay) |
    | `waipu_tv.delete_recordings` | `recording_ids` (cancels scheduled, deletes finished) |
    | `waipu_tv.set_favorite` | `channel` (waipu.tv station id, e.g. `ard`), `favorite` |

    A calendar trigger can pass `trigger.calendar_event.uid` straight to `program_id`.
29. **Diagnostics download** includes subscription, channel count, guide cache status, recording
    counts, playlist settings and the last API errors; refresh token, device id, access key, e-mail
    and user handle are removed.

## Playlist server

30. **Served only by Home Assistant's web server** under `/api/waipu_tv`, reusing its HTTPS and
    reverse proxy. No separate port.
31. **Controlled only by the configuration** (step 3 / Options); when off, all `/api/waipu_tv`
    playlist URLs answer 404.
32. **Access key is mandatory** and generated during setup: IPTV players can't log in to Home
    Assistant, so these views bypass Home Assistant's auth and check `?key=` instead. A new key
    locks out old links.
33. **Endpoints:** `all.m3u`, `favorites.m3u`, `live.m3u`, `vod.m3u`, `recordings.m3u`, `epg.xml`
    (gzipped on request), stream redirects and the Widevine license relay. Playlist options
    `hidden=1`, `drm=0`, `protocol=`, `hls_proxy=`, `timeshift=1` as today. Each
    playlist's `url-tvg` points to the guide for the same channel selection.
34. **No re-encoding, ever.** Each stream request resolves a fresh stream URL and redirects to
    waipu.tv's CDN.
35. **No server-side DRM decryption.** DRM channels need a player with its own Widevine CDM (Kodi +
    inputstream.adaptive, TiviMate, OTT Navigator); players without Widevine use `drm=0`. The license
    relay adds waipu.tv's `x-dt-custom-data` header and unwraps the JSON response. M3U entries carry
    both the legacy `license_type`/`license_key` KODIPROPs and `drm_legacy` (Kodi 21+).
36. **Protocol choice:** HLS only for channels in pvr.waipu's `hls_allowlist.txt` (no DRM), DASH +
    Widevine for everything else, including on-demand channels. This diverges from pvr.waipu, which
    uses HLS for `google_vod` channels; on-demand channels were confirmed to play via DASH.
37. **On-demand channels stay in the playlists.**
38. **HLS playlist proxy is off by default.** waipu.tv's edge reportedly rejects playlist requests
    without gzip, which ffmpeg-based players (VLC, Jellyfin) don't send; the option, or `hls_proxy=1`
    per playlist, serves HLS playlists through Home Assistant. Segments always come from the CDN.
    Proxied URLs are HMAC-signed so the proxy can't fetch arbitrary URLs.
39. **Time-shift uses waipu.tv's instant restart** and is only offered when the account has it:
    live streams start at the running program's start, falling back to live. **No catch-up:**
    waipu.tv can't play programs that already ended (confirmed on an LG C9), so playlists carry no
    catch-up attributes.
40. **Unexpected errors answer HTTP 500** and are logged instead of dropping the connection.

## Decided during implementation

41. **Access key in the options:** Home Assistant forms have no "New key" button, so clearing the
    field generates a new key.
42. **Address for players:** mirrored from each request (scheme and host, so behind a reverse proxy
    the forwarded ones), not configured: players in different networks or VLANs each get URLs with
    the address they reached Home Assistant on. The panel shows its own browser address.
43. **Guide timing:** missing and stale windows are looked for every 10 minutes and fetched once older
    than the guide refresh interval; a broken window is retried after 5 minutes. The guide loads in the
    background after setup. The refresh button also reloads the whole guide, in the background.
44. **Calendar:** scheduled and running recordings show on every channel; only guide entries are
    limited to favorites. A recorded program shows once, as the recording.
45. **Shared changes:** recording, deleting and favorites live on the runtime data
    (`WaipuTvData`), used by both actions and websocket commands; each reloads the affected
    coordinator right away. With "favorites only" imports a favorite change also refreshes the guide.
46. **Websocket commands:** `waipu_tv/channels`, `guide` (returns the guide's days as local midnights,
    so the panel needs no time-zone arithmetic), `program`, `recordings`, `record` (`series` flag),
    `cancel_series`, `delete_recordings`, `set_favorite`, `playlists` (admins only; URLs, option defaults, instant
    restart).
47. **Panel registration:** registered while the account is loaded, removed on unload; the bundle is
    served from `/waipu_tv_static/` with a content hash in the URL. Vite's library mode leaves the
    committed bundle unminified, which keeps its diffs readable.
48. **Panel scope v1:** no "watched" column (watch progress isn't loaded), deleting asks with the
    browser's confirm dialog, the program dialog closes on backdrop clicks, the Playlists tab
    explains the per-playlist query parameters.
49. **Stopping a series** uses pvr.waipu's `recording-scheduler` delete request for the recording
    group. The action and the panel take an episode's program id and look the group up in the loaded
    recordings, so users never see group ids; the panel's series rows have a "Stop series" button.
50. **Guide details for favorites**, like pvr.waipu: after each guide check, the program API is asked
    once per program of a favorite (among the imported channels) in the guide range, within the
    parallel-request limit. Details don't change, so they are kept until the program leaves the
    guide; failed requests are retried on the next check. XMLTV gets `desc`, `credits`, `date` and
    `episode-num` (xmltv_ns) from them. The panel still loads details on demand.

## Rejected

- **Browser playback** in the panel: a first attempt with Shaka Player was removed. Being reconsidered
  (the mockup has a player view). A spike on 2026-11-15 (branch `prototype/drm-spike`, never
  merged) settled the main question, with a real account and localhost as the secure origin:
  - waipu.tv licenses browser DRM: Chrome's Widevine (DASH) played RTL at 1080p; Safari's FairPlay
    (HLS, via `fairplay_certificate` / `fairplay_license`) started at 360p and reached 1080p after
    about 12 s through Safari's own quality switching;
  - every stream checked carries AAC next to Dolby AC-3; Chrome picks AAC by itself;
  - waipu.tv's CDN sends `Access-Control-Allow-Origin: *`; the FairPlay license server only allows
    play.waipu.tv, so licenses go through Home Assistant;
  - DRM needs a secure origin in every browser: over plain HTTP only channels without DRM play.
- **Separate playlist server port, standalone server, Docker image:** replaced by Home Assistant's
  web server.
- **Playlist-server switch entity:** configuration only.
- **Configurable address for players:** one address can't fit several networks or VLANs; the
  address is mirrored from each request instead (decision 42).
- **Catch-up attributes in playlists:** waipu.tv can't play ended programs; only time-shift works.
- **Per-channel calendars or "now playing" sensors:** one calendar covers it.
- **Favorites order stored only in Home Assistant:** would drift from the waipu.tv apps.

## Unverified

Run against a real account: sign-in, channels, recordings, the full background guide load (about
19 s; 30 s with guide details) and the panel in headless Chrome (light, dark, narrow) in the dev
instance; recording, deleting (pvr.waipu's `{"ids": [...]}` body), favorites, recording and
stopping a series from the panel. On an LG C9 with
[webos-iptv-player](https://github.com/lennylxx/webos-iptv-player), `favorites.m3u` played DRM
(DASH + Widevine through the license relay), non-DRM (HLS) and on-demand channels, and time-shift
worked.

Still open:

- that HLS segments don't need gzip, only playlists;
- Kodi and TiviMate (only the LG C9 player was tried);
- what the cast `role` of the program API holds (character or job); XMLTV writes it as the actor's
  role.

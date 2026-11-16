# Architecture

**waipu.tv for Home Assistant** (`waipu_tv`) is a Home Assistant integration for a waipu.tv account.
It covers the TV guide, favorites and recording management, a player in its sidebar panel, plus M3U
playlists and an XMLTV guide for IPTV players, served by Home Assistant itself.

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
     frontend/       built panel bundle (not committed; built by the release workflow)
     ...             integration: config flow, coordinators, entities, actions, views, websocket
   frontend/         panel source (TypeScript, Lit, Vite)
   tests/
     api/            library tests against saved responses (tests/fixtures, anonymized or public)
     integration/    pytest-homeassistant tests
   scripts/dev       local Home Assistant on http://localhost:8123 with the integration; first start
                     onboards an owner "dev" / "dev"; data in config/ (ignored)
   scripts/artwork   the README's screenshots, from the real panel with waipu.tv's public guide
   .github/workflows tests (ruff, pytest, frontend build), validation (hassfest, HACS), release
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
11. **The panel is TypeScript with Lit, built with Vite**, and the build is not committed. Publishing
    a GitHub release runs `.github/workflows/release.yml`: it builds the panel into the integration,
    sets the manifest's version from the tag (`v0.2.0` → `0.2.0`) and attaches the integration as
    `waipu_tv.zip`, which the Marketplace installs (`zip_release` in `hacs.json`). `scripts/dev`
    and `scripts/artwork` build it locally; without a build the integration runs without the panel
    and logs a warning, which is how the tests run in CI.
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
       from program start (off), serve HLS playlists through Home Assistant (off), the
       player's preferred audio language (the stream's default), and parallel streams (1, up to
       8; decision 58).
15. **Changes made through the integration reload the affected data immediately**: recording,
    deleting, setting a favorite. The intervals only apply to changes made elsewhere.
16. **Stream quality is fixed:** the device capabilities sent to waipu.tv are up to 1080p50 H.264
    plus HEVC up to 2160p50, with AAC audio; players pick the variants they can decode. No quality
    setting in v1.

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
      dialog with Watch (running programs), Record, Record series, Cancel and
      add-channel-to-favorites;
    - **Watch:** the player (decisions 51–57), which is also where favorites are managed; there is no
      Favorites tab;
    - **Recordings:** status filters, series groups, bulk delete, storage meter, Play on finished
      recordings;
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
    | `sensor.waipu_tv_active_streams` | streams playing now; maximum and one entry per stream as attributes (decision 62) |
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
    counts, playlist settings, the stream slots in use (slot, type, panel or IPTV; no titles or
    viewers) and the last API errors; refresh token, device id, access key, e-mail and user handle
    are removed.

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
    the stream reaches back to the running program's start, falling back to live. It's an option
    for live channels (`timeshift=1` per playlist); on-demand channels always get it. IPTV players
    still open the stream at its live edge, so the program's start is there to rewind to. **No catch-up:**
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
    `cancel_series`, `delete_recordings`, `set_favorite`, `playlists` (admins only; URLs, option
    defaults, instant restart), and for the player `stream` (a subscription, decision 59; it took
    over `recording_stream`), `license`, `fairplay_certificate`.
47. **Panel registration:** registered while the account is loaded, removed on unload; the bundle is
    served from `/waipu_tv_static/` with a content hash in the URL. Vite's library mode leaves the
    bundle unminified. Shaka Player is a separate,
    hash-named chunk next to it (about 1 MB, 290 KB gzipped), loaded only when the player opens.
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

## Player

51. **Playback in the panel with Shaka Player 5.3.2**, in the Watch tab, also opened with Watch from
    the program dialog (running programs) and Play on finished recordings; other tabs leave it. Revisited after a
    first attempt was dropped: a spike on 2026-11-15 (branch `prototype/drm-spike`, never merged)
    showed with a real account that waipu.tv licenses browser DRM. Chrome's Widevine played RTL at
    1080p; Safari's FairPlay started at 360p and reached 1080p after about 12 s through Safari's own
    quality switching.
52. **DRM per browser:** Chrome, Edge, Firefox and Android get DASH + Widevine; Safari and iOS get
    HLS + FairPlay (asked for HLS, waipu.tv serves DRM channels as FairPlay, `skd://drmtoday`).
    Channels on pvr.waipu's HLS list play as HLS without DRM everywhere; recordings are treated as
    protected. DRM needs a secure origin (HTTPS or localhost) in every browser: over plain HTTP the
    player explains this and offers a favorite without DRM instead of failing.
53. **Stream URLs and licenses go through the websocket** (decision 46), for every user who can open
    the panel. Licenses travel as base64; Shaka reaches them through a `waipu-license:` URL scheme,
    so Home Assistant's login covers playback without extra HTTP endpoints. The FairPlay license
    server only allows play.waipu.tv as origin, so relaying is required anyway.
54. **Controls from the mockup, not the browser's:** a timeline of the running program (or the
    recording) showing how far back the stream reaches and where live is, play/pause, channel up/down
    through the sidebar list shown, audio track (when there is more than one), subtitles, volume (a
    vertical slider on hover or focus, remembered per browser; mute on click; iOS has no slider, it
    doesn't let pages set the volume), picture in picture and full screen (of the player, controls included); space pauses, ↑/↓ switch
    channels. Live shows when playback is more than 30 s behind live. From start (time-shift,
    decision 39; needs instant restart) only on on-demand channels. waipu.tv's time-shifted stream
    is still a live stream whose window reaches back to the program's start, and players open live
    streams at their live edge, so the player loads it with start time 0, which Shaka clamps to the
    earliest playable point: measured on Das Erste (HLS) and ZDF (DASH), it opens at the program's
    start instead of live. IPTV players still open at the live edge and have to be rewound.
    No watch progress in v1.
55. **Audio:** every stream checked carries AAC stereo next to Dolby Digital (AC-3) 5.1 in the main
    language; some add audio description (`qad`), clear language (`qks`), other languages or the
    original language (`qaa`, arte). At each start the player takes the preferred language when the
    stream has it, else the one playing, and within it the most channels the browser can decode, so
    5.1 where possible (Chrome can't decode Dolby Digital and stays on AAC; Safari can). The
    preference is the user's, else the integration option: a language picked in the audio menu is
    stored in the user's Home Assistant frontend data (`frontend/set_user_data`, key `waipu_tv`), so
    it follows the user to every device. waipu.tv's CDN sends `Access-Control-Allow-Origin: *`.
56. **Deep links:** the player follows the URL: `/waipu-tv/watch/<channel>` (plus `/from-start`) and
    `/waipu-tv/recording/<id>`, set with Home Assistant's own navigation (`pushState` and
    `location-changed`), so links can be bookmarked or shared and Back leaves the player. Switching
    channels inside the player replaces the history entry. The Watch tab is `/waipu-tv/watch`: it
    resumes what this browser watched last (local storage), else the first favorite.
57. **Favorites live in the player:** a star in the player's top bar for the current channel and on
    every channel in its sidebar, which lists favorites, all visible channels or on-demand channels
    (both with a filter) with what's on, or finished recordings. Hidden channels are not listed.

## Parallel streams

58. **One waipu.tv device per parallel stream.** waipu.tv plays one stream per device: a new
    stream URL for a device ends the stream it was playing (the player gets HTTP errors from the
    CDN, Shaka #1001). A fresh device-capabilities token per stream didn't help; what counts is the
    `waipuDeviceId` claim of the access token, set by the `waipu_device_id` sent with each token
    request. So each stream plays on a **slot**: slot 0 is the signed-in device, slot *n* a device
    with the id `uuid5(NAMESPACE_URL, "<device id>/<n>")`, stable across restarts and replaced with
    the device id on a new sign-in. A slot's access token comes from a refresh-token grant with its
    device id, after refreshing the main token so the refresh token is current; its access and
    device tokens stay in memory, nothing new is stored. Stream URLs and recording URLs are asked
    for from the slot's device; everything else (guide, recordings, licenses) stays on slot 0. The
    number of slots is an option (default 1, the old behavior; 1–8), up to what the package
    includes. If it's set higher, waipu.tv's own error shows when the extra stream starts.
59. **Panel players hold their slot through a websocket subscription**, `waipu_tv/stream`, with
    `channel` (plus `from_start`) or `recording_id`. Its first event is the stream URL from the
    slot's device; it holds the slot while the player has a stream loaded, paused included, and is
    released when the player switches channels (released before the next one is asked for, so a
    switch never needs a second slot), leaves the Watch tab, or the connection drops. The release
    is registered before the URL is fetched, so a connection closing meanwhile can't leak a slot.
    When the frontend renews the subscription after a reconnect, the player loads the new URL.
60. **IPTV clients are known by address and User-Agent** and keep their slot while zapping. Home
    Assistant only sees the redirect, so an IPTV stream counts as active until a timeout after the
    client's last request: 30 s when its live HLS playlists go through the proxy (they are
    refreshed while playing, each refresh extends it), else 4 h. Recordings always get 4 h: their
    playlist is fetched once. A failed stream request frees the slot.
61. **When every slot is busy:** if all are held by panel players, the new stream is refused
    ("All 2 streams are in use: Anna, 192.168.1.20" as a translated error in the panel, HTTP 503
    for IPTV). Otherwise the IPTV client that has been quiet the longest is taken over: its
    activity is only a guess, and a TV that was switched off would otherwise block everyone for up
    to 4 h. Panel players are never taken over.
62. **`sensor.waipu_tv_active_streams`**, enabled by default: the number of active streams as
    state, `maximum` and `streams` (per stream: `slot`, `type` live or recording, `title` channel or
    recording, `viewer` Home Assistant user name or IPTV client address, `since`) as attributes.
    It updates as streams start, stop or time out.
63. **Changing the maximum reloads the integration**, which drops all slots. Panel players get an
    `ended` event and start their stream again (retrying for about 30 s while the integration
    loads), with a short rebuffer: renewing only the slot would ask for a new URL anyway, and on
    the same device that would end the stream playing. IPTV streams keep playing and are counted
    again on their next request.

## Rejected

- **Separate playlist server port, standalone server, Docker image:** replaced by Home Assistant's
  web server.
- **Playlist-server switch entity:** configuration only.
- **Configurable address for players:** one address can't fit several networks or VLANs; the
  address is mirrored from each request instead (decision 42).
- **Catch-up attributes in playlists:** waipu.tv can't play ended programs; only time-shift works.
- **Per-channel calendars or "now playing" sensors:** one calendar covers it.
- **Favorites order stored only in Home Assistant:** would drift from the waipu.tv apps.
- **Rotating through the devices per stream request:** zapping would push other viewers off
  their device; slots are held per player instead (decisions 59 and 60).
- **Reading the stream limit from the account:** the access token only carries
  `account.subscriptionProductId` and `account.subscriptionTier`, and no API giving the number is
  known; the maximum is an option for now.

## Unverified

Run against a real account: sign-in, channels, recordings, the full background guide load (about
19 s; 30 s with guide details) and the panel in headless Chrome (light, dark, narrow) in the dev
instance; recording, deleting (pvr.waipu's `{"ids": [...]}` body), favorites, recording and
stopping a series from the panel. On an LG C9 with
[webos-iptv-player](https://github.com/lennylxx/webos-iptv-player), `favorites.m3u` played DRM
(DASH + Widevine through the license relay), non-DRM (HLS) and on-demand channels, and time-shift
worked.

Parallel streams: two streams on two derived devices played at the same time in the panel
(the experiment behind decision 58; the token for slot 1 carried its own `waipuDeviceId`). With
the slots built, two panel players in separate browser sessions and an IPTV player on the LG C9
played at the same time.

Still open:

- whether the refresh-token grants for several devices keep working over days (waipu.tv might tie
  refresh tokens to a device; the worst case is a re-authentication);
- whether recordings count toward waipu.tv's stream limit (they take a slot either way);
- whether waipu.tv counts a stream on a device as active for a while after it was stopped, which
  would let a quickly switching viewer exceed the package's limit;
- the package limits per subscription tier, which would let the maximum come from the account;
- that IPTV client addresses are distinct behind a reverse proxy or Home Assistant Cloud (needs
  `trusted_proxies`, else every client shares one address and only the User-Agent separates them);

- that HLS segments don't need gzip, only playlists;
- Kodi and TiviMate (only the LG C9 player was tried);
- the player in Firefox, Edge, and in the Android and iOS companion apps (FairPlay inside the iOS
  app's web view); Chrome and Safari played DRM and non-DRM channels and on-demand channels;
- From start on live channels in the panel, now that it opens at the program's start (only
  offered on on-demand channels so far);
- what the cast `role` of the program API holds (character or job); XMLTV writes it as the actor's
  role.

# Architecture

**waipu.tv for Home Assistant** (`waipu_tv`) is a Home Assistant integration for a waipu.tv account.
It covers the TV guide, favorites and recording management, a player in its sidebar panel, plus M3U
playlists and an XMLTV guide for IPTV players, served by Home Assistant itself.

This file records the decisions and why.

## Sources

The waipu.tv API is undocumented. Only port calls from these sources, never guess endpoints:

| Source | Used for |
| --- | --- |
| [pvr.waipu](https://github.com/flubshi/pvr.waipu) (Kodi add-on, GPL-2.0-or-later) | login, channel list, stream URLs, Widevine license, EPG grid, recordings, instant restart, series recordings |
| [ha-waipu](https://github.com/GB-1972/ha-waipu) (Home Assistant, GPL-3.0) | cross-check of recording fields (`stationId`, `stationDisplay`, …); no code copied |
| play.waipu.tv network capture | setting favorites: `PATCH user-stations.waipu.tv/api/stations/user-settings/<id>` with `{"favorite": true\|false}` |
| play.waipu.tv capture in Safari (kept local as `*.har`, never committed) | FairPlay: `GET drm.wpstr.tv/license-server-fairplay/cert/exaring` (DER, no auth); `POST drm.wpstr.tv/license-server-fairplay` with the raw SPC and a `dt-custom-data` header (same JSON as Widevine's `x-dt-custom-data`), answered with the base64 CKC |

## Product

1. **A Home Assistant integration named `waipu_tv`**, display name "waipu.tv". `waipu` is taken by
   ha-waipu, and custom integrations with the same name can't be installed side by side.
2. **Distributed through Home Assistant's Marketplace only.** Home Assistant core is out of scope:
   core integrations can't ship their own sidebar panel, and the API is reverse engineered.
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

9. **One repo, `ha-waipu-tv`**:

   ```
   custom_components/waipu_tv/
     api/            waipu.tv library: no Home Assistant imports
     frontend/       built panel bundle (not committed; built by the release workflow)
     ...             integration: config flow, coordinators, entities, actions, views, websocket
   frontend/         panel source (TypeScript, Lit, Vite)
   tests/
     api/            library tests against saved responses (tests/fixtures; real channel ids, synthetic text)
     integration/    pytest-homeassistant tests
   scripts/dev       local Home Assistant on http://localhost:8123 with the integration; first start
                     onboards an owner "dev" / "dev"; data in config/ (ignored)
   scripts/artwork   the README's screenshots, from the real panel with waipu.tv's public guide
   .github/workflows tests (ruff, pytest, frontend build), validation (hassfest, HACS), release
   requirements_test.txt
   ARCHITECTURE.md
   ```

   Inside the integration: `api/client.py` (HTTP calls), `api/models.py` (Channel, Program,
   Recording, Mediathek items), `api/guide.py` (guide cache), `api/playlist.py` (M3U/XMLTV/HLS
   rendering); `coordinator.py` (runtime data and the shared changes used by actions and panel),
   `streams.py` (parallel-stream slots), `views.py` (playlist server), `websocket.py`,
   `services.py`, `panel.py`, `diagnostics.py`.

   Nothing is published to PyPI.
10. **The library is async**, built on asyncio and aiohttp, which Home Assistant already ships.
11. **The panel is TypeScript with Lit, built with Vite**, and the build is not committed. Publishing
    a GitHub release runs `.github/workflows/release.yml`: it builds the panel into the integration,
    sets the manifest's version from the tag (`v0.2.0` → `0.2.0`) and attaches the integration as
    `waipu_tv.zip`, which the Marketplace installs (`zip_release` in `hacs.json`). `scripts/dev`
    and `scripts/artwork` build it locally; without a build the integration runs without the panel
    and logs a warning, which is how the tests run in CI.
12. **Testing:**
    - library: unit tests against saved waipu.tv responses, anonymized: channel ids stay real,
      titles, descriptions, names and images are synthetic;
    - integration: config flow, coordinators, websocket commands and playlist views with
      `pytest-homeassistant`;
    - before each release, a short manual checklist against a real account: login, a stream in
      an IPTV player, a DRM license, recording, deleting and a favorite.

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
       8; decision 59).
15. **Access key in the options:** Home Assistant forms have no "New key" button, so clearing the
    field generates a new key.
16. **Changes made through the integration reload the affected data immediately**: recording,
    deleting, setting a favorite. They live on the runtime data (`WaipuTvData`), used by both
    actions and websocket commands. With "favorites only" imports a favorite change also refreshes
    the guide. The intervals only apply to changes made elsewhere.
17. **Stream quality is fixed:** the device capabilities sent to waipu.tv are up to 1080p50 H.264
    plus HEVC up to 2160p50, with AAC audio; players pick the variants they can decode. No quality
    setting.

## Guide

18. **The guide is cached per 4-hour window per channel**, shared by the panel, the calendar and the
    XMLTV guide; prefetched in the background and refreshed after the guide refresh interval while
    the old data is still served. Requests to waipu.tv are limited to the parallel-request setting.
    Reason: a full guide is about 5,600 requests; building it on demand took about 52 s.
19. **Timing:** missing and stale windows are looked for every 10 minutes and fetched once older
    than the guide refresh interval; a broken window is skipped, logged and retried after 5
    minutes, never breaking the whole guide. The guide loads in the background after setup. The
    refresh button also reloads the whole guide, in the background.
20. **The guide covers the configured days from today**, nothing from earlier days. Programs that
    ended earlier today are shown greyed out.
21. **Guide details for favorites**, like pvr.waipu: after each guide check, the program API is asked
    once per program of a favorite (among the imported channels) in the guide range, within the
    parallel-request limit. Details don't change, so they are kept until the program leaves the
    guide; failed requests are retried on the next check. XMLTV gets `desc`, `credits`, `date` and
    `episode-num` (xmltv_ns) from them. The panel loads details on demand.

## Favorites

22. **Favorites are stored in the waipu.tv account**, via the captured `PATCH`, so changes show up in
    the waipu.tv apps.
23. **No reordering.** waipu.tv has no known API for a favorites order; favorites are sorted by channel
    number. Revisit only if a capture shows waipu.tv stores an order.

## Recordings

24. **Scope:** list (finished, running, scheduled; series grouped), storage used vs. booked hours,
    record a program, record a series, stop a series, cancel scheduled recordings, delete finished
    ones (single and bulk). Conflicts and storage limits are left to waipu.tv.
25. **Stopping a series** uses pvr.waipu's `recording-scheduler` delete request for the recording
    group. The action and the panel take an episode's program id and look the group up in the loaded
    recordings, so users never see group ids; the panel's series rows have a "Stop series" button.

## Entities and actions

26. **Entities:**

    | Entity | State |
    | --- | --- |
    | `sensor.waipu_tv_subscription` | package, e.g. "perfect plus" |
    | `binary_sensor.waipu_tv_recording` | on while a recording runs |
    | `sensor.waipu_tv_recording_storage` | hours used; booked hours as attribute |
    | `sensor.waipu_tv_recordings` | number of finished recordings (no list attribute) |
    | `sensor.waipu_tv_active_streams` | streams playing now; maximum and one entry per stream as attributes (decision 63) |
    | `calendar.waipu_tv` | see below |
    | `button.waipu_tv_refresh` | reloads channels, favorites, recordings and guide |

    No playlist-server switch and no per-channel "now playing" sensors.
27. **One calendar, `calendar.waipu_tv`,** for all waipu.tv information: the favorite channels'
    guide plus scheduled and running recordings. Each event has the program title as summary
    (recordings marked, e.g. "⏺ Tatort"), the channel as location and waipu.tv's program id as uid.
    Scheduled and running recordings show on every channel; only guide entries are limited to
    favorites. A recorded program shows once, as the recording. Finished recordings are left out.
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
33. **Address for players:** mirrored from each request (scheme and host, so behind a reverse proxy
    the forwarded ones), not configured: players in different networks or VLANs each get URLs with
    the address they reached Home Assistant on. The panel shows its own browser address.
34. **Endpoints:** `all.m3u`, `favorites.m3u`, `live.m3u`, `vod.m3u`, `recordings.m3u`,
    `mediathek/<category>.m3u` (decision 65), `epg.xml` (gzipped on request), stream redirects and
    the Widevine license relay. Playlist options `hidden=1`, `drm=0`, `protocol=`, `hls_proxy=`,
    `timeshift=`. Each playlist's `url-tvg` points to the guide for the same channel selection.
35. **No re-encoding, ever.** Each stream request resolves a fresh stream URL and redirects to
    waipu.tv's CDN.
36. **No server-side DRM decryption.** DRM channels need a player with its own Widevine CDM (Kodi +
    inputstream.adaptive, TiviMate, OTT Navigator); players without Widevine use `drm=0`. The license
    relay adds waipu.tv's `x-dt-custom-data` header and unwraps the JSON response. M3U entries carry
    both the legacy `license_type`/`license_key` KODIPROPs and `drm_legacy` (Kodi 21+).
37. **Protocol choice:** HLS only for channels in pvr.waipu's `hls_allowlist.txt` (no DRM), DASH +
    Widevine for everything else, including on-demand channels (pvr.waipu uses HLS for
    `google_vod` channels; DASH plays them too). The allowlist's channels have no DRM in their DASH
    streams either, so with `protocol=dash` their entries carry no license properties: a player
    told about Widevine may take its DRM path for them (webos-iptv-player then plays them through
    Shaka instead of webOS's own DASH player).
38. **On-demand channels stay in the playlists.**
39. **HLS playlist proxy is off by default.** waipu.tv's edge rejects playlist requests without
    gzip, which ffmpeg-based players (VLC, Jellyfin) don't send; the option, or `hls_proxy=1` per
    playlist, serves HLS playlists through Home Assistant. Segments don't need gzip and always come
    from the CDN.
    Proxied URLs are HMAC-signed so the proxy can't fetch arbitrary URLs.
40. **Time-shift uses waipu.tv's instant restart** and is only offered when the account has it:
    the stream reaches back to the running program's start, falling back to live. It's an option
    for live channels (`timeshift=1` per playlist). IPTV players open the stream at its live
    edge, with the program's start there to rewind to.
41. **On-demand channels don't stream live:** waipu.tv sends an on-demand asset of about 7 hours
    that begins at the running program's start and goes on with the next programs, over DASH and
    HLS alike, so players open them at that start. They never get a start time (it makes the asset
    begin a program earlier) and need no instant restart.
42. **No catch-up:** waipu.tv can't play programs that already ended, so playlists carry no
    catch-up attributes.
43. **Unexpected errors answer HTTP 500** and are logged instead of dropping the connection.

## Panel

44. **A sidebar panel visible to all users**, with five tabs:
    - **Guide:** timeline grid (favorites or all channels), live/recording/scheduled markers, program
      dialog with Watch (running programs), Record, Record series, Cancel and
      add-channel-to-favorites;
    - **TV:** the player for channels and recordings (decisions 49–58), which is also where
      favorites are managed; there is no Favorites tab;
    - **Mediathek:** the on-demand library and a player page per title (decision 68);
    - **Recordings:** status filters, series groups, bulk delete, storage meter, Play on finished
      recordings;
    - **Playlists (admins only):** playlist and guide URLs with Copy buttons (one per Mediathek
      category too), a custom playlist builder (decision 69), link to the options.
45. **The panel talks to the integration through Home Assistant's websocket API**, so Home
    Assistant handles login and permissions. Commands: `waipu_tv/channels`, `guide` (returns the
    guide's days as local midnights, so the panel needs no time-zone arithmetic), `program`,
    `recordings`, `record` (`series` flag), `cancel_series`, `delete_recordings`,
    `set_favorite`, `playlists` (admins only; URLs, their base path and the access key, option
    defaults, instant restart), `mediathek_categories` (with their genres), `mediathek` (a page of
    a category), `mediathek_series` (a season's series: all its seasons and episodes) and
    `mediathek_content` (decision 68), and for the player `stream` (a subscription, decision 60,
    for a channel, a recording or a Mediathek title), `license`, `fairplay_certificate`.
46. **Panel registration:** registered while the account is loaded, removed on unload; the bundle is
    served from `/waipu_tv_static/` with a content hash in the URL. Vite's library mode leaves the
    bundle unminified. Shaka Player is a separate, hash-named chunk next to it (about 1 MB, 290 KB
    gzipped), loaded only when the player opens.
47. **Panel scope:** no "watched" column (watch progress isn't loaded), deleting asks with the
    browser's confirm dialog, the program dialog closes on backdrop clicks, the Playlists tab
    explains the per-playlist query parameters.
48. **Dashboard cards** ("Now on TV", "Upcoming recordings") are not part of the panel yet.

## Player

49. **One player for the TV and Mediathek tabs:** `player.ts` (`waipu-player`) holds the video,
    Shaka Player 5.3.2, DRM, the parallel-stream slot, controls, timeline, audio, subtitles and keys.
    The TV tab (`tv-view.ts`) and the Mediathek title page (`mediathek-view.ts`) say what to play
    and whether it's live, and put their own buttons into its slots (the favorite star, From start,
    the watch-a-channel-without-DRM button). Watch in the program dialog (running programs) and Play
    on finished recordings open the TV tab; other tabs leave the player.
50. **DRM per browser:** Chrome, Edge, Firefox and Android get DASH + Widevine; Safari and iOS get
    HLS + FairPlay (asked for HLS, waipu.tv serves DRM channels as FairPlay, `skd://drmtoday`).
    Channels on pvr.waipu's HLS list play as HLS without DRM everywhere; recordings are treated as
    protected. DRM needs a secure origin (HTTPS or localhost) in every browser: over plain HTTP the
    player explains this and offers a favorite without DRM instead of failing.
51. **Stream URLs and licenses go through the websocket** (decision 45), for every user who can open
    the panel. Licenses travel as base64; Shaka reaches them through a `waipu-license:` URL scheme,
    so Home Assistant's login covers playback without extra HTTP endpoints. The FairPlay license
    server only allows play.waipu.tv as origin, so relaying is required anyway.
52. **Controls are the panel's own, not the browser's:** a timeline of the running program (or the
    recording or title) showing how far back the stream reaches and where live is, play/pause,
    channel up/down through the sidebar list shown, audio track (when there is more than one),
    subtitles, volume (a vertical slider on hover or focus, remembered per browser; mute on click;
    iOS has no slider, it doesn't let pages set the volume), picture in picture and full screen (of
    the player, controls included). Space pauses, ↑/↓ switch channels, ←/→ jump 30 s back or ahead
    within what can be played; ahead to the live edge is live again. The play position can be
    dragged: a label over the knob shows the time it would go to (the clock time live, the position
    in recordings and Mediathek titles), and it seeks only when let go; a click jumps. Live shows
    when playback is more than 30 s behind live. The bars over the video fade out while playing;
    taps and drags don't select text. No watch progress.
53. **Live channels play time-shifted** when the account has instant restart (decision 40), opened
    at the live edge, so the running program can be rewound to its start; without instant restart
    the stream reaches back about 2 minutes. From start (the `/from-start` deep link) opens the
    stream with start time 0, which Shaka clamps to the earliest playable point, the program's start.
54. **On-demand channels** (decision 41): the stream event carries the clock time at the asset's
    position 0, the start of the program running when the URL was asked for (from the guide). With
    it the player treats the asset as live: it opens at what's on now, the timeline runs on the
    clock and reaches back to the asset's start, Live seeks to now, From start opens the asset at 0,
    and dragging and ←/→ stay within what has aired, though the asset goes on past now. When the
    asset ends, the player asks for a new one. Without the guide it plays as a stream with a length,
    from its start. The From start button is only offered on on-demand channels.
55. **Under the player**, the running program's details (no separate details dialog, unlike the
    guide; no picture, the player shows the picture): title, date and times, episode title,
    progress, genre and recording status, the description, "not recordable", and Record, Record
    series or Cancel recording; for a recording its details and Delete.
56. **Audio:** every stream checked carries AAC stereo next to Dolby Digital (AC-3) in the main
    language; some add audio description (`qad`), clear language (`qks`), other languages or the
    original language (`qaa`). At each start the player takes the preferred language when the
    stream has it, else the one playing, and within it the most channels the browser can decode, so
    5.1 where possible (Chrome can't decode Dolby Digital and stays on AAC; Safari can). The
    preference is the user's, else the integration option: a language picked in the audio menu is
    stored in the user's Home Assistant frontend data (`frontend/set_user_data`, key `waipu_tv`), so
    it follows the user to every device. waipu.tv's CDN sends `Access-Control-Allow-Origin: *`.
57. **Deep links:** the player follows the URL: `/waipu-tv/watch/<channel>` (plus `/from-start`),
    `/waipu-tv/recording/<id>` and `/waipu-tv/mediathek/watch/<content id>`, set with Home
    Assistant's own navigation (`pushState` and `location-changed`), so links can be bookmarked or
    shared and Back leaves the player. Switching channels inside the player replaces the history
    entry. The TV tab is `/waipu-tv/watch`: it resumes what this browser watched last (local
    storage), else the first favorite.
58. **Favorites live in the player:** a star in the player's top bar for the current channel and on
    every channel in its sidebar, which lists favorites, all visible channels or on-demand channels
    (both with a filter) with what's on, or finished recordings. Hidden channels are not listed.

## Parallel streams

59. **One waipu.tv device per parallel stream.** waipu.tv plays one stream per device: a new
    stream URL for a device ends the stream it was playing (the player gets HTTP errors from the
    CDN, Shaka #1001). What counts is the `waipuDeviceId` claim of the access token, set by the
    `waipu_device_id` sent with each token request. So each stream plays on a **slot**: slot 0 is
    the signed-in device, slot *n* a device with the id `uuid5(NAMESPACE_URL, "<device id>/<n>")`,
    stable across restarts and replaced with the device id on a new sign-in. A slot's access token
    comes from a refresh-token grant with its device id, after refreshing the main token so the
    refresh token is current; its access and device tokens stay in memory, nothing new is stored.
    Stream URLs and recording URLs are asked for from the slot's device; everything else (guide,
    recordings, licenses) stays on slot 0. Recordings count toward waipu.tv's stream limit like live
    streams. The number of slots is an option (default 1; 1–8), up to what the package includes. If it's set higher, waipu.tv's own error shows when the extra stream
    starts.
60. **Panel players hold their slot through a websocket subscription**, `waipu_tv/stream`, with
    `channel` (time-shifted when the account has instant restart, decision 53), `recording_id` or
    `mediathek` (a content id). Its first event is the stream URL from the slot's device, for
    on-demand channels with `start`, the clock time at the asset's position 0 (decision 54). It
    holds the slot while the player has a stream loaded, paused included, and is released when the
    player switches channels (released before the next one is asked for, so a switch never needs a
    second slot), leaves its page, or the connection drops. The release is registered before the
    URL is fetched, so a connection closing meanwhile can't leak a slot. When the frontend renews
    the subscription after a reconnect, the player loads the new URL.
61. **IPTV clients are known by address and User-Agent** and keep their slot while zapping. Behind
    a reverse proxy this needs `trusted_proxies`, so each client keeps its own address. Home
    Assistant only sees the redirect, so an IPTV stream counts as active until a timeout after the
    client's last request: 30 s when its live HLS playlists go through the proxy (they are
    refreshed while playing, each refresh extends it), else 4 h. Recordings always get 4 h: their
    playlist is fetched once. A failed stream request frees the slot.
62. **When every slot is busy:** if all are held by panel players, the new stream is refused
    ("All 2 streams are in use: Anna, 192.168.1.20" as a translated error in the panel, HTTP 503
    for IPTV). Otherwise the IPTV client that has been quiet the longest is taken over: its
    activity is only a guess, and a TV that was switched off would otherwise block everyone for up
    to 4 h. Panel players are never taken over.
63. **`sensor.waipu_tv_active_streams`**, enabled by default: the number of active streams as
    state, `maximum` and `streams` (per stream: `slot`, `type` live, recording or mediathek,
    `title` channel, recording or title, `viewer` Home Assistant user name or IPTV client address,
    `since`) as attributes. It updates as streams start, stop or time out.
64. **Changing the maximum reloads the integration**, which drops all slots. Panel players get an
    `ended` event and start their stream again (retrying for about 30 s while the integration
    loads), with a short rebuffer: renewing only the slot would ask for a new URL anyway, and on
    the same device that would end the stream playing. IPTV streams keep playing and are counted
    again on their next request.

## Mediathek

waipu.tv's on-demand library, which waipu.tv calls waiputhek (`waiputhek.waipu.tv`).

65. **One playlist per Mediathek category**, `mediathek/<category>.m3u`, read from the app's
    "all" list (`waiputhek.waipu.tv/api/category/<category>/all`, 50 titles per page) with the
    app's `sortBy` (`mostWatched` by default, `latest`, `titleAsc`, `vanishingSoon`), an optional
    genre (`genreId`) and `limit` (100 by default, at most 500, so a playlist costs at most
    ten requests). Fetched on each playlist request, not cached. Entries are grouped by the
    title's channel. The panel lists the categories from `/api/filter`; the README names their ids.
66. **Series come as seasons.** A series card (`series: true`) is one season: the app link in its
    `url` names the collection and the season (`channelId`, `categoryId`; its tracking id
    doesn't always), so a season's id is `<collection>:<category>`. The collection's microsite
    (`v1/tuner/microsites/<collection>/contents`) lists its categories with their episodes; the
    season is the category with that id, and the series' other seasons are the categories whose
    episodes share its `seriesId` (a collection holds several series). Episodes are content ids
    like films and play the same way (decision 67). The microsite is read whole, about 0.5 MB for
    a large collection, so a season's request (`mediathek_series`) answers with the whole series,
    every season with its episodes; the panel keeps it for 10 minutes under each of its seasons,
    so switching seasons, the player's episode list and Back don't ask again (the integration
    doesn't cache it). Playlists leave seasons out: a season isn't a stream, and an episode list
    per playlist would grow without bound.
67. **A Mediathek stream** (`mediathek/<content id>.m3u8` or `.mpd`) reads the title's details
    (`v1/tuner/contents/<id>`) for its name and `streamUrlProvider`, then asks that URL with
    `?uh=<user handle>` and the slot's device token (decision 59) for `player.hls` or
    `player.mpd`, and redirects like a channel. It takes a parallel-stream slot of type
    `mediathek`. HLS is the default; DASH entries carry the Widevine KODIPROPs like recordings.
68. **Mediathek is a tab of its own**, not a list in the TV tab's sidebar, which is too narrow to
    explore a library:
    - **Library** (`/waipu-tv/mediathek`): the categories from `/api/filter` as tabs in the app's
      order, their genres as chips, the app's sort orders, and a grid of covers with channel,
      genre, length and "until" for titles about to leave. Pages of 50 come from the app's "all"
      list (`mediathek`, with `genre` and `page`), more with Load more. What's shown, loaded
      pages and scroll position stay while the panel is open, and a title opened from the library
      returns with Back, so leaving a title continues where the library was.
    - **Title page** (`/waipu-tv/mediathek/watch/<content id>`): the shared player and the title's
      details (`mediathek_content`: title, channel, genre, length, description), no sidebar. A
      title plays like a recording: from its start, with its length on the timeline, no zapping,
      live or time-shift. The details' `stationId` finds the channel for the logo when it's in the
      account. The stream subscription resolves the title like the playlist server (decision 67).
      Titles are protected (played with Widevine in Chrome); the player uses the browser's DRM
      system where it has one and plain HLS otherwise, instead of refusing to play as for DRM
      channels.
    - **Season page** (`/waipu-tv/mediathek/series/<season id>`, decision 66): the series'
      title and collection, its seasons as chips (switching replaces the history entry), and the
      season's episodes with number, title, length, description and "until" when an episode
      leaves within 30 days (most stay for years). Library cards of seasons carry a Series badge.
    - **Episode page** (`/waipu-tv/mediathek/series/<season id>/<content id>`): the title page
      with the season in the route, since an episode's content id looks like a film's and can't
      name its series. Beside the player, like the TV tab's sidebar, a season menu (preset to the
      episode's season) and that season's episodes, the playing one marked and scrolled into
      view; the player has Next episode, on into the next season. Picking an episode replaces
      the page in the history, so Back still goes to where the series was opened.
    - **Back** on the season, episode and title pages is the browser's Back while the page
      before was a Mediathek page (the panel keeps a trail of them), so the library keeps its
      place; opened from a link, it goes to the library.
69. **Custom playlists are URLs, put together in the Playlists tab.** Every playlist is fully
    described by its path and options, so the playlist server stays as it is: a builder picks
    what a playlist holds (channels, a Mediathek category, recordings) and shows only the options
    that apply, writing only those that differ from the defaults into the URL, which updates as
    it changes, to copy. Nothing is saved: it's a one-off to get a URL into a player. The access
    key comes with `waipu_tv/playlists`, so a new key changes every URL shown. The Mediathek's
    category playlists are listed from `/api/filter`, one per category.

## Rejected

- **Separate playlist server port, standalone server, Docker image:** Home Assistant's web server
  serves the playlists.
- **Playlist-server switch entity:** configuration only.
- **Configurable address for players:** one address can't fit several networks or VLANs; the
  address is mirrored from each request instead (decision 33).
- **Catch-up attributes in playlists:** waipu.tv can't play ended programs; only time-shift works.
- **Per-channel calendars or "now playing" sensors:** one calendar covers it.
- **Favorites order stored only in Home Assistant:** would drift from the waipu.tv apps.
- **Rotating through the devices per stream request:** zapping would push other viewers off
  their device; slots are held per player instead (decisions 60 and 61).
- **Reading the stream limit from the account:** the access token only carries
  `account.subscriptionProductId` and `account.subscriptionTier`, and no API giving the number is
  known; the maximum is an option.
- **A From start button on live channels:** dragging or ← reaches the program's start.

## Verified

Against a real account: sign-in, channels, recordings, the full background guide load (about 19 s;
30 s with guide details), recording, deleting (pvr.waipu's `{"ids": [...]}` body), favorites,
recording and stopping a series. The cast `role` of the program API is the part played (a
character, "Self" in documentaries), as XMLTV's `<actor role>` expects.

The panel's player in Chrome, Safari, Firefox, Edge and the Android and iOS companion apps: DRM and
non-DRM channels, on-demand channels over DASH and HLS (opening at what's on now, Live, From
start, dragging and ←/→), rewinding live channels, and Mediathek titles.

On an LG C9 with [webos-iptv-player](https://github.com/lennylxx/webos-iptv-player): DRM (DASH +
Widevine through the license relay), non-DRM and on-demand channels, time-shift, and 5.1 on
channels without DRM in webOS's own player. Rewinding DRM channels with `protocol=dash` needs the
app to read Shaka's seek range, which webOS 4.x reports as 0 to 2^32 seconds through the video
element (fixed in a fork of the app, not upstream yet).

Parallel streams: two panel players in separate browser sessions and an IPTV player on the LG C9
played at the same time on their own slots. Behind a reverse proxy, IPTV clients keep their own
addresses. The refresh-token grants for the slots' devices keep working over days, and switching
quickly between streams stays within the package's limit.

## Still open

- the package limits per subscription tier, which would let the maximum come from the account;
- Kodi and TiviMate (only the LG C9 player was tried);
- whether the Mediathek stream URL provider needs the device token (it gets it) or ignores the
  app's `gdprConsent`, and the Mediathek playlists in an IPTV player.

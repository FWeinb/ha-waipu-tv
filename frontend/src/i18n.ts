// Panel texts in English and German; channel names and program data stay as waipu.tv delivers
// them.

import type { HomeAssistant } from "./api";

const en = {
  guide: "Guide",
  favorites: "Favorites",
  recordings: "Recordings",
  playlists: "Playlists",
  refresh: "Refresh channels, guide and recordings",
  refreshing: "Reloading from waipu.tv…",
  today: "Today",
  tomorrow: "Tomorrow",
  tv_guide: "TV guide",
  all_channels: "All channels",
  search_programs: "Search programs",
  live: "Live",
  rec: "REC",
  scheduled: "Scheduled",
  legend_live: "running now",
  legend_rec: "recording",
  legend_sched: "will be recorded",
  legend_hint: "Select a program for details, recording and series recording.",
  no_favorites: "No favorites yet: star channels in the Watch tab.",
  loading: "Loading…",
  record: "Record",
  record_series: "Record series",
  cancel_recording: "Cancel recording",
  delete: "Delete",
  close: "Close",
  add_favorite: "Add channel to favorites",
  remove_favorite: "Remove channel from favorites",
  not_recordable: "This program can't be recorded.",
  ended: "Ended",
  recorded: "Recorded",
  recording_now: "Recording now",
  recording_started: "Recording scheduled: {title}",
  series_started: "Series recording set up: {title}",
  recording_cancelled: "Recording cancelled",
  favorites_note:
    "Synced with your waipu.tv account, so changes show up in the waipu.tv apps too. Sorted by channel number.",
  all: "All",
  on_demand: "On demand",
  hidden: "Hidden",
  filter_channels: "Filter channels",
  favorite_added: "{name} added to favorites",
  favorite_removed: "{name} removed from favorites",
  storage_used: "Storage used",
  of_hours: "of {hours} h",
  search_recordings: "Search recordings",
  selected: "{count} selected",
  delete_selected: "Delete selected",
  clear_selection: "Clear selection",
  confirm_delete: "Delete {count} recordings? Scheduled ones are cancelled.",
  deleted: "{count} recordings deleted",
  stop_series: "Stop series",
  confirm_stop_series: "Stop recording {title}? Scheduled episodes are cancelled, recorded ones are kept.",
  series_stopped: "{title}: series recording stopped",
  title: "Title",
  channel: "Channel",
  date: "Date",
  length: "Length",
  actions: "Actions",
  status: "Status",
  episodes: "{count} episodes",
  no_recordings: "No recordings.",
  playlist_server: "Playlist server",
  admins_only: "Admins only",
  running: "Running",
  off: "Off",
  playlists_off: "The playlist server is off. Turn it on in the integration options.",
  open_options: "Open integration options",
  copy: "Copy",
  copied: "Copied",
  copy_failed: "Copy not available here: select the URL instead",
  playlists_note:
    "For IPTV players like Kodi or TiviMate. The URLs contain your access key: anyone with them can watch on your waipu.tv account. A new key (in the options) locks out old links.",
  url_all: "All channels",
  url_favorites: "Favorites",
  url_live: "Live TV only",
  url_vod: "On-demand channels",
  url_recordings: "Recordings",
  url_epg: "XMLTV guide",
  options_title: "Playlist options",
  options_intro:
    "Add these to a playlist URL to change what it contains, e.g. …/favorites.m3u?key=…&drm=0. Each playlist's guide link (url-tvg) follows the same channel selection.",
  parameter: "Parameter",
  values: "Values",
  default: "Default",
  applies_to: "Applies to",
  meaning: "Meaning",
  m3u_playlists: "Channel playlists",
  on: "on",
  off_value: "off",
  from_options: "{value} (options)",
  param_hidden: "Include channels hidden in your waipu.tv channel list.",
  param_drm: "0: only channels without DRM (HLS), for players without Widevine.",
  param_protocol:
    "auto: HLS for channels pvr.waipu plays without DRM, DASH + Widevine for all others. Recordings: dash or hls.",
  param_timeshift: "Live channels can be rewound to the start of the running program; on-demand channels always can.",
  param_hls_proxy: "Serve HLS playlists through Home Assistant, for ffmpeg-based players (VLC, Jellyfin).",
  param_filter: "Channel selection of the guide: all, favorites, live or vod.",
  needs_restart: "Needs instant restart, which your waipu.tv package doesn't include.",
  error: "waipu.tv: {message}",
  watch: "Watch",
  watch_name: "Watch {name}",
  play_recording: "Play recording",
  from_start: "From start",
  prev_channel: "Previous channel",
  next_channel: "Next channel",
  no_guide: "No guide data",
  recording_from: "Recording from {date}",
  drm_https_title: "{name} is protected by DRM, which browsers only play over HTTPS",
  drm_https_text: "Open Home Assistant over HTTPS, for example through Home Assistant Cloud, to watch it here. Channels without DRM, such as Das Erste or ZDF, also play over HTTP. IPTV players are not affected.",
  drm_unsupported_title: "This browser can't play {name}",
  drm_unsupported_text: "It supports neither Widevine nor FairPlay. Channels without DRM, such as Das Erste or ZDF, play here.",
  playback_error: "Playback failed: {message}",
  pip: "Picture in picture",
  fullscreen: "Full screen",
  position: "Position",
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  volume: "Volume",
  subtitles: "Subtitles",
  audio_track: "Audio track",
  behind_live: "{minutes} min behind live",
  program_details: "Program details",
  delete_recording: "Delete recording",
  list_vod: "VOD",
  needs_https: "Needs HTTPS",
  no_favorites_watch: "No favorites yet: star channels under All or VOD, or the one you're watching.",
  no_channels_match: "No channels match.",
};

type Key = keyof typeof en;

const de: Record<Key, string> = {
  guide: "Programm",
  favorites: "Favoriten",
  recordings: "Aufnahmen",
  playlists: "Playlists",
  refresh: "Sender, Programm und Aufnahmen neu laden",
  refreshing: "Wird von waipu.tv neu geladen…",
  today: "Heute",
  tomorrow: "Morgen",
  tv_guide: "TV-Programm",
  all_channels: "Alle Sender",
  search_programs: "Sendungen suchen",
  live: "Live",
  rec: "REC",
  scheduled: "Geplant",
  legend_live: "läuft gerade",
  legend_rec: "wird aufgenommen",
  legend_sched: "Aufnahme geplant",
  legend_hint: "Wähle eine Sendung für Details, Aufnahme und Serienaufnahme.",
  no_favorites: "Noch keine Favoriten: markiere Sender im Tab Ansehen mit dem Stern.",
  loading: "Wird geladen…",
  record: "Aufnehmen",
  record_series: "Serie aufnehmen",
  cancel_recording: "Aufnahme abbrechen",
  delete: "Löschen",
  close: "Schließen",
  add_favorite: "Sender zu Favoriten hinzufügen",
  remove_favorite: "Sender aus Favoriten entfernen",
  not_recordable: "Diese Sendung kann nicht aufgenommen werden.",
  ended: "Beendet",
  recorded: "Aufgenommen",
  recording_now: "Nimmt gerade auf",
  recording_started: "Aufnahme geplant: {title}",
  series_started: "Serienaufnahme eingerichtet: {title}",
  recording_cancelled: "Aufnahme abgebrochen",
  favorites_note:
    "Mit deinem waipu.tv-Konto synchronisiert, Änderungen erscheinen auch in den waipu.tv-Apps. Nach Sendernummer sortiert.",
  all: "Alle",
  on_demand: "On-Demand",
  hidden: "Ausgeblendet",
  filter_channels: "Sender filtern",
  favorite_added: "{name} zu Favoriten hinzugefügt",
  favorite_removed: "{name} aus Favoriten entfernt",
  storage_used: "Speicher belegt",
  of_hours: "von {hours} h",
  search_recordings: "Aufnahmen suchen",
  selected: "{count} ausgewählt",
  delete_selected: "Auswahl löschen",
  clear_selection: "Auswahl aufheben",
  confirm_delete: "{count} Aufnahmen löschen? Geplante werden abgebrochen.",
  deleted: "{count} Aufnahmen gelöscht",
  stop_series: "Serie beenden",
  confirm_stop_series: "Aufnahme von {title} beenden? Geplante Folgen werden abgebrochen, aufgenommene bleiben erhalten.",
  series_stopped: "{title}: Serienaufnahme beendet",
  title: "Titel",
  channel: "Sender",
  date: "Datum",
  length: "Länge",
  actions: "Aktionen",
  status: "Status",
  episodes: "{count} Folgen",
  no_recordings: "Keine Aufnahmen.",
  playlist_server: "Playlist-Server",
  admins_only: "Nur Admins",
  running: "Aktiv",
  off: "Aus",
  playlists_off: "Der Playlist-Server ist aus. Schalte ihn in den Optionen der Integration ein.",
  open_options: "Optionen der Integration öffnen",
  copy: "Kopieren",
  copied: "Kopiert",
  copy_failed: "Kopieren nicht möglich: markiere die URL stattdessen",
  playlists_note:
    "Für IPTV-Player wie Kodi oder TiviMate. Die URLs enthalten deinen Zugangsschlüssel: Jeder damit kann über dein waipu.tv-Konto schauen. Ein neuer Schlüssel (in den Optionen) sperrt alte Links.",
  url_all: "Alle Sender",
  url_favorites: "Favoriten",
  url_live: "Nur Live-TV",
  url_vod: "On-Demand-Sender",
  url_recordings: "Aufnahmen",
  url_epg: "XMLTV-Programm",
  options_title: "Playlist-Optionen",
  options_intro:
    "Hänge sie an eine Playlist-URL an, um den Inhalt zu ändern, z. B. …/favorites.m3u?key=…&drm=0. Der Programm-Link jeder Playlist (url-tvg) folgt derselben Senderauswahl.",
  parameter: "Parameter",
  values: "Werte",
  default: "Standard",
  applies_to: "Gilt für",
  meaning: "Bedeutung",
  m3u_playlists: "Sender-Playlists",
  on: "an",
  off_value: "aus",
  from_options: "{value} (Optionen)",
  param_hidden: "Auch Sender, die in deiner waipu.tv-Senderliste ausgeblendet sind.",
  param_drm: "0: nur Sender ohne DRM (HLS), für Player ohne Widevine.",
  param_protocol:
    "auto: HLS für Sender, die pvr.waipu ohne DRM abspielt, DASH + Widevine für alle anderen. Aufnahmen: dash oder hls.",
  param_timeshift: "Live-Sender lassen sich bis zum Beginn der laufenden Sendung zurückspulen; On-Demand-Sender immer.",
  param_hls_proxy: "HLS-Playlists über Home Assistant ausliefern, für ffmpeg-basierte Player (VLC, Jellyfin).",
  param_filter: "Senderauswahl des Programms: all, favorites, live oder vod.",
  needs_restart: "Benötigt Instant Restart, das dein waipu.tv-Paket nicht enthält.",
  error: "waipu.tv: {message}",
  watch: "Ansehen",
  watch_name: "{name} ansehen",
  play_recording: "Aufnahme abspielen",
  from_start: "Von Anfang",
  prev_channel: "Vorheriger Sender",
  next_channel: "Nächster Sender",
  no_guide: "Keine Programmdaten",
  recording_from: "Aufnahme vom {date}",
  drm_https_title: "{name} ist mit DRM geschützt; Browser spielen das nur über HTTPS ab",
  drm_https_text: "Öffne Home Assistant über HTTPS, zum Beispiel über Home Assistant Cloud, um den Sender hier zu sehen. Sender ohne DRM wie Das Erste oder ZDF laufen auch über HTTP. IPTV-Player sind nicht betroffen.",
  drm_unsupported_title: "Dieser Browser kann {name} nicht abspielen",
  drm_unsupported_text: "Er unterstützt weder Widevine noch FairPlay. Sender ohne DRM wie Das Erste oder ZDF laufen hier.",
  playback_error: "Wiedergabe fehlgeschlagen: {message}",
  pip: "Bild-in-Bild",
  fullscreen: "Vollbild",
  position: "Position",
  play: "Abspielen",
  pause: "Pause",
  mute: "Ton aus",
  unmute: "Ton an",
  volume: "Lautstärke",
  subtitles: "Untertitel",
  audio_track: "Tonspur",
  behind_live: "{minutes} Min. hinter live",
  program_details: "Sendungsdetails",
  delete_recording: "Aufnahme löschen",
  list_vod: "VOD",
  needs_https: "Braucht HTTPS",
  no_favorites_watch: "Noch keine Favoriten: markiere Sender unter Alle oder VOD mit dem Stern, oder den, den du gerade siehst.",
  no_channels_match: "Keine passenden Sender.",
};

/** Numbers in vars are formatted like the user's other numbers. */
export function t(hass: HomeAssistant, key: Key, vars: Record<string, string | number> = {}) {
  const text = (hass.language?.startsWith("de") ? de : en)[key];
  return text.replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars[name] ?? "";
    return typeof value === "number" ? formatNumber(hass, value) : value;
  });
}

// the languages Home Assistant formats a fixed number format with
const NUMBER_LOCALES: Record<string, string[] | undefined> = {
  comma_decimal: ["en-US", "en"],
  decimal_comma: ["de", "es", "it"],
  space_comma: ["fr", "sv", "cs"],
  system: undefined,
};

/** A number as the user set it up in their Home Assistant profile, like the rest of Home Assistant:
 * the language's format, the system's, a fixed decimal and group separator, or none at all. */
export function formatNumber(hass: HomeAssistant, value: number, options?: Intl.NumberFormatOptions) {
  const format = hass.locale?.number_format;
  if (format === "none") return new Intl.NumberFormat("en-US", { ...options, useGrouping: false }).format(value);
  const locale = format && format in NUMBER_LOCALES ? NUMBER_LOCALES[format] : (hass.locale?.language ?? hass.language);
  return new Intl.NumberFormat(locale, options).format(value);
}

export interface DateFormatter {
  format(date: Date | number): string;
}

/** 12-hour clock or not, decided like Home Assistant's own frontend does. */
function amPm(time: string | undefined, language: string) {
  if (time === "am_pm") return true;
  if (time === "24") return false;
  const sample = new Date(2023, 0, 1, 22).toLocaleString(time === "system" ? undefined : language);
  return sample.includes("10");
}

/** Times and dates as the user set them up in their Home Assistant profile, like the rest of Home
 * Assistant: language, 12- or 24-hour clock, the order of numeric dates, and the browser's or the
 * server's time zone. options may name a time zone of their own. */
export function formatter(hass: HomeAssistant, options: Intl.DateTimeFormatOptions): DateFormatter {
  const locale = hass.locale;
  const language = locale?.language ?? hass.language;
  const timeZone = locale?.time_zone === "local" ? undefined : hass.config.time_zone;
  const clock: Intl.DateTimeFormatOptions = options.hour
    ? { hourCycle: amPm(locale?.time_format, language) ? "h12" : "h23" }
    : {};
  const all = { timeZone, ...clock, ...options };
  const order = locale?.date_format;
  const numeric = options.month === "numeric" || options.month === "2-digit";
  if (!numeric || !order || order === "language") return new Intl.DateTimeFormat(language, all);
  if (order === "system") return new Intl.DateTimeFormat(undefined, all);

  // day, month and year in the chosen order, like Home Assistant: 15/11, 11/15 or 2026/11/15
  const { hour, minute, ...dateOptions } = all;
  const date = new Intl.DateTimeFormat(language, { ...dateOptions, hourCycle: undefined });
  const time = hour ? new Intl.DateTimeFormat(language, { timeZone: all.timeZone, ...clock, hour, minute }) : null;
  return {
    format(value) {
      const parts = Object.fromEntries(date.formatToParts(value).map((p) => [p.type, p.value]));
      const fields: Record<string, string | undefined> = { D: parts.day, M: parts.month, Y: parts.year };
      const text = [...order].map((k) => fields[k]).filter(Boolean).join("/");
      return time ? `${text}, ${time.format(value)}` : text;
    },
  };
}

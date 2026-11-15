// Websocket commands of the waipu_tv integration (custom_components/waipu_tv/websocket.py).

export interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(callback: (msg: T) => void, msg: Record<string, unknown>): Promise<() => Promise<void>>;
  };
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
  language: string;
  /** The user's profile settings for formatting (Home Assistant's FrontendLocaleData). */
  locale?: {
    language: string;
    number_format: "language" | "system" | "comma_decimal" | "decimal_comma" | "space_comma" | "none";
    time_format: "language" | "system" | "am_pm" | "24";
    date_format: "language" | "system" | "DMY" | "MDY" | "YMD";
    time_zone: "local" | "server";
  };
  config: { time_zone: string };
  user?: { is_admin: boolean };
}

export interface Channel {
  id: string;
  name: string;
  number: number;
  logo: string;
  favorite: boolean;
  visible: boolean;
  vod: boolean;
  hls: boolean;
}

export interface Program {
  id: string;
  channel_id: string;
  title: string;
  episode_title: string | null;
  genre: string | null;
  start: string;
  stop: string;
  image: string | null;
  series_id: string | null;
  recordable: boolean;
}

export type RecordingStatus = "SCHEDULED" | "RECORDING" | "FINISHED" | "FAILED";

export interface Recording {
  id: string;
  program_id: string | null;
  channel_id: string;
  title: string;
  episode_title: string | null;
  status: RecordingStatus;
  start: string | null;
  duration: number;
  group: number | null;
  image: string | null;
  season: string | null;
  episode: string | null;
}

export interface ChannelsResult {
  subscription: string | null;
  instant_restart: boolean;
  channels: Channel[];
  /** The player's default audio language from the integration options; null: the stream's. */
  audio_language: string | null;
}

export interface GuideResult {
  start: string;
  end: string;
  days: string[];
  programs: Record<string, Program[]>;
}

export interface RecordingsResult {
  recordings: Recording[];
  recorded_hours: number;
  booked_hours: number;
}

export interface PlaylistsResult {
  enabled: boolean;
  entry_id: string;
  urls: Record<string, string>;
  defaults: { timeshift: boolean; hls_proxy: boolean };
  instant_restart: boolean;
}

/** waipu.tv's program details; only the fields the dialog shows. */
export interface ProgramDetails {
  textContent?: { descLong?: string; descShort?: string };
  [key: string]: unknown;
}

const ws = <T>(hass: HomeAssistant, type: string, data: Record<string, unknown> = {}) =>
  hass.callWS<T>({ type: `waipu_tv/${type}`, ...data });

export const fetchChannels = (hass: HomeAssistant) => ws<ChannelsResult>(hass, "channels");

export const fetchGuide = (hass: HomeAssistant, start: Date, end: Date, channels?: string[]) =>
  ws<GuideResult>(hass, "guide", {
    start: start.toISOString(),
    end: end.toISOString(),
    ...(channels ? { channels } : {}),
  });

export const fetchProgram = (hass: HomeAssistant, programId: string) =>
  ws<ProgramDetails>(hass, "program", { program_id: programId });

export const fetchRecordings = (hass: HomeAssistant) => ws<RecordingsResult>(hass, "recordings");

export const fetchPlaylists = (hass: HomeAssistant) => ws<PlaylistsResult>(hass, "playlists");

export const record = (hass: HomeAssistant, programId: string, series = false) =>
  ws<null>(hass, "record", { program_id: programId, series });

export const cancelSeries = (hass: HomeAssistant, programId: string) =>
  ws<null>(hass, "cancel_series", { program_id: programId });

export const deleteRecordings = (hass: HomeAssistant, recordingIds: string[]) =>
  ws<null>(hass, "delete_recordings", { recording_ids: recordingIds });

export const setFavorite = (hass: HomeAssistant, channel: string, favorite: boolean) =>
  ws<null>(hass, "set_favorite", { channel, favorite });

export type Protocol = "dash" | "hls";
export type DrmSystem = "widevine" | "fairplay";

export type StreamTarget = { channel: string; from_start: boolean } | { recording_id: string };

/** Holds one of the parallel-stream slots while subscribed. onUrl gets the stream URL, and a
 * new one when the subscription is renewed after Home Assistant's connection comes back;
 * onEnded: the integration unloaded and the slot is gone. Resolves to the unsubscribe. */
export const subscribeStream = (
  hass: HomeAssistant,
  target: StreamTarget,
  protocol: Protocol,
  onUrl: (url: string) => void,
  onEnded: () => void,
) =>
  hass.connection.subscribeMessage<{ url?: string; ended?: boolean }>((e) => (e.url ? onUrl(e.url) : onEnded()), {
    type: "waipu_tv/stream",
    protocol,
    ...target,
  });

/** challenge and license are base64. */
export const fetchLicense = (hass: HomeAssistant, system: DrmSystem, challenge: string) =>
  ws<{ license: string }>(hass, "license", { system, challenge });

export const fetchFairplayCertificate = (hass: HomeAssistant) =>
  ws<{ certificate: string }>(hass, "fairplay_certificate");

/** Per-user panel settings, kept by Home Assistant with the user's frontend data, so they follow
 * the user to every device. */
export interface UserSettings {
  audio_language?: string;
}

const USER_DATA_KEY = "waipu_tv";

export const fetchUserSettings = (hass: HomeAssistant) =>
  hass
    .callWS<{ value: UserSettings | null }>({ type: "frontend/get_user_data", key: USER_DATA_KEY })
    .then((r) => r.value ?? {});

export const saveUserSettings = (hass: HomeAssistant, value: UserSettings) =>
  hass.callWS<null>({ type: "frontend/set_user_data", key: USER_DATA_KEY, value });

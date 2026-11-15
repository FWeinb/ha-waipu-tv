// Websocket commands of the waipu_tv integration (custom_components/waipu_tv/websocket.py).

export interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
  language: string;
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

export const fetchStream = (hass: HomeAssistant, channel: string, protocol: Protocol, fromStart: boolean) =>
  ws<{ url: string }>(hass, "stream", { channel, protocol, from_start: fromStart });

export const fetchRecordingStream = (hass: HomeAssistant, recordingId: string, protocol: Protocol) =>
  ws<{ url: string }>(hass, "recording_stream", { recording_id: recordingId, protocol });

/** challenge and license are base64. */
export const fetchLicense = (hass: HomeAssistant, system: DrmSystem, challenge: string) =>
  ws<{ license: string }>(hass, "license", { system, challenge });

export const fetchFairplayCertificate = (hass: HomeAssistant) =>
  ws<{ certificate: string }>(hass, "fairplay_certificate");

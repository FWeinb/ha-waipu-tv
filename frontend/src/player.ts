// The player shared by the TV and Mediathek pages: the video with its own controls, Shaka Player
// (loaded on first use), the DRM license relay through Home Assistant's websocket, the
// parallel-stream slot (a subscription held while playing), audio and subtitle choice, the
// timeline and the keyboard. Pages say what to play and put their own buttons into the slots
// "top" (after the title over the video), "controls" (after play/pause) and "blocked" (under the
// message when the browser can't play DRM). Chrome, Edge, Firefox and Android get DASH +
// Widevine, Safari and iOS HLS + FairPlay; streams without DRM play as HLS everywhere, also over
// plain HTTP.

import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import type shakaLib from "shaka-player/dist/shaka-player.compiled-es2021.js";

import {
  fetchFairplayCertificate,
  fetchLicense,
  fetchUserSettings,
  saveUserSettings,
  subscribeStream,
  type DrmSystem,
  type HomeAssistant,
  type StreamTarget,
  type UserSettings,
} from "./api";
import { formatter, t } from "./i18n";
import {
  downIcon,
  fullscreenIcon,
  mutedIcon,
  pauseIcon,
  pipIcon,
  playIcon,
  subtitlesIcon,
  upIcon,
  volumeIcon,
} from "./icons";
import { shared } from "./styles";

type Shaka = typeof shakaLib;

/** What to play. drm: "required" (recordings, DRM channels), "none" (channels on pvr.waipu's HLS
 * list) or "optional" (Mediathek titles: the browser's DRM system where it has one, else HLS). */
export interface PlaySource {
  stream: StreamTarget;
  drm: "required" | "none" | "optional";
  /** For the message when the browser can't play it. */
  name: string;
  /** Live: open at the earliest playable point, the program's start, instead of the live edge
   * (live channels' streams are time-shifted when the account has instant restart). */
  fromStart?: boolean;
}

/** Live: the running program's times for the timeline, when the guide has them. */
export interface LiveProgram {
  start: string;
  stop: string;
}


const LICENSE_SCHEME = "waipu-license";
const BEHIND_LIVE = 30_000; // further behind than this, the Live button shows
const JUMP_S = 30; // ← and → jump this far
const IDLE_MS = 3000; // the bar over the video fades out this long after the last mouse move or tap
const VOLUME_KEY = "waipu-tv.volume"; // remembered per browser
// after the integration reloads (new options), the player asks again for this long
const RETRY_MS = 2000;
const RETRIES = 15;
// iOS doesn't let pages set the volume (it stays 1): the slider is left out there
const canSetVolume = (() => {
  const probe = document.createElement("video");
  probe.volume = 0.5;
  return probe.volume === 0.5;
})();
let shakaLoading: Promise<Shaka> | undefined;
let licenseHass: HomeAssistant | undefined; // the connection the license scheme asks through

const toBase64 = (data: ArrayBuffer | ArrayBufferView) => {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
};
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

function loadShaka(): Promise<Shaka> {
  shakaLoading ??= import("shaka-player/dist/shaka-player.compiled-es2021.js").then(({ default: shaka }) => {
    shaka.polyfill.installAll();
    // "waipu-license:widevine" and "waipu-license:fairplay" answer from the websocket
    shaka.net.NetworkingEngine.registerScheme(LICENSE_SCHEME, (uri, request) => {
      const system = uri.slice(LICENSE_SCHEME.length + 1) as DrmSystem;
      const response = fetchLicense(licenseHass!, system, toBase64(request.body!)).then(
        ({ license }): shakaLib.extern.Response => ({
          uri,
          originalUri: uri,
          originalRequest: request,
          data: fromBase64(license),
          headers: {},
        }),
        (err: { message?: string }) => {
          throw new shaka.util.Error(
            shaka.util.Error.Severity.CRITICAL,
            shaka.util.Error.Category.NETWORK,
            shaka.util.Error.Code.HTTP_ERROR,
            uri,
            err?.message ?? String(err),
          );
        },
      );
      return shaka.util.AbortableOperation.notAbortable(response);
    });
    return shaka;
  });
  return shakaLoading;
}

let drmProbe: Promise<DrmSystem | null> | undefined;

/** The browser's DRM system; null over plain HTTP, where browsers turn DRM off. */
function drmSystem(): Promise<DrmSystem | null> {
  drmProbe ??= (async () => {
    if (!navigator.requestMediaKeySystemAccess) return null;
    const systems = [
      ["widevine", "com.widevine.alpha", ["cenc"]],
      ["fairplay", "com.apple.fps", ["sinf", "skd"]],
    ] as const;
    for (const [system, keySystem, initDataTypes] of systems) {
      try {
        await navigator.requestMediaKeySystemAccess(keySystem, [
          { initDataTypes: [...initDataTypes], videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.640028"' }] },
        ]);
        return system;
      } catch {
        // not this one
      }
    }
    return null;
  })();
  return drmProbe;
}

const CODECS: [string, string][] = [
  ["mp4a", "AAC"],
  ["ec-3", "Dolby Digital Plus"],
  ["ac-3", "Dolby Digital"],
];

function audioLabel(track: shakaLib.extern.AudioTrack) {
  const codec = CODECS.find(([prefix]) => track.codecs?.startsWith(prefix))?.[1] ?? track.codecs ?? "";
  const layout = !track.channelsCount || track.channelsCount <= 2 ? "Stereo" : track.channelsCount === 6 ? "5.1" : `${track.channelsCount} ch`;
  return [track.label || track.language, `${layout}${codec ? ` (${codec})` : ""}`].filter(Boolean).join(" · ");
}

/** The preferred language when the stream has it, else the one playing; within it the most
 * channels the browser can decode, so 5.1 where possible (Shaka only lists playable tracks: Chrome
 * can't decode Dolby Digital, Safari can). Applied once per start. */
function pickAudio(player: shakaLib.Player, language: string | null | undefined) {
  const tracks = player.getAudioTracks();
  const active = tracks.find((a) => a.active);
  if (!active) return;
  const wanted = language && tracks.some((a) => a.language === language) ? language : active.language;
  const best = tracks
    .filter((a) => a.language === wanted)
    .sort((a, b) => (b.channelsCount ?? 0) - (a.channelsCount ?? 0))[0];
  if (best && best !== active) player.selectAudioTrack(best);
}

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  return `${h ? `${h}:` : ""}${mm}:${String(s % 60).padStart(2, "0")}`;
};

/** The timeline under the video; times in ms (wall clock) for live, seconds for recordings. */
interface Timeline {
  start: number;
  end: number;
  avail: [number, number]; // what can be seeked to
  pos: number;
  live?: number; // the live edge
  label?: [string, string]; // live: the program's start and end under the timeline
  seek: (value: number) => void;
}

/** The buttons over the video, also for the buttons pages put into the player's slots. */
export const videoButtons = css`
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        flex: none;
      }
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .icon-btn[aria-pressed="true"] {
        color: #4fc3f7;
      }
      .star-btn.on-video {
        color: #fff;
      }
      .star-btn.on-video:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .star-btn.on-video[aria-pressed="true"] {
        color: var(--wt-fav);
      }
      .pill {
        height: 32px;
        padding: 0 12px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: none;
        color: #fff;
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .pill:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .pill[aria-pressed="true"] {
        background: rgba(255, 255, 255, 0.22);
      }
      .pill.live[aria-pressed="true"] {
        background: var(--wt-rec);
        border-color: var(--wt-rec);
      }
      .pill:disabled {
        opacity: 0.4;
        cursor: default;
      }
`;

class WaipuPlayer extends LitElement {
  static properties = {
    hass: { attribute: false },
    source: { attribute: false },
    audioLanguage: { attribute: false },
    live: { type: Boolean },
    program: { attribute: false },
    liveButton: { type: Boolean },
    zap: { type: Boolean },
    logo: { attribute: false },
    heading: { attribute: false },
    subheading: { attribute: false },
    _blocked: { state: true },
    _error: { state: true },
    _badge: { state: true },
    _playing: { state: true },
    _muted: { state: true },
    _volume: { state: true },
    _audio: { state: true },
    _text: { state: true },
    _tick: { state: true },
    _idle: { state: true },
    _autoMuted: { state: true },
    _drag: { state: true },
  };

  declare hass: HomeAssistant;
  /** A new object starts playback. */
  declare source?: PlaySource;
  /** The integration's default; a language picked in the audio menu overrides it for the user. */
  declare audioLanguage: string | null;
  /** A live stream (wall-clock timeline, Live button) rather than one with a start and a length. */
  declare live: boolean;
  declare program?: LiveProgram;
  /** Always show the Live button (on-demand channels, time-shift), not only when behind live. */
  declare liveButton: boolean;
  /** Channel up/down buttons and arrow keys; they send waipu-zap events. */
  declare zap: boolean;
  declare logo?: string;
  declare heading: string;
  declare subheading: string;
  declare _blocked?: { title: string; text: string };
  declare _error?: string;
  declare _badge?: string;
  declare _playing: boolean;
  declare _muted: boolean;
  declare _volume: number;
  declare _audio: shakaLib.extern.AudioTrack[];
  declare _text: shakaLib.extern.TextTrack[];
  declare _tick: number;
  /** The bar over the video is faded out: playing, and no mouse or touch for a while. */
  declare _idle: boolean;
  /** The browser only allowed playback without sound; a button offers to turn it on. */
  declare _autoMuted: boolean;
  /** Where the play position is being dragged to, in the timeline's units; seeks when let go. */
  declare _drag?: number;
  private _player?: shakaLib.Player;
  private _playId = 0;
  private _ticker?: number;
  private _idleTimer?: number;
  private _pointer = "mouse"; // of the last press on the video
  private _settings?: Promise<UserSettings>;
  /** The subscription holding this player's parallel-stream slot; resolves to its unsubscribe. */
  private _lease?: Promise<() => Promise<void>>;
  /** On-demand channels: the clock time (ms) at the stream's position 0. Their stream isn't live
   * but an on-demand asset of several hours, beginning with the program that ran when it was
   * asked for; with this time the player treats it as live. */
  private _assetStart?: number;

  constructor() {
    super();
    this.audioLanguage = null;
    this.live = false;
    this.liveButton = false;
    this.zap = false;
    this.heading = "";
    this.subheading = "";
    this._playing = false;
    this._muted = false;
    this._volume = 1;
    this._audio = [];
    this._text = [];
    this._tick = 0;
    this._idle = false;
    this._autoMuted = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._ticker = window.setInterval(() => this._tick++, 1000); // moves the timeline
    document.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this._ticker);
    window.clearTimeout(this._idleTimer);
    document.removeEventListener("keydown", this._onKey);
    this._playId++;
    this._player?.destroy();
    this._player = undefined;
    this._release();
  }

  /** Gives the parallel-stream slot back. */
  private _release() {
    const lease = this._lease;
    this._lease = undefined;
    return lease?.then((unsubscribe) => unsubscribe()).catch(() => undefined);
  }

  protected firstUpdated() {
    try {
      const saved = Number(localStorage.getItem(VOLUME_KEY));
      if (canSetVolume && saved > 0 && saved <= 1) this._video.volume = saved;
    } catch {
      // storage blocked: full volume
    }
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("source") && this.source) this._play();
  }

  private _volumeChanged(video: HTMLVideoElement) {
    this._muted = video.muted;
    this._volume = video.volume;
    try {
      if (video.volume > 0) localStorage.setItem(VOLUME_KEY, String(video.volume));
    } catch {
      // only a convenience
    }
  }

  private get _video() {
    return this.renderRoot.querySelector("video")!;
  }

  /** retry counts the attempts after the integration reloaded. */
  private async _play(retry = 0) {
    const playId = ++this._playId;
    this._error = this._blocked = undefined;
    this._audio = this._text = [];
    const old = this._player;
    this._player = undefined;
    this._assetStart = undefined;
    await old?.destroy();
    // the slot first, so a channel switch never needs a second one
    await this._release();

    const source = this.source!;
    const system = source.drm === "none" ? null : await drmSystem();
    if (source.drm === "required" && !system) {
      this._badge = undefined;
      this._blocked = window.isSecureContext
        ? { title: t(this.hass, "drm_unsupported_title", { name: source.name }), text: t(this.hass, "drm_unsupported_text") }
        : { title: t(this.hass, "drm_https_title", { name: source.name }), text: t(this.hass, "drm_https_text") };
      return;
    }
    const protocol = system === "widevine" ? "dash" : "hls";
    this._badge = !system ? "HLS" : system === "widevine" ? "DASH · Widevine" : "HLS · FairPlay";

    try {
      const shaka = await loadShaka();
      licenseHass = this.hass;
      this._settings ??= fetchUserSettings(this.hass).catch(() => ({}));
      const settings = await this._settings;
      if (playId !== this._playId) return;
      let first!: (url: string) => void;
      const firstUrl = new Promise<string>((resolve) => (first = resolve));
      let started = false;
      this._lease = subscribeStream(
        this.hass,
        source.stream,
        protocol,
        (url, start) => {
          if (playId !== this._playId) return;
          this._assetStart = start ? new Date(start).getTime() : undefined;
          if (!started) {
            started = true;
            first(url);
          } else {
            // renewed after a reconnect: the new URL replaces the old one on its device
            this._player?.load(url, this._liveOffset()).then(() => this._start(), (err) => this._fail(err));
          }
        },
        () => {
          if (playId === this._playId) window.setTimeout(() => playId === this._playId && this._play(1), RETRY_MS);
        },
      );
      await this._lease;
      const url = await firstUrl;
      const certificate = system === "fairplay" ? fromBase64((await fetchFairplayCertificate(this.hass)).certificate) : undefined;
      if (playId !== this._playId) return;

      const player = new shaka.Player();
      this._player = player;
      await player.attach(this._video);
      player.configure({
        drm: {
          servers: {
            "com.widevine.alpha": `${LICENSE_SCHEME}:widevine`,
            "com.apple.fps": `${LICENSE_SCHEME}:fairplay`,
          },
          ...(certificate ? { advanced: { "com.apple.fps": { serverCertificate: certificate } } } : {}),
        },
      });
      player.addEventListener("error", (e) => this._fail((e as unknown as { detail: unknown }).detail));
      const tracks = () => {
        this._audio = player.getAudioTracks();
        this._text = player.getTextTracks();
      };
      for (const event of ["trackschanged", "variantchanged", "textchanged", "adaptation"]) player.addEventListener(event, tracks);
      // time-shift: waipu.tv's stream reaches back to the program's start, but a live stream opens at
      // its live edge; 0 makes Shaka start at the earliest point it can play, the program's start.
      // An on-demand channel's asset begins with the running program too, and opens at what's on now.
      await player.load(url, source.fromStart ? 0 : this._liveOffset());
      await this._start();
      pickAudio(player, settings.audio_language ?? this.audioLanguage);
      tracks();
    } catch (err) {
      if (playId !== this._playId) return;
      // the integration is still loading again
      if (retry && retry < RETRIES) window.setTimeout(() => playId === this._playId && this._play(retry + 1), RETRY_MS);
      else this._fail(err);
    }
  }

  private _fail(err: unknown) {
    const e = err as { code?: number; message?: string; data?: unknown[] };
    // Shaka errors carry a code and, for license failures, Home Assistant's message in their data
    const detail = e?.data?.find((d) => typeof d === "string" && !d.startsWith(LICENSE_SCHEME));
    const message = [e?.code ? `#${e.code}` : "", (detail as string) ?? e?.message ?? String(err)].filter(Boolean).join(" ");
    this._error = t(this.hass, "playback_error", { message });
  }

  /** Starts playback; a browser that blocks sound without a tap or click first gets it muted, which
   * every browser allows, and the Unmute button. */
  private async _start() {
    const video = this._video;
    try {
      await video.play();
    } catch (err) {
      if ((err as DOMException).name !== "NotAllowedError") return; // e.g. replaced by the next load
      video.muted = true;
      this._autoMuted = true;
      await video.play().catch(() => undefined);
    }
  }

  // --- controls -------------------------------------------------------------------------------

  /** Shows the bar over the video, and fades it out again after a while if the video plays. */
  private _wake() {
    this._idle = false;
    window.clearTimeout(this._idleTimer);
    if (this._playing) this._idleTimer = window.setTimeout(() => this._fade(), IDLE_MS);
  }

  /** Fades the bars out, unless the mouse rests on one of them or the audio menu is open. */
  private _fade() {
    if (this.renderRoot.querySelector(".top:hover, .bottom:hover, select:focus")) this._wake();
    else this._idle = true;
  }

  /** The mouse left the video: fade out right away while playing. */
  private _leave() {
    window.clearTimeout(this._idleTimer);
    if (this._playing && !document.fullscreenElement) this._idle = true;
  }

  /** A tap on a touch screen only brings the bar back; a click or a tap with the bar showing
   * plays or pauses. */
  private _videoClick() {
    if (this._pointer === "touch" && this._idle) {
      this._wake();
      return;
    }
    this._togglePlay();
    this._wake();
  }

  private _unmute() {
    this._video.muted = false;
    this._autoMuted = false;
  }

  private _togglePlay() {
    const video = this._video;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }

  private _zap(step: number) {
    this.dispatchEvent(new CustomEvent("waipu-zap", { detail: { step } }));
  }

  /** On-demand channels: the position in their asset of what's on now; else undefined (a live
   * stream's live edge, or a stream's start). */
  private _liveOffset() {
    return this._assetStart === undefined ? undefined : Math.max(0, (Date.now() - this._assetStart) / 1000);
  }

  /** Back to live; time-shift is a stream of its own, so its page switches (waipu-go-live). */
  private _goLive() {
    const line = this._timeline();
    if (this.source?.fromStart) this.dispatchEvent(new CustomEvent("waipu-go-live"));
    else if (line?.live !== undefined) line.seek(line.live);
    else this._player?.goToLive();
  }

  private _fullscreen() {
    const box = this.renderRoot.querySelector<HTMLElement>(".player")!;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen();
    else (this._video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
  }

  private _pip() {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else this._video.requestPictureInPicture().catch(() => undefined);
  }

  private _toggleText() {
    const active = this._text.find((x) => x.active);
    this._player?.selectTextTrack(active ? null : this._text[0]);
    this._text = this._player?.getTextTracks() ?? [];
  }

  /** A track picked in the audio menu; its language becomes the user's preference. */
  private async _chooseAudio(track: shakaLib.extern.AudioTrack) {
    this._player?.selectAudioTrack(track);
    const settings = { ...(await this._settings), audio_language: track.language };
    this._settings = Promise.resolve(settings);
    saveUserSettings(this.hass, settings).catch(() => undefined);
  }

  private _onKey = (e: KeyboardEvent) => {
    const path = e.composedPath();
    if (path.some((el) => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLDialogElement)) return;
    if (e.key === " " && !path.some((el) => el instanceof HTMLButtonElement)) {
      e.preventDefault();
      this._togglePlay();
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && this.zap) {
      e.preventDefault();
      this._zap(e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      this._jump(e.key === "ArrowLeft" ? -JUMP_S : JUMP_S);
    }
  };

  /** Back or ahead within what can be played; ahead to the live edge is live again. */
  private _jump(seconds: number) {
    const line = this._timeline();
    if (!line) return;
    const step = line.live !== undefined ? seconds * 1000 : seconds;
    line.seek(Math.max(line.avail[0], Math.min(line.avail[1], line.pos + step)));
    this._wake();
  }

  /** Live: the running program, with what time-shift can reach; otherwise the stream's length. */
  private _timeline(): Timeline | undefined {
    const player = this._player;
    const video = this.renderRoot.querySelector("video");
    if (!player || !video || this._blocked) return undefined;
    const range = player.seekRange();
    const asset = this._assetStart;
    // an on-demand channel without a start time plays as what it is, a stream with a length
    if (!this.live || (asset === undefined && !player.isLive())) {
      const end = Number.isFinite(video.duration) ? video.duration : range.end;
      if (!end) return undefined;
      return {
        start: 0,
        end,
        avail: [range.start, range.end],
        pos: video.currentTime,
        seek: (s) => (video.currentTime = s),
      };
    }
    // wall-clock times: on-demand channels from their asset's start, which goes on past now but
    // only plays what has aired; live streams from the playhead as a date where the stream says
    // so, else live = now
    const playhead =
      asset !== undefined
        ? asset + video.currentTime * 1000
        : (player.getPlayheadTimeAsDate()?.getTime() ?? Date.now() - (range.end - video.currentTime) * 1000);
    const toWall = (s: number) => playhead + (s - video.currentTime) * 1000;
    const avail: [number, number] = [toWall(range.start), toWall(range.end)];
    if (asset !== undefined) avail[1] = Math.min(avail[1], Date.now());
    const program = this.program;
    let [start, end] = program ? [new Date(program.start).getTime(), new Date(program.stop).getTime()] : avail;
    // an asset reaches back past the running program when it began with an earlier one
    if (program && asset !== undefined) start = Math.min(start, avail[0]);
    if (end <= start) return undefined;
    const time = formatter(this.hass, { hour: "2-digit", minute: "2-digit" });
    return {
      start,
      end,
      avail,
      pos: playhead,
      live: avail[1],
      label: [time.format(start), time.format(end)],
      seek: (wall) => {
        const at = (w: number) => (video.currentTime = range.start + (Math.max(w, avail[0]) - avail[0]) / 1000);
        if (wall < avail[1] - BEHIND_LIVE / 3) at(wall);
        else if (asset !== undefined) at(avail[1]);
        else player.goToLive();
      },
    };
  }

  /** The timeline position under the pointer, within what can be played. */
  private _scrubValue(e: PointerEvent, line: Timeline) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const value = line.start + ((e.clientX - box.left) / box.width) * (line.end - line.start);
    return Math.max(line.avail[0], Math.min(line.avail[1], value));
  }

  // a press on the timeline starts dragging the play position; it only seeks when let go, so a
  // click still jumps there and a drag doesn't load every position on the way
  private _dragStart(e: PointerEvent, line: Timeline) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this._drag = this._scrubValue(e, line);
    this._wake();
  }

  private _dragMove(e: PointerEvent, line: Timeline) {
    if (this._drag === undefined) return;
    this._drag = this._scrubValue(e, line);
    this._wake();
  }

  private _dragEnd() {
    const value = this._drag;
    this._drag = undefined;
    if (value !== undefined) this._timeline()?.seek(value);
  }

  // --- rendering ------------------------------------------------------------------------------

  protected render() {
    void this._tick;
    const line = this._timeline();
    const pct = (v: number) => (line ? `${Math.max(0, Math.min(100, ((v - line.start) / (line.end - line.start)) * 100))}%` : "0");
    const behind = line?.live !== undefined ? line.live - line.pos : 0;
    // while dragging, the knob shows where playback would go, with its time
    const pos = this._drag ?? line?.pos ?? 0;
    const seconds = formatter(this.hass, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dragLabel = line?.live !== undefined ? seconds.format(pos) : clock(pos);
    const fromStart = !!this.source?.fromStart;
    const activeText = this._text.find((x) => x.active);

    return html`<div class="player">
        <div
          class=${this._idle ? "video idle" : "video"}
          @pointermove=${(e: PointerEvent) => e.pointerType === "mouse" && this._wake()}
          @pointerdown=${(e: PointerEvent) => (this._pointer = e.pointerType)}
          @pointerleave=${(e: PointerEvent) => e.pointerType === "mouse" && this._leave()}
        >
          <video
            autoplay
            playsinline
            @click=${this._videoClick}
            @play=${() => {
              this._playing = true;
              this._wake();
            }}
            @pause=${() => {
              this._playing = false;
              this._wake();
            }}
            @volumechange=${(e: Event) => this._volumeChanged(e.target as HTMLVideoElement)}
            @ended=${() => this._assetStart !== undefined && this._play()}
          ></video>
          <div class="top">
            ${this.logo ? html`<img class="logo" src=${this.logo} alt="" />` : nothing}
            <div class="meta">
              <div>${this.heading}</div>
              <div>${this.subheading}</div>
            </div>
            <slot name="top"></slot>
            ${this._badge ? html`<span class="badge">${this._badge}</span>` : nothing}
            ${document.pictureInPictureEnabled
              ? html`<button class="icon-btn pip" title=${t(this.hass, "pip")} aria-label=${t(this.hass, "pip")} @click=${this._pip}>
                  ${pipIcon()}
                </button>`
              : nothing}
            <button class="icon-btn" title=${t(this.hass, "fullscreen")} aria-label=${t(this.hass, "fullscreen")} @click=${this._fullscreen}>
              ${fullscreenIcon()}
            </button>
          </div>
          <div class="bottom">
            ${line
              ? html`<div
                    class="scrub"
                    role="slider"
                    aria-label=${t(this.hass, "position")}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow=${Math.round(parseFloat(pct(pos)))}
                    @pointerdown=${(e: PointerEvent) => this._dragStart(e, line)}
                    @pointermove=${(e: PointerEvent) => this._dragMove(e, line)}
                    @pointerup=${this._dragEnd}
                    @pointercancel=${() => (this._drag = undefined)}
                  >
                    <div class="track"></div>
                    <div class="avail" style="left:${pct(line.avail[0])};width:calc(${pct(line.avail[1])} - ${pct(line.avail[0])})"></div>
                    <div class="played" style="width:${pct(pos)}"></div>
                    ${line.live !== undefined ? html`<div class="edge" style="left:${pct(line.live)}"></div>` : nothing}
                    <div class=${this._drag !== undefined ? "knob dragging" : "knob"} style="left:${pct(pos)}"></div>
                    ${this._drag !== undefined ? html`<div class="drag-time" style="left:${pct(pos)}">${dragLabel}</div>` : nothing}
                  </div>
                  ${line.label
                    ? html`<div class="scrub-times"><span>${line.label[0]}</span><span>${line.label[1]}</span></div>`
                    : nothing}`
              : nothing}
            <div class="controls">
              <button
                class="icon-btn"
                title=${t(this.hass, this._playing ? "pause" : "play")}
                aria-label=${t(this.hass, this._playing ? "pause" : "play")}
                @click=${this._togglePlay}
              >
                ${this._playing ? pauseIcon() : playIcon()}
              </button>
              ${this.zap
                ? html`<button class="icon-btn" title=${t(this.hass, "prev_channel")} aria-label=${t(this.hass, "prev_channel")} @click=${() => this._zap(-1)}>
                      ${upIcon()}
                    </button>
                    <button class="icon-btn" title=${t(this.hass, "next_channel")} aria-label=${t(this.hass, "next_channel")} @click=${() => this._zap(1)}>
                      ${downIcon()}
                    </button>`
                : nothing}
              <slot name="controls"></slot>
              ${line?.live !== undefined && (this.liveButton || behind > BEHIND_LIVE || fromStart)
                ? html`<button class="pill live" aria-pressed=${!fromStart && behind <= BEHIND_LIVE} @click=${this._goLive}>
                    ${t(this.hass, "live")}
                  </button>`
                : nothing}
              <span class="time">
                ${line && line.live === undefined
                  ? `${clock(line.pos)} / ${clock(line.end)}`
                  : behind > BEHIND_LIVE
                    ? t(this.hass, "behind_live", { minutes: Math.max(1, Math.round(behind / 60_000)) })
                    : nothing}
              </span>
              <span class="grow"></span>
              ${this._audio.length > 1
                ? html`<select
                    aria-label=${t(this.hass, "audio_track")}
                    @change=${(e: Event) => {
                      const track = this._audio[Number((e.target as HTMLSelectElement).value)];
                      if (track) this._chooseAudio(track);
                    }}
                  >
                    ${this._audio.map((a, i) => html`<option value=${i} ?selected=${a.active}>${audioLabel(a)}</option>`)}
                  </select>`
                : nothing}
              ${this._text.length
                ? html`<button
                    class="icon-btn"
                    aria-pressed=${!!activeText}
                    title=${t(this.hass, "subtitles")}
                    aria-label=${t(this.hass, "subtitles")}
                    @click=${this._toggleText}
                  >
                    ${subtitlesIcon()}
                  </button>`
                : nothing}
              <div class="volume">
                ${canSetVolume
                  ? html`<div class="volume-pop">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        aria-label=${t(this.hass, "volume")}
                        .value=${String(this._muted ? 0 : this._volume)}
                        @input=${(e: Event) => {
                          const level = Number((e.target as HTMLInputElement).value);
                          this._video.volume = level;
                          this._video.muted = level === 0;
                        }}
                      />
                    </div>`
                  : nothing}
                <button
                  class="icon-btn"
                  title=${t(this.hass, this._muted ? "unmute" : "mute")}
                  aria-label=${t(this.hass, this._muted ? "unmute" : "mute")}
                  @click=${() => {
                    this._video.muted = !this._video.muted;
                    this._autoMuted = false;
                  }}
                >
                  ${this._muted || this._volume === 0 ? mutedIcon() : volumeIcon()}
                </button>
              </div>
            </div>
          </div>
          ${this._autoMuted
            ? html`<button class="pill unmute" @click=${this._unmute}>${mutedIcon()}${t(this.hass, "unmute")}</button>`
            : nothing}
          ${this._blocked
            ? html`<div class="msg">
                <div>
                  <h3>${this._blocked.title}</h3>
                  <p>${this._blocked.text}</p>
                  <slot name="blocked"></slot>
                </div>
              </div>`
            : nothing}
        </div>
      </div>
      ${this._error ? html`<div class="card error">${this._error}</div>` : nothing}`;
  }

  static styles = [
    shared,
    videoButtons,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }
      .player {
        background: #000;
        color: #fff;
        /* taps, double clicks and drags on the video and controls don't select text */
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .player:fullscreen {
        border-radius: 0;
      }
      .video {
        position: relative;
        aspect-ratio: 16 / 9;
        background: #000;
      }
      .player:fullscreen .video {
        flex: 1;
        aspect-ratio: auto;
        min-height: 0;
      }
      video {
        width: 100%;
        height: 100%;
        display: block;
        cursor: pointer;
      }
      .top {
        position: absolute;
        inset: 0 0 auto 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 8px 28px 12px;
        background: linear-gradient(rgba(0, 0, 0, 0.7), transparent);
        transition: opacity 0.3s;
      }
      /* the timeline and buttons over the bottom of the picture */
      .bottom {
        position: absolute;
        inset: auto 0 0 0;
        padding-top: 32px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
        transition: opacity 0.3s;
      }
      /* playing and left alone: both bars fade out, and with them the mouse pointer */
      .video.idle .top,
      .video.idle .bottom {
        opacity: 0;
        pointer-events: none;
      }
      .video.idle video {
        cursor: none;
      }
      .top .meta {
        flex: 1;
        min-width: 0;
      }
      .top .meta div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .top .meta div:first-child {
        font-weight: 500;
      }
      .top .meta div:last-child {
        font-size: 12.5px;
        opacity: 0.8;
      }
      .top .logo {
        width: 36px;
        height: 36px;
      }
      .badge {
        height: 24px;
        padding: 0 8px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.16);
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
      }
      .pill.unmute {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.6);
      }
      .msg {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(10, 12, 16, 0.94);
      }
      .msg > div {
        max-width: 460px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }
      .msg h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
      .msg p {
        margin: 0;
        opacity: 0.85;
      }
      .scrub {
        position: relative;
        height: 22px;
        margin: 4px 12px 0;
        cursor: pointer;
        touch-action: none; /* dragging on touch screens moves the position, not the page */
      }
      .scrub > div {
        position: absolute;
        top: 9px;
        height: 4px;
        border-radius: 2px;
      }
      .scrub .track {
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.22);
      }
      .scrub .avail {
        background: rgba(255, 255, 255, 0.45);
      }
      .scrub .played {
        left: 0;
        background: #4fc3f7;
      }
      .scrub .knob {
        top: 4px;
        width: 14px;
        height: 14px;
        margin-left: -7px;
        border-radius: 50%;
        background: #fff;
      }
      .scrub .knob.dragging {
        top: 2px;
        width: 18px;
        height: 18px;
        margin-left: -9px;
      }
      /* the time the play position is dragged to, over the knob */
      .scrub .drag-time {
        top: auto;
        bottom: 24px;
        height: auto;
        transform: translateX(-50%);
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.85);
        font-size: 12.5px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        pointer-events: none;
      }
      .scrub .edge {
        top: 5px;
        width: 2px;
        height: 12px;
        margin-left: -1px;
        background: var(--wt-rec);
      }
      .scrub-times {
        display: flex;
        justify-content: space-between;
        padding: 0 12px;
        font-size: 11.5px;
        opacity: 0.7;
        font-variant-numeric: tabular-nums;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        flex-wrap: wrap;
      }
      .time {
        font-size: 12.5px;
        opacity: 0.85;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .grow {
        flex: 1;
      }
      /* vertical slider above the speaker, shown on hover or keyboard focus */
      .volume {
        position: relative;
        display: inline-flex;
      }
      .volume-pop {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 128px;
        border-radius: 20px;
        background: rgba(20, 20, 20, 0.92);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 3;
      }
      .volume:hover .volume-pop,
      .volume:focus-within .volume-pop {
        display: flex;
      }
      .volume-pop input {
        width: 104px;
        margin: 0;
        transform: rotate(-90deg);
        accent-color: #4fc3f7;
        cursor: pointer;
      }
      select {
        height: 32px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: #111;
        color: #fff;
        padding: 0 10px;
        font: inherit;
        font-size: 13px;
        max-width: 220px;
      }
      .error {
        padding: 12px 16px;
        color: var(--wt-rec);
      }
      @media (max-width: 640px) {
        .top .badge,
        .top .pip {
          display: none;
        }
        select {
          max-width: 130px;
        }
        .player {
          border-radius: 0;
        }
      }
    `,
  ];
}

customElements.define("waipu-player", WaipuPlayer);

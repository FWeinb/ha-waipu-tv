// The Watch tab: the player with its own controls, a sidebar of favorites, all channels, on-demand
// channels or finished recordings, and the favorite stars (favorites have no tab of their own).
// Shaka Player is loaded on first use; DRM licenses go through Home Assistant's websocket, so its
// login covers them. Chrome, Edge, Firefox and Android get DASH + Widevine, Safari and iOS HLS +
// FairPlay; channels without DRM play as HLS everywhere, also over plain HTTP.

import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import type shakaLib from "shaka-player/dist/shaka-player.compiled-es2021.js";

import {
  deleteRecordings,
  fetchFairplayCertificate,
  fetchGuide,
  fetchLicense,
  fetchProgram,
  fetchUserSettings,
  record,
  saveUserSettings,
  setFavorite,
  subscribeStream,
  type Channel,
  type DrmSystem,
  type HomeAssistant,
  type Program,
  type Recording,
  type StreamTarget,
  type UserSettings,
} from "./api";
import { formatNumber, formatter, t, type DateFormatter } from "./i18n";
import {
  backIcon,
  clockIcon,
  downIcon,
  fullscreenIcon,
  lockIcon,
  mutedIcon,
  pauseIcon,
  pipIcon,
  playIcon,
  recIcon,
  restartIcon,
  searchIcon,
  starIcon,
  subtitlesIcon,
  trashIcon,
  upIcon,
  volumeIcon,
} from "./icons";
import { shared } from "./styles";
import { attempt, changed, toast, watch, type WatchTarget } from "./util";
import "./program-dialog";

type Shaka = typeof shakaLib;
type List = "fav" | "all" | "vod" | "rec";

const LICENSE_SCHEME = "waipu-license";
const BEHIND_LIVE = 30_000; // further behind than this, the Live button shows
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
  label: [string, string];
  seek: (value: number) => void;
}

class WaipuPlayer extends LitElement {
  static properties = {
    hass: { attribute: false },
    channels: { attribute: false },
    recordings: { attribute: false },
    instantRestart: { type: Boolean },
    audioLanguage: { attribute: false },
    target: { attribute: false },
    _blocked: { state: true },
    _error: { state: true },
    _badge: { state: true },
    _now: { state: true },
    _description: { state: true },
    _list: { state: true },
    _search: { state: true },
    _playing: { state: true },
    _muted: { state: true },
    _volume: { state: true },
    _audio: { state: true },
    _text: { state: true },
    _tick: { state: true },
    _dialog: { state: true },
    _busy: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare recordings: Recording[];
  declare instantRestart: boolean;
  /** The integration's default; a language picked in the audio menu overrides it for the user. */
  declare audioLanguage: string | null;
  declare target: WatchTarget;
  declare _blocked?: { title: string; text: string };
  declare _error?: string;
  declare _badge?: string;
  declare _now: Record<string, Program>;
  declare _description?: string;
  declare _list: List;
  declare _search: string;
  declare _playing: boolean;
  declare _muted: boolean;
  declare _volume: number;
  declare _audio: shakaLib.extern.AudioTrack[];
  declare _text: shakaLib.extern.TextTrack[];
  declare _tick: number;
  declare _dialog?: Program;
  declare _busy: boolean;
  private _player?: shakaLib.Player;
  private _playId = 0;
  private _timers: number[] = [];
  private _describedId?: string;
  private _settings?: Promise<UserSettings>;
  /** The subscription holding this player's parallel-stream slot; resolves to its unsubscribe. */
  private _lease?: Promise<() => Promise<void>>;

  constructor() {
    super();
    this._now = {};
    this._list = "fav";
    this._search = "";
    this._playing = false;
    this._muted = false;
    this._volume = 1;
    this._audio = [];
    this._text = [];
    this._tick = 0;
    this._busy = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._timers = [
      window.setInterval(() => this._loadGuide(), 60_000),
      window.setInterval(() => this._tick++, 1000), // moves the timeline
    ];
    document.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._timers.forEach((id) => window.clearInterval(id));
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

  private _volumeChanged(video: HTMLVideoElement) {
    this._muted = video.muted;
    this._volume = video.volume;
    try {
      if (video.volume > 0) localStorage.setItem(VOLUME_KEY, String(video.volume));
    } catch {
      // only a convenience
    }
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("target")) {
      if ("recording" in this.target) this._list = "rec";
      this._play();
      this._loadGuide();
    }
  }

  private get _video() {
    return this.renderRoot.querySelector("video")!;
  }

  private get _channel(): Channel | undefined {
    const id = "channel" in this.target ? this.target.channel : this.target.recording.channel_id;
    return this.channels.find((c) => c.id === id);
  }

  /** The channels of the sidebar list shown; channel up/down moves through them. */
  private _listChannels(): Channel[] {
    const visible = this.channels.filter((c) => c.visible);
    if (this._list === "fav" || this._list === "rec") return this.channels.filter((c) => c.favorite);
    const list = this._list === "vod" ? visible.filter((c) => c.vod) : visible;
    const q = this._search.trim().toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }

  private async _loadGuide() {
    // what's on for the channels the sidebar can show, plus the current one
    const ids = new Set(this.channels.filter((c) => c.visible || c.favorite).map((c) => c.id));
    if (this._channel) ids.add(this._channel.id);
    const now = new Date();
    try {
      const guide = await fetchGuide(this.hass, now, new Date(now.getTime() + 60_000), [...ids]);
      const running: Record<string, Program> = {};
      for (const [id, programs] of Object.entries(guide.programs)) {
        const p = programs.find((x) => new Date(x.start) <= now && now < new Date(x.stop));
        if (p) running[id] = p;
      }
      this._now = running;
    } catch {
      // the guide is extra information; playback works without it
    }
    const programId = "recording" in this.target ? this.target.recording.program_id : this._now[this._channel?.id ?? ""]?.id;
    if (programId && programId !== this._describedId) {
      this._describedId = programId;
      this._description = undefined;
      fetchProgram(this.hass, programId)
        .then((d) => (this._description = d.textContent?.descLong || d.textContent?.descShort || ""))
        .catch(() => (this._description = ""));
    }
  }

  /** retry counts the attempts after the integration reloaded. */
  private async _play(retry = 0) {
    const playId = ++this._playId;
    this._error = this._blocked = undefined;
    this._audio = this._text = [];
    const old = this._player;
    this._player = undefined;
    await old?.destroy();
    // the slot first, so a channel switch never needs a second one
    await this._release();

    const target = this.target;
    const channel = this._channel;
    const name = channel?.name ?? "";
    // recordings are always protected; channels on pvr.waipu's HLS list are not
    const needsDrm = "recording" in target || !channel?.hls;
    const system = needsDrm ? await drmSystem() : null;
    if (needsDrm && !system) {
      this._badge = undefined;
      this._blocked = window.isSecureContext
        ? { title: t(this.hass, "drm_unsupported_title", { name }), text: t(this.hass, "drm_unsupported_text") }
        : { title: t(this.hass, "drm_https_title", { name }), text: t(this.hass, "drm_https_text") };
      return;
    }
    const protocol = system === "widevine" ? "dash" : "hls";
    this._badge = !needsDrm ? "HLS" : system === "widevine" ? "DASH · Widevine" : "HLS · FairPlay";

    try {
      const shaka = await loadShaka();
      licenseHass = this.hass;
      this._settings ??= fetchUserSettings(this.hass).catch(() => ({}));
      const settings = await this._settings;
      const request: StreamTarget =
        "recording" in target ? { recording_id: target.recording.id } : { channel: target.channel, from_start: !!target.fromStart };
      if (playId !== this._playId) return;
      let first!: (url: string) => void;
      const firstUrl = new Promise<string>((resolve) => (first = resolve));
      let started = false;
      this._lease = subscribeStream(
        this.hass,
        request,
        protocol,
        (url) => {
          if (!started) {
            started = true;
            first(url);
          } else if (playId === this._playId) {
            // renewed after a reconnect: the new URL replaces the old one on its device
            this._player?.load(url).catch((err) => this._fail(err));
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
      await player.load(url);
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

  // --- controls -------------------------------------------------------------------------------

  private _togglePlay() {
    const video = this._video;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }

  private _zap(step: number) {
    const list = this._listChannels();
    const i = list.findIndex((c) => c.id === this._channel?.id);
    const next = list[(i + step + list.length) % list.length];
    if (next) watch(this, { channel: next.id });
  }

  private _goLive() {
    if ("channel" in this.target && this.target.fromStart) watch(this, { channel: this.target.channel });
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
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && "channel" in this.target) {
      e.preventDefault();
      this._zap(e.key === "ArrowUp" ? -1 : 1);
    }
  };

  private async _toggleFavorite(c: Channel) {
    this._busy = true;
    const ok = await attempt(this, this.hass, () => setFavorite(this.hass, c.id, !c.favorite));
    this._busy = false;
    if (ok) {
      changed(this, "channels");
      toast(this, t(this.hass, c.favorite ? "favorite_removed" : "favorite_added", { name: c.name }));
    }
  }

  private async _record(p: Program) {
    this._busy = true;
    const ok = await attempt(this, this.hass, () => record(this.hass, p.id));
    this._busy = false;
    if (ok) {
      changed(this, "recordings");
      toast(this, t(this.hass, "recording_started", { title: p.title }));
    }
  }

  private async _deleteRecording(r: Recording) {
    if (!confirm(t(this.hass, "confirm_delete", { count: 1 }))) return;
    this._busy = true;
    const ok = await attempt(this, this.hass, () => deleteRecordings(this.hass, [r.id]));
    this._busy = false;
    if (ok) {
      changed(this, "recordings");
      toast(this, t(this.hass, "deleted", { count: 1 }));
      watch(this, null);
    }
  }

  /** Live: the running program, with what time-shift can reach; recordings: their length. */
  private _timeline(program?: Program): Timeline | undefined {
    const player = this._player;
    const video = this.renderRoot.querySelector("video");
    if (!player || !video || this._blocked) return undefined;
    const range = player.seekRange();
    if ("recording" in this.target) {
      const end = Number.isFinite(video.duration) ? video.duration : range.end;
      if (!end) return undefined;
      return {
        start: 0,
        end,
        avail: [range.start, range.end],
        pos: video.currentTime,
        label: ["0:00", clock(end)],
        seek: (s) => (video.currentTime = s),
      };
    }
    // wall-clock times: the playhead as a date where the stream says so, else live = now
    const playhead = player.getPlayheadTimeAsDate()?.getTime() ?? Date.now() - (range.end - video.currentTime) * 1000;
    const toWall = (s: number) => playhead + (s - video.currentTime) * 1000;
    const avail: [number, number] = [toWall(range.start), toWall(range.end)];
    const [start, end] = program ? [new Date(program.start).getTime(), new Date(program.stop).getTime()] : avail;
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
        if (wall >= avail[1] - BEHIND_LIVE / 3) player.goToLive();
        else video.currentTime = range.start + (Math.max(wall, avail[0]) - avail[0]) / 1000;
      },
    };
  }

  private _scrub(e: MouseEvent, line: Timeline) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    line.seek(line.start + ((e.clientX - box.left) / box.width) * (line.end - line.start));
  }

  // --- rendering ------------------------------------------------------------------------------

  protected render() {
    void this._tick;
    const target = this.target;
    const channel = this._channel;
    const recording = "recording" in target ? target.recording : undefined;
    const program = recording ? undefined : this._now[channel?.id ?? ""];
    const time = formatter(this.hass, { hour: "2-digit", minute: "2-digit" });
    const date = formatter(this.hass, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const span = (p: Program) => `${time.format(new Date(p.start))}–${time.format(new Date(p.stop))}`;
    const fromStart = "channel" in target && !!target.fromStart;
    const line = this._timeline(program);
    const pct = (v: number) => (line ? `${Math.max(0, Math.min(100, ((v - line.start) / (line.end - line.start)) * 100))}%` : "0");
    const behind = line?.live !== undefined ? line.live - line.pos : 0;
    const firstClear = this.channels.find((c) => c.favorite && c.hls && c.id !== channel?.id);
    const activeText = this._text.find((x) => x.active);

    return html`<div class="content">
      <div class="layout">
        <div class="main">
          <div class="player">
            <div class="video">
              <video
                autoplay
                playsinline
                @click=${this._togglePlay}
                @play=${() => (this._playing = true)}
                @pause=${() => (this._playing = false)}
                @volumechange=${(e: Event) => this._volumeChanged(e.target as HTMLVideoElement)}
              ></video>
              <div class="top">
                <button class="icon-btn" title=${t(this.hass, "back")} aria-label=${t(this.hass, "back")} @click=${() => watch(this, null)}>
                  ${backIcon()}
                </button>
                ${channel ? html`<img class="logo" src=${channel.logo} alt="" />` : nothing}
                <div class="meta">
                  <div>${channel ? `${channel.number} · ${channel.name}` : recording?.channel_id}</div>
                  <div>
                    ${recording
                      ? t(this.hass, "recording_from", { date: recording.start ? date.format(new Date(recording.start)) : "" })
                      : program
                        ? `${span(program)} · ${program.title}`
                        : t(this.hass, "no_guide")}
                  </div>
                </div>
                ${channel ? this._star(channel, true) : nothing}
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
              ${this._blocked
                ? html`<div class="msg">
                    <div>
                      <h3>${this._blocked.title}</h3>
                      <p>${this._blocked.text}</p>
                      ${firstClear
                        ? html`<button class="btn primary" @click=${() => watch(this, { channel: firstClear.id })}>
                            ${t(this.hass, "watch_name", { name: firstClear.name })}
                          </button>`
                        : nothing}
                    </div>
                  </div>`
                : nothing}
            </div>
            ${line
              ? html`<div
                    class="scrub"
                    role="slider"
                    aria-label=${t(this.hass, "position")}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow=${Math.round(parseFloat(pct(line.pos)))}
                    @click=${(e: MouseEvent) => this._scrub(e, line)}
                  >
                    <div class="track"></div>
                    <div class="avail" style="left:${pct(line.avail[0])};width:calc(${pct(line.avail[1])} - ${pct(line.avail[0])})"></div>
                    <div class="played" style="width:${pct(line.pos)}"></div>
                    ${line.live !== undefined ? html`<div class="edge" style="left:${pct(line.live)}"></div>` : nothing}
                    <div class="knob" style="left:${pct(line.pos)}"></div>
                  </div>
                  <div class="scrub-times"><span>${line.label[0]}</span><span>${line.label[1]}</span></div>`
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
              ${recording
                ? nothing
                : html`<button class="icon-btn" title=${t(this.hass, "prev_channel")} aria-label=${t(this.hass, "prev_channel")} @click=${() => this._zap(-1)}>
                      ${upIcon()}
                    </button>
                    <button class="icon-btn" title=${t(this.hass, "next_channel")} aria-label=${t(this.hass, "next_channel")} @click=${() => this._zap(1)}>
                      ${downIcon()}
                    </button>`}
              ${channel?.vod && !recording
                ? html`<button
                    class="pill"
                    aria-pressed=${fromStart}
                    ?disabled=${!this.instantRestart}
                    @click=${() => watch(this, { channel: channel.id, fromStart: true })}
                  >
                    ${restartIcon()}${t(this.hass, "from_start")}
                  </button>`
                : nothing}
              ${!recording && (channel?.vod || behind > BEHIND_LIVE || fromStart)
                ? html`<button class="pill live" aria-pressed=${!fromStart && behind <= BEHIND_LIVE} @click=${this._goLive}>
                    ${t(this.hass, "live")}
                  </button>`
                : nothing}
              <span class="time">
                ${recording && line
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
                  @click=${() => (this._video.muted = !this._video.muted)}
                >
                  ${this._muted || this._volume === 0 ? mutedIcon() : volumeIcon()}
                </button>
              </div>
            </div>
          </div>
          ${this._error ? html`<div class="card error">${this._error}</div>` : nothing}
          ${this._renderInfo(channel, program, recording, span, date)}
        </div>
        ${this._renderSidebar(channel, recording, time, date)}
      </div>
      ${this._dialog
        ? html`<waipu-program-dialog
            .hass=${this.hass}
            .program=${this._dialog}
            .channel=${this.channels.find((c) => c.id === this._dialog!.channel_id)}
            .recording=${this.recordings.find((r) => r.program_id === this._dialog!.id && r.status !== "FINISHED")}
            @closed=${() => (this._dialog = undefined)}
          ></waipu-program-dialog>`
        : nothing}
    </div>`;
  }

  private _renderInfo(
    channel: Channel | undefined,
    program: Program | undefined,
    recording: Recording | undefined,
    span: (p: Program) => string,
    date: DateFormatter,
  ) {
    const scheduled = program && this.recordings.find((r) => r.program_id === program.id && r.status !== "FINISHED");
    return html`<div class="card info">
      <h2>${recording?.title ?? program?.title ?? channel?.name ?? ""}</h2>
      <div class="muted sub">
        ${recording
          ? [recording.episode_title, channel?.name, recording.start ? date.format(new Date(recording.start)) : ""].filter(Boolean).join(" · ")
          : program
            ? [span(program), program.genre, program.episode_title].filter(Boolean).join(" · ")
            : nothing}
      </div>
      ${this._description ? html`<p>${this._description}</p>` : nothing}
      <div class="toolbar">
        ${recording
          ? html`<button class="btn danger" ?disabled=${this._busy} @click=${() => this._deleteRecording(recording)}>
              ${trashIcon()}${t(this.hass, "delete_recording")}
            </button>`
          : program
            ? html`${scheduled
                  ? scheduled.status === "RECORDING"
                    ? html`<span class="chip rec">${recIcon()}${t(this.hass, "rec")}</span>`
                    : html`<span class="chip sched">${clockIcon(14)}${t(this.hass, "scheduled")}</span>`
                  : program.recordable
                    ? html`<button class="btn primary" ?disabled=${this._busy} @click=${() => this._record(program)}>
                        ${recIcon()}${t(this.hass, "record")}
                      </button>`
                    : nothing}
                <button class="btn" @click=${() => (this._dialog = program)}>${t(this.hass, "program_details")}</button>`
            : nothing}
      </div>
    </div>`;
  }

  private _renderSidebar(
    channel: Channel | undefined,
    recording: Recording | undefined,
    time: DateFormatter,
    date: DateFormatter,
  ) {
    const lists = [
      ["fav", "favorites"],
      ["all", "all"],
      ["vod", "list_vod"],
      ["rec", "recordings"],
    ] as const;
    const now = Date.now();
    let rows;
    if (this._list === "rec") {
      const finished = this.recordings
        .filter((r) => r.status === "FINISHED")
        .sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));
      rows = finished.length
        ? finished.map((r) => {
            const c = this.channels.find((x) => x.id === r.channel_id);
            return html`<li>
              <button class="zap-main" aria-current=${recording?.id === r.id} @click=${() => watch(this, { recording: r })}>
                ${r.image ? html`<img class="thumb" src=${r.image} alt="" loading="lazy" />` : html`<img class="logo" src=${c?.logo ?? ""} alt="" />`}
                <div class="meta">
                  <div>${r.title}</div>
                  <div>${r.episode_title ?? c?.name ?? ""}</div>
                  <div>${r.start ? date.format(new Date(r.start)) : ""} · ${formatNumber(this.hass, Math.round(r.duration / 60))} min</div>
                </div>
              </button>
            </li>`;
          })
        : [html`<li class="note">${t(this.hass, "no_recordings")}</li>`];
    } else {
      const list = this._listChannels();
      rows = list.map((c) => {
        const p = this._now[c.id];
        const done = p ? ((now - new Date(p.start).getTime()) / (new Date(p.stop).getTime() - new Date(p.start).getTime())) * 100 : 0;
        return html`<li>
          <button class="zap-main" aria-current=${!recording && c.id === channel?.id} @click=${() => watch(this, { channel: c.id })}>
            <img class="logo" src=${c.logo} alt="" loading="lazy" />
            <div class="meta">
              <div>${c.number} · ${c.name}</div>
              <div>${p ? `${time.format(new Date(p.start))} ${p.title}` : t(this.hass, c.vod ? "on_demand" : "no_guide")}</div>
              ${p ? html`<div class="progress"><div style="width:${done}%"></div></div>` : nothing}
            </div>
            ${!c.hls && !window.isSecureContext ? html`<span class="lock" title=${t(this.hass, "needs_https")}>${lockIcon()}</span>` : nothing}
          </button>
          ${this._star(c, false)}
        </li>`;
      });
      if (this._list === "fav") rows.push(html`<li class="note">${t(this.hass, list.length ? "favorites_note" : "no_favorites_watch")}</li>`);
      else if (!list.length) rows.push(html`<li class="note">${t(this.hass, "no_channels_match")}</li>`);
    }
    return html`<aside class="card">
      <div class="zap-head">
        <div class="seg" role="group">
          ${lists.map(
            ([list, label]) => html`<button aria-pressed=${this._list === list} @click=${() => (this._list = list)}>
              ${t(this.hass, label)}
            </button>`,
          )}
        </div>
        ${this._list === "all" || this._list === "vod"
          ? html`<label class="search">
              ${searchIcon()}
              <input
                type="search"
                placeholder=${t(this.hass, "filter_channels")}
                .value=${this._search}
                @input=${(e: Event) => (this._search = (e.target as HTMLInputElement).value)}
              />
            </label>`
          : nothing}
      </div>
      <ul class="zap">
        ${rows}
      </ul>
    </aside>`;
  }

  private _star(c: Channel, onVideo: boolean) {
    const label = t(this.hass, c.favorite ? "remove_favorite" : "add_favorite");
    return html`<button
      class="star-btn ${onVideo ? "on-video" : ""}"
      aria-pressed=${c.favorite}
      title=${label}
      aria-label="${label}: ${c.name}"
      ?disabled=${this._busy}
      @click=${() => this._toggleFavorite(c)}
    >
      ${starIcon()}
    </button>`;
  }

  static styles = [
    shared,
    css`
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 16px;
        align-items: start;
      }
      .main {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }
      .player {
        background: #000;
        color: #fff;
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
        padding: 8px 8px 28px 4px;
        background: linear-gradient(rgba(0, 0, 0, 0.7), transparent);
      }
      .top .meta {
        flex: 1;
        min-width: 0;
      }
      .top .meta div,
      .zap .meta div {
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
      .info {
        padding: 16px;
      }
      .info h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
      .info .sub {
        font-size: 13px;
        margin-top: 2px;
      }
      .info p {
        margin: 10px 0 0;
      }
      .info .toolbar {
        margin-top: 14px;
      }
      .error {
        padding: 12px 16px;
        color: var(--wt-rec);
      }
      .zap-head {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 12px 8px;
      }
      .zap-head .seg {
        display: flex;
        width: 100%;
      }
      .zap-head .seg button {
        flex: 1;
        padding: 0 6px;
        font-size: 13px;
      }
      .zap-head .search {
        flex: none;
        width: 100%;
      }
      .zap {
        list-style: none;
        margin: 0;
        padding: 0 0 8px;
        max-height: 640px;
        overflow-y: auto;
      }
      .zap li {
        display: flex;
        align-items: center;
        padding-right: 6px;
        border-left: 3px solid transparent;
      }
      .zap li:hover {
        background: var(--wt-chip);
      }
      .zap li:has(> .zap-main[aria-current="true"]) {
        background: var(--wt-primary-soft);
        border-left-color: var(--wt-primary);
      }
      .zap-main {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 6px 8px 9px;
        border: 0;
        background: none;
        cursor: pointer;
        text-align: left;
      }
      .zap .logo {
        width: 32px;
        height: 32px;
      }
      .zap .thumb {
        width: 56px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        flex: none;
      }
      .zap .meta {
        flex: 1;
        min-width: 0;
      }
      .zap .meta div:first-child {
        font-weight: 500;
      }
      .zap .meta div:not(:first-child) {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .zap .lock {
        color: var(--wt-muted);
        display: inline-flex;
      }
      .zap li.note {
        display: block;
        padding: 10px 12px 4px 15px;
        font-size: 12.5px;
        color: var(--wt-muted);
        background: none;
      }
      .progress {
        height: 4px;
        border-radius: 2px;
        background: var(--wt-chip);
        overflow: hidden;
        margin-top: 4px;
      }
      .progress > div {
        height: 100%;
        background: var(--wt-primary);
      }
      @media (max-width: 1100px) {
        .layout {
          grid-template-columns: minmax(0, 1fr);
        }
        .zap {
          max-height: none;
        }
      }
      @media (max-width: 640px) {
        .top .badge,
        .top .pip {
          display: none;
        }
        select {
          max-width: 130px;
        }
        .content {
          padding: 12px 0;
        }
        .player {
          border-radius: 0;
        }
      }
    `,
  ];
}

customElements.define("waipu-player", WaipuPlayer);

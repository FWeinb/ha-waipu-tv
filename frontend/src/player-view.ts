// The player: live channels (optionally from the running program's start) and recordings.
// Shaka Player is loaded on first use; DRM licenses go through Home Assistant's websocket, so its
// login covers them. Chrome, Edge, Firefox and Android get DASH + Widevine, Safari and iOS HLS +
// FairPlay; channels without DRM play as HLS everywhere, also over plain HTTP.

import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import type shakaLib from "shaka-player/dist/shaka-player.compiled-es2021.js";

import {
  fetchFairplayCertificate,
  fetchGuide,
  fetchLicense,
  fetchProgram,
  fetchRecordingStream,
  fetchStream,
  type Channel,
  type DrmSystem,
  type HomeAssistant,
  type Program,
} from "./api";
import { formatter, t } from "./i18n";
import { backIcon, downIcon, restartIcon, upIcon } from "./icons";
import { shared } from "./styles";
import { watch, type WatchTarget } from "./util";

type Shaka = typeof shakaLib;

const LICENSE_SCHEME = "waipu-license";
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

class WaipuPlayer extends LitElement {
  static properties = {
    hass: { attribute: false },
    channels: { attribute: false },
    instantRestart: { type: Boolean },
    target: { attribute: false },
    _blocked: { state: true },
    _error: { state: true },
    _badge: { state: true },
    _now: { state: true },
    _description: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare instantRestart: boolean;
  declare target: WatchTarget;
  declare _blocked?: { title: string; text: string };
  declare _error?: string;
  declare _badge?: string;
  declare _now: Record<string, Program>;
  declare _description?: string;
  private _player?: shakaLib.Player;
  private _playId = 0;
  private _clock?: number;
  private _describedId?: string;

  constructor() {
    super();
    this._now = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this._clock = window.setInterval(() => this._loadGuide(), 60_000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this._clock);
    this._playId++;
    this._player?.destroy();
    this._player = undefined;
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("target")) {
      this._play();
      this._loadGuide();
    }
  }

  private get _favorites() {
    return this.channels.filter((c) => c.favorite);
  }

  private get _channel(): Channel | undefined {
    const id = "channel" in this.target ? this.target.channel : this.target.recording.channel_id;
    return this.channels.find((c) => c.id === id);
  }

  private async _loadGuide() {
    const ids = new Set(this._favorites.map((c) => c.id));
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

  private async _play() {
    const playId = ++this._playId;
    this._error = this._blocked = undefined;
    const old = this._player;
    this._player = undefined;
    await old?.destroy();

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
      const { url } =
        "recording" in target
          ? await fetchRecordingStream(this.hass, target.recording.id, protocol)
          : await fetchStream(this.hass, target.channel, protocol, !!target.fromStart);
      const certificate = system === "fairplay" ? fromBase64((await fetchFairplayCertificate(this.hass)).certificate) : undefined;
      if (playId !== this._playId) return;

      const player = new shaka.Player();
      this._player = player;
      await player.attach(this.renderRoot.querySelector("video")!);
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
      await player.load(url);
    } catch (err) {
      if (playId === this._playId) this._fail(err);
    }
  }

  private _fail(err: unknown) {
    const e = err as { code?: number; message?: string; data?: unknown[] };
    // Shaka errors carry a code and, for license failures, Home Assistant's message in their data
    const detail = e?.data?.find((d) => typeof d === "string" && !d.startsWith(LICENSE_SCHEME));
    const message = [e?.code ? `#${e.code}` : "", (detail as string) ?? e?.message ?? String(err)].filter(Boolean).join(" ");
    this._error = t(this.hass, "playback_error", { message });
  }

  private _zap(step: number) {
    const favorites = this._favorites;
    const i = favorites.findIndex((c) => c.id === this._channel?.id);
    const next = favorites[(i + step + favorites.length) % favorites.length];
    if (next) watch(this, { channel: next.id });
  }

  protected render() {
    const target = this.target;
    const channel = this._channel;
    const recording = "recording" in target ? target.recording : undefined;
    const program = recording ? undefined : this._now[channel?.id ?? ""];
    const time = formatter(this.hass, { hour: "2-digit", minute: "2-digit" });
    const date = formatter(this.hass, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const span = (p: Program) => `${time.format(new Date(p.start))}–${time.format(new Date(p.stop))}`;
    const fromStart = "channel" in target && !!target.fromStart;
    const firstClear = this._favorites.find((c) => c.hls && c.id !== channel?.id);

    return html`<div class="content">
      <div class="layout">
        <div class="main">
          <div class="player">
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
              ${this._badge ? html`<span class="badge">${this._badge}</span>` : nothing}
            </div>
            <div class="video">
              <video autoplay playsinline controls></video>
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
            ${recording
              ? nothing
              : html`<div class="controls">
                  <button class="icon-btn" title=${t(this.hass, "prev_channel")} aria-label=${t(this.hass, "prev_channel")} @click=${() => this._zap(-1)}>
                    ${upIcon()}
                  </button>
                  <button class="icon-btn" title=${t(this.hass, "next_channel")} aria-label=${t(this.hass, "next_channel")} @click=${() => this._zap(1)}>
                    ${downIcon()}
                  </button>
                  <button
                    class="pill"
                    aria-pressed=${fromStart}
                    ?disabled=${!this.instantRestart || !channel}
                    @click=${() => watch(this, { channel: channel!.id, fromStart: true })}
                  >
                    ${restartIcon()}${t(this.hass, "from_start")}
                  </button>
                  <button class="pill live" aria-pressed=${!fromStart} @click=${() => watch(this, { channel: channel!.id })}>
                    ${t(this.hass, "live")}
                  </button>
                </div>`}
          </div>
          ${this._error ? html`<div class="card error">${this._error}</div>` : nothing}
          <div class="card info">
            <h2>${recording?.title ?? program?.title ?? channel?.name ?? ""}</h2>
            <div class="muted sub">
              ${recording
                ? [recording.episode_title, recording.start ? date.format(new Date(recording.start)) : ""].filter(Boolean).join(" · ")
                : program
                  ? [span(program), program.episode_title, program.genre].filter(Boolean).join(" · ")
                  : nothing}
            </div>
            ${this._description ? html`<p>${this._description}</p>` : nothing}
          </div>
        </div>
        <aside class="card">
          <div class="card-h"><h2>${t(this.hass, "favorites")}</h2></div>
          <ul class="zap">
            ${this._favorites.map((c) => {
              const p = this._now[c.id];
              const now = Date.now();
              const done = p ? ((now - new Date(p.start).getTime()) / (new Date(p.stop).getTime() - new Date(p.start).getTime())) * 100 : 0;
              return html`<li>
                <button aria-current=${!recording && c.id === channel?.id} @click=${() => watch(this, { channel: c.id })}>
                  <img class="logo" src=${c.logo} alt="" loading="lazy" />
                  <div class="meta">
                    <div>${c.number} · ${c.name}</div>
                    <div>${p ? `${time.format(new Date(p.start))} ${p.title}` : t(this.hass, "no_guide")}</div>
                    ${p ? html`<div class="progress"><div style="width:${done}%"></div></div>` : nothing}
                  </div>
                </button>
              </li>`;
            })}
          </ul>
        </aside>
      </div>
    </div>`;
  }

  static styles = [
    shared,
    css`
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
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
      }
      .top {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px 8px 4px;
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
      }
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.14);
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
      .video {
        position: relative;
        aspect-ratio: 16 / 9;
        background: #000;
      }
      video {
        width: 100%;
        height: 100%;
        display: block;
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
      .controls {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        flex-wrap: wrap;
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
      .error {
        padding: 12px 16px;
        color: var(--wt-rec);
      }
      .zap {
        list-style: none;
        margin: 0;
        padding: 0 0 8px;
        max-height: 640px;
        overflow-y: auto;
      }
      .zap button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 0;
        border-left: 3px solid transparent;
        background: none;
        cursor: pointer;
        text-align: left;
      }
      .zap button:hover {
        background: var(--wt-chip);
      }
      .zap button[aria-current="true"] {
        background: var(--wt-primary-soft);
        border-left-color: var(--wt-primary);
      }
      .zap .logo {
        width: 32px;
        height: 32px;
      }
      .zap .meta {
        flex: 1;
        min-width: 0;
      }
      .zap .meta div:first-child {
        font-weight: 500;
      }
      .zap .meta div:nth-child(2) {
        font-size: 12.5px;
        color: var(--wt-muted);
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
        .badge {
          display: none;
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

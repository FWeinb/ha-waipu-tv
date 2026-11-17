// The TV tab: the shared player (player.ts) for a live channel or a recording, the info card, a
// sidebar of favorites, all channels, on-demand channels or finished recordings, and the favorite
// stars (favorites have no tab of their own).

import { LitElement, css, html, nothing, type PropertyValues } from "lit";

import {
  deleteRecordings,
  fetchGuide,
  fetchProgram,
  record,
  setFavorite,
  type Channel,
  type HomeAssistant,
  type Program,
  type Recording,
} from "./api";
import { formatNumber, formatter, t, type DateFormatter } from "./i18n";
import { clockIcon, lockIcon, recIcon, restartIcon, searchIcon, starIcon, trashIcon } from "./icons";
import { videoButtons, type PlaySource } from "./player";
import { shared } from "./styles";
import { attempt, changed, toast, watch, type WatchTarget } from "./util";
import "./player";

type List = "fav" | "all" | "vod" | "rec";

class WaipuTvView extends LitElement {
  static properties = {
    hass: { attribute: false },
    channels: { attribute: false },
    recordings: { attribute: false },
    audioLanguage: { attribute: false },
    target: { attribute: false },
    _source: { state: true },
    _now: { state: true },
    _description: { state: true },
    _list: { state: true },
    _search: { state: true },
    _busy: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare recordings: Recording[];
  declare audioLanguage: string | null;
  declare target: WatchTarget;
  /** What the player plays; a new one per target, so reloading the channels doesn't restart it. */
  declare _source?: PlaySource;
  declare _now: Record<string, Program>;
  declare _description?: string;
  declare _list: List;
  declare _search: string;
  declare _busy: boolean;
  private _guideTimer?: number;
  private _describedId?: string;

  constructor() {
    super();
    this._now = {};
    this._list = "fav";
    this._search = "";
    this._busy = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._guideTimer = window.setInterval(() => this._loadGuide(), 60_000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this._guideTimer);
  }

  protected willUpdate(changed: PropertyValues<this>) {
    if (!changed.has("target")) return;
    const target = this.target;
    const channel = this._channel;
    const name = channel?.name ?? "";
    // recordings are always protected; channels on pvr.waipu's HLS list are not
    this._source =
      "recording" in target
        ? { stream: { recording_id: target.recording.id }, drm: "required", name }
        : {
            stream: { channel: target.channel },
            drm: channel?.hls ? "none" : "required",
            name,
            fromStart: !!target.fromStart,
          };
    if ("recording" in target) this._list = "rec";
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("target")) this._loadGuide();
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

  private _zap(step: number) {
    const list = this._listChannels();
    const i = list.findIndex((c) => c.id === this._channel?.id);
    const next = list[(i + step + list.length) % list.length];
    if (next) watch(this, { channel: next.id });
  }

  private async _toggleFavorite(c: Channel) {
    this._busy = true;
    const ok = await attempt(this, this.hass, () => setFavorite(this.hass, c.id, !c.favorite));
    this._busy = false;
    if (ok) {
      changed(this, "channels");
      toast(this, t(this.hass, c.favorite ? "favorite_removed" : "favorite_added", { name: c.name }));
    }
  }

  private async _record(p: Program, series = false) {
    this._busy = true;
    const ok = await attempt(this, this.hass, () => record(this.hass, p.id, series));
    this._busy = false;
    if (ok) {
      changed(this, "recordings");
      toast(this, t(this.hass, series ? "series_started" : "recording_started", { title: p.title }));
    }
  }

  /** Cancels a scheduled or running recording of the program playing. */
  private async _cancelRecording(r: Recording) {
    this._busy = true;
    const ok = await attempt(this, this.hass, () => deleteRecordings(this.hass, [r.id]));
    this._busy = false;
    if (ok) {
      changed(this, "recordings");
      toast(this, t(this.hass, "recording_cancelled"));
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


  // --- rendering ------------------------------------------------------------------------------

  protected render() {
    const target = this.target;
    const channel = this._channel;
    const recording = "recording" in target ? target.recording : undefined;
    const program = recording ? undefined : this._now[channel?.id ?? ""];
    const time = formatter(this.hass, { hour: "2-digit", minute: "2-digit" });
    const date = formatter(this.hass, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const span = (p: Program) => `${time.format(new Date(p.start))}–${time.format(new Date(p.stop))}`;
    const fromStart = "channel" in target && !!target.fromStart;
    const firstClear = this.channels.find((c) => c.favorite && c.hls && c.id !== channel?.id);

    return html`<div class="content">
      <div class="layout">
        <div class="main">
          <waipu-player
            .hass=${this.hass}
            .source=${this._source}
            .audioLanguage=${this.audioLanguage}
            ?live=${!recording}
            .program=${program}
            ?liveButton=${!!channel?.vod}
            ?zap=${!recording}
            .logo=${channel?.logo}
            .heading=${channel ? `${channel.number} · ${channel.name}` : (recording?.channel_id ?? "")}
            .subheading=${recording
              ? t(this.hass, "recording_from", { date: recording.start ? date.format(new Date(recording.start)) : "" })
              : program
                ? `${span(program)} · ${program.title}`
                : t(this.hass, "no_guide")}
            @waipu-zap=${(e: CustomEvent<{ step: number }>) => this._zap(e.detail.step)}
            @waipu-go-live=${() => "channel" in target && watch(this, { channel: target.channel })}
          >
            ${channel ? html`<span slot="top">${this._star(channel, true)}</span>` : nothing}
            ${channel?.vod && !recording
              ? html`<button
                  slot="controls"
                  class="pill"
                  aria-pressed=${fromStart}
                  @click=${() => watch(this, { channel: channel.id, fromStart: true })}
                >
                  ${restartIcon()}${t(this.hass, "from_start")}
                </button>`
              : nothing}
            ${firstClear
              ? html`<button slot="blocked" class="btn primary" @click=${() => watch(this, { channel: firstClear.id })}>
                  ${t(this.hass, "watch_name", { name: firstClear.name })}
                </button>`
              : nothing}
          </waipu-player>
          ${this._renderInfo(channel, program, recording, span, date)}
        </div>
        ${this._renderSidebar(channel, recording, time, date)}
      </div>
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
    const day = formatter(this.hass, { weekday: "long", day: "numeric", month: "long" });
    const [start, stop] = program ? [new Date(program.start).getTime(), new Date(program.stop).getTime()] : [0, 0];
    const done = program ? Math.max(0, Math.min(100, ((Date.now() - start) / (stop - start)) * 100)) : 0;
    return html`<div class="card info">
      <h2>${recording?.title ?? program?.title ?? channel?.name ?? ""}</h2>
      <div class="muted sub">
        ${recording
          ? [recording.episode_title, channel?.name, recording.start ? date.format(new Date(recording.start)) : ""].filter(Boolean).join(" · ")
          : program
            ? [`${day.format(start)}, ${span(program)}`, program.episode_title].filter(Boolean).join(" · ")
            : nothing}
      </div>
      ${program ? html`<div class="progress"><div style="width:${done}%"></div></div>` : nothing}
      ${program?.genre || scheduled
        ? html`<div class="chips">
            ${scheduled?.status === "RECORDING" ? html`<span class="chip rec">${recIcon()}${t(this.hass, "rec")}</span>` : nothing}
            ${scheduled?.status === "SCHEDULED" ? html`<span class="chip sched">${clockIcon(14)}${t(this.hass, "scheduled")}</span>` : nothing}
            ${program?.genre ? html`<span class="chip">${program.genre}</span>` : nothing}
          </div>`
        : nothing}
      ${this._description ? html`<p>${this._description}</p>` : nothing}
      ${program && !program.recordable ? html`<p class="muted small">${t(this.hass, "not_recordable")}</p>` : nothing}
      ${recording || scheduled || program?.recordable
        ? html`<div class="toolbar">
            ${recording
              ? html`<button class="btn danger" ?disabled=${this._busy} @click=${() => this._deleteRecording(recording)}>
                  ${trashIcon()}${t(this.hass, "delete_recording")}
                </button>`
              : scheduled
                ? html`<button class="btn danger" ?disabled=${this._busy} @click=${() => this._cancelRecording(scheduled)}>
                    ${t(this.hass, "cancel_recording")}
                  </button>`
                : program?.recordable
                  ? html`<button class="btn primary" ?disabled=${this._busy} @click=${() => this._record(program)}>
                        ${recIcon()}${t(this.hass, "record")}
                      </button>
                      ${program.series_id
                        ? html`<button class="btn" ?disabled=${this._busy} @click=${() => this._record(program, true)}>
                            ${t(this.hass, "record_series")}
                          </button>`
                        : nothing}`
                  : nothing}
          </div>`
        : nothing}
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
    videoButtons,
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
      .info p.small {
        font-size: 13px;
      }
      .info .progress {
        max-width: 320px;
        margin-top: 8px;
      }
      .info .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      .info .toolbar {
        margin-top: 14px;
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
        .content {
          padding: 12px 0;
        }
      }
    `,
  ];
}

customElements.define("waipu-tv-view", WaipuTvView);

// Timeline grid of the guide: favorites or all imported channels, one day at a time.

import { LitElement, css, html, nothing } from "lit";

import {
  fetchGuide,
  type Channel,
  type GuideResult,
  type HomeAssistant,
  type Program,
  type Recording,
} from "./api";
import { formatter, t } from "./i18n";
import { clockIcon, recIcon, searchIcon } from "./icons";
import "./program-dialog";
import { shared } from "./styles";
import { toast } from "./util";

// heights of a guide row and the time header, as in the styles below
const ROW_HEIGHT = 68;
const HEAD_HEIGHT = 36;
const PX_PER_MINUTE = 4;
const MINUTE = 60_000;

class WaipuGuideTab extends LitElement {
  static properties = {
    hass: { attribute: false },
    channels: { attribute: false },
    recordings: { attribute: false },
    _guide: { state: true },
    _day: { state: true },
    _all: { state: true },
    _search: { state: true },
    _selected: { state: true },
    _now: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare recordings: Recording[];
  declare _guide?: GuideResult;
  declare _day: number;
  declare _all: boolean;
  declare _search: string;
  declare _selected?: Program;
  declare _now: number;
  private _days: string[] = [];
  private _scrollToNow = true;
  private _loadedKey?: string;
  private _scrollFrame = 0;
  private _pinned = new Set<HTMLElement>();

  private _onScroll() {
    cancelAnimationFrame(this._scrollFrame);
    this._scrollFrame = requestAnimationFrame(() => this._pinTitles());
  }

  /** Keeps title and time readable next to the channel column while a program scrolls out to the
   * left, narrowed to the program's visible part. Only the program crossing the edge in each row
   * on screen is moved: sticky positioning on every program made Safari slow. */
  private _pinTitles() {
    const box = this.renderRoot.querySelector<HTMLElement>(".epg-box");
    if (!box) return;
    const x = box.scrollLeft;
    const rows = box.querySelectorAll<HTMLElement>(".epg-row");
    const first = Math.max(0, Math.floor((box.scrollTop - HEAD_HEIGHT) / ROW_HEIGHT));
    const last = Math.min(rows.length, first + Math.ceil(box.clientHeight / ROW_HEIGHT) + 1);
    const pinned = new Set<HTMLElement>();
    for (let i = first; i < last; i++) {
      for (const prog of rows[i].querySelectorAll<HTMLElement>(".prog")) {
        const left = Number(prog.dataset.left);
        const end = Number(prog.dataset.end);
        // crossing the edge, with enough left to show some text
        if (left >= x || end <= x + 40) continue;
        for (const text of prog.querySelectorAll<HTMLElement>(".t, .s")) {
          text.style.transform = `translateX(${x - left}px)`;
          text.style.maxWidth = `${end - x - 24}px`;
          pinned.add(text);
        }
        break;
      }
    }
    for (const text of this._pinned) {
      if (!pinned.has(text)) text.style.transform = text.style.maxWidth = "";
    }
    this._pinned = pinned;
  }
  private _clock?: number;

  constructor() {
    super();
    this._day = 0;
    this._all = false;
    this._search = "";
    this._now = Date.now();
  }

  connectedCallback() {
    super.connectedCallback();
    this._clock = window.setInterval(() => (this._now = Date.now()), MINUTE);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this._clock);
  }

  private get _favoriteIds() {
    return this.channels.filter((c) => c.visible && c.favorite).map((c) => c.id);
  }

  protected willUpdate() {
    // load once channels are known, and again when the day, the selection or the favorites change
    if (!this.hass || !this.channels?.length) return;
    const key = `${this._day}|${this._all}|${this._all ? "" : this._favoriteIds.join()}`;
    if (key !== this._loadedKey) {
      this._loadedKey = key;
      this._load();
    }
  }

  private async _load() {
    try {
      if (!this._days.length) {
        // an empty range just returns the guide's days
        const now = new Date();
        this._days = (await fetchGuide(this.hass, now, now)).days;
      }
      const start = new Date(this._days[this._day]);
      const end = this._day + 1 < this._days.length ? new Date(this._days[this._day + 1]) : null;
      this._guide = await fetchGuide(
        this.hass,
        start,
        end ?? new Date(start.getTime() + 24 * 60 * MINUTE),
        this._all ? undefined : this._favoriteIds,
      );
    } catch (err) {
      toast(this, t(this.hass, "error", { message: (err as Error).message ?? String(err) }));
    }
  }

  protected updated() {
    if (this._scrollToNow && this._guide) {
      this._scrollToNow = false;
      this._jumpToNow();
    }
    // a render may reuse program elements for other programs
    this._pinTitles();
  }

  private _dayRange(): [number, number] {
    const start = new Date(this._days[this._day]).getTime();
    const next = this._days[this._day + 1];
    return [start, next ? new Date(next).getTime() : start + 24 * 60 * MINUTE];
  }

  private _x(time: number, dayStart: number) {
    return ((time - dayStart) / MINUTE) * PX_PER_MINUTE;
  }

  private _jumpToNow() {
    const box = this.renderRoot.querySelector<HTMLElement>(".epg-box");
    if (!box || !this._days.length) return;
    const [start, end] = this._dayRange();
    const now = Math.min(Math.max(this._now, start), end);
    box.scrollLeft = Math.max(0, this._x(now, start) - 120);
  }

  private _recordingsByProgram() {
    const map = new Map<string, Recording>();
    for (const r of this.recordings ?? []) {
      if (r.program_id && (r.status === "SCHEDULED" || r.status === "RECORDING")) {
        map.set(r.program_id, r);
      }
    }
    return map;
  }

  protected render() {
    const day = formatter(this.hass, { weekday: "short", day: "numeric" });
    return html`
      <div class="content">
        <div class="card">
          <div class="card-h">
            <h2>${t(this.hass, "tv_guide")}</h2>
            <div class="toolbar">
              <div class="seg" role="group">
                ${this._days.map(
                  (d, i) => html`<button aria-pressed=${i === this._day} @click=${() => this._selectDay(i)}>
                    ${i === 0 ? t(this.hass, "today") : day.format(new Date(d))}
                  </button>`,
                )}
              </div>
              <div class="seg" role="group">
                <button aria-pressed=${!this._all} @click=${() => (this._all = false)}>
                  ${t(this.hass, "favorites")}
                </button>
                <button aria-pressed=${this._all} @click=${() => (this._all = true)}>
                  ${t(this.hass, "all_channels")}
                </button>
              </div>
              <button class="btn" @click=${this._now_clicked}>${clockIcon()}${t(this.hass, "now")}</button>
              <label class="search">
                ${searchIcon()}
                <input
                  type="search"
                  placeholder=${t(this.hass, "search_programs")}
                  .value=${this._search}
                  @input=${(e: Event) => (this._search = (e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          </div>
          ${this._renderGrid()}
          <div class="legend">
            <span><span class="chip live"><span class="dot"></span>${t(this.hass, "live")}</span>${t(this.hass, "legend_live")}</span>
            <span><span class="chip rec">${recIcon()}${t(this.hass, "rec")}</span>${t(this.hass, "legend_rec")}</span>
            <span><span class="chip sched">${clockIcon(14)}${t(this.hass, "scheduled")}</span>${t(this.hass, "legend_sched")}</span>
            <span>${t(this.hass, "legend_hint")}</span>
          </div>
        </div>
      </div>
      ${this._selected
        ? html`<waipu-program-dialog
            .hass=${this.hass}
            .program=${this._selected}
            .channel=${this.channels.find((c) => c.id === this._selected!.channel_id)}
            .recording=${this._recordingsByProgram().get(this._selected.id)}
            @closed=${() => (this._selected = undefined)}
          ></waipu-program-dialog>`
        : nothing}
    `;
  }

  private _selectDay(i: number) {
    this._day = i;
    this._scrollToNow = true;
  }

  private _now_clicked() {
    if (this._day !== 0) this._selectDay(0);
    else this._jumpToNow();
  }

  private _renderGrid() {
    if (!this._guide || !this._days.length) {
      return html`<p class="card-b muted">${t(this.hass, "loading")}</p>`;
    }
    const ids = this._all ? Object.keys(this._guide.programs) : this._favoriteIds;
    const rows = this.channels.filter((c) => ids.includes(c.id));
    if (!rows.length) return html`<p class="card-b muted">${t(this.hass, "no_favorites")}</p>`;

    const [dayStart, dayEnd] = this._dayRange();
    const width = this._x(dayEnd, dayStart);
    const time = formatter(this.hass, { hour: "2-digit", minute: "2-digit" });
    const ticks: number[] = [];
    for (let tick = dayStart; tick < dayEnd; tick += 30 * MINUTE) ticks.push(tick);
    const showNow = this._now >= dayStart && this._now < dayEnd;
    const recordings = this._recordingsByProgram();
    const search = this._search.trim().toLowerCase();

    return html`
      <div class="epg-box" @scroll=${this._onScroll}>
        <div class="epg" style="--track:${width}px">
          <div class="epg-head">
            <div class="epg-corner">${t(this.hass, "channel")}</div>
            <div class="epg-ticks" style="width:${width}px">
              ${ticks.map((tick) => html`<span style="left:${this._x(tick, dayStart)}px">${time.format(tick)}</span>`)}
            </div>
          </div>
          ${rows.map(
            (c) => html`<div class="epg-row">
              <div class="epg-ch">
                <span class="num">${c.number}</span>
                <img class="logo" src=${c.logo} alt="" loading="lazy" />
                <span class="name">${c.name}</span>
              </div>
              <div class="epg-track" style="width:${width}px">
                ${(this._guide!.programs[c.id] ?? []).map((p) =>
                  this._renderProgram(p, dayStart, dayEnd, time, recordings.get(p.id), search),
                )}
              </div>
            </div>`,
          )}
          ${showNow
            ? html`<div class="now-line" style="left:calc(var(--ch) + ${this._x(this._now, dayStart)}px)">
                <span>${time.format(this._now)}</span>
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderProgram(
    p: Program,
    dayStart: number,
    dayEnd: number,
    time: Intl.DateTimeFormat,
    recording: Recording | undefined,
    search: string,
  ) {
    const start = new Date(p.start).getTime();
    const stop = new Date(p.stop).getTime();
    const left = this._x(Math.max(start, dayStart), dayStart);
    const right = this._x(Math.min(stop, dayEnd), dayStart);
    const live = start <= this._now && this._now < stop;
    const classes = [
      "prog",
      stop <= this._now ? "past" : "",
      live ? "live" : "",
      recording?.status === "RECORDING" ? "rec" : recording ? "sched" : "",
      search && !`${p.title} ${p.episode_title ?? ""}`.toLowerCase().includes(search) ? "dim" : "",
    ].join(" ");
    return html`<button
      class=${classes}
      style="left:${left}px;width:${Math.max(right - left - 2, 2)}px"
      data-left=${left}
      data-end=${right}
      title="${time.format(start)}–${time.format(stop)} ${p.title}"
      @click=${() => (this._selected = p)}
    >
      <span class="t">
        ${recording?.status === "RECORDING" ? html`<span class="flag">${recIcon()}</span>` : nothing}
        ${recording?.status === "SCHEDULED" ? html`<span class="flag">${clockIcon(14)}</span>` : nothing}
        <span>${p.title}</span>
      </span>
      <span class="s">${time.format(start)}${p.episode_title ? ` · ${p.episode_title}` : ""}</span>
      ${live
        ? html`<span class="bar" style="width:${((this._now - start) / (stop - start)) * 100}%"></span>`
        : nothing}
    </button>`;
  }

  static styles = [
    shared,
    css`
      .epg-box {
        overflow: auto;
        max-height: calc(100vh - 260px);
        border-top: 1px solid var(--wt-line);
        position: relative;
      }
      /* rows as wide as their content, so the sticky channel column stays put while scrolling */
      .epg {
        position: relative;
        --ch: 196px;
        width: max-content;
        min-width: 100%;
      }
      .epg-head {
        display: flex;
        position: sticky;
        top: 0;
        z-index: 3;
        background: var(--wt-card);
        border-bottom: 1px solid var(--wt-line);
        height: 36px;
      }
      .epg-corner {
        position: sticky;
        left: 0;
        z-index: 4;
        width: var(--ch);
        flex: none;
        background: var(--wt-card);
        border-right: 1px solid var(--wt-line);
        display: flex;
        align-items: center;
        padding: 0 12px;
        font-size: 12px;
        color: var(--wt-muted);
      }
      .epg-ticks {
        position: relative;
        flex: none;
      }
      .epg-ticks span {
        position: absolute;
        top: 0;
        height: 36px;
        display: flex;
        align-items: center;
        padding-left: 6px;
        font-size: 12px;
        color: var(--wt-muted);
        border-left: 1px solid var(--wt-line);
      }
      .epg-row {
        display: flex;
        height: 68px;
        border-bottom: 1px solid var(--wt-line);
      }
      .epg-ch {
        position: sticky;
        left: 0;
        z-index: 2;
        width: var(--ch);
        flex: none;
        background: var(--wt-card);
        border-right: 1px solid var(--wt-line);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 4px 0 12px;
      }
      .epg-ch .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }
      .epg-ch .num {
        font-size: 12px;
        color: var(--wt-muted);
        width: 22px;
        text-align: right;
      }
      .epg-track {
        position: relative;
        flex: none;
      }
      .prog {
        position: absolute;
        top: 6px;
        bottom: 6px;
        border-radius: 8px;
        border: 1px solid var(--wt-line);
        background: var(--wt-chip);
        padding: 6px 10px;
        text-align: left;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
        min-width: 0;
      }
      .prog:hover {
        border-color: var(--wt-primary);
      }
      .prog:focus-visible {
        outline: 2px solid var(--wt-primary);
        outline-offset: 1px;
      }
      .prog .t {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .prog .t span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .prog .s {
        font-size: 12px;
        color: var(--wt-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .prog.past {
        opacity: 0.62;
      }
      .prog.dim {
        opacity: 0.25;
      }
      .prog.live {
        background: var(--wt-primary-soft);
        border-color: var(--wt-primary);
      }
      .prog .bar {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        background: var(--wt-primary);
      }
      .prog .flag {
        flex: none;
        display: inline-flex;
      }
      .prog.rec .flag {
        color: var(--wt-rec);
      }
      .prog.sched .flag {
        color: var(--wt-sched);
      }
      .now-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--wt-rec);
        z-index: 5;
        pointer-events: none;
      }
      .now-line span {
        position: absolute;
        top: 8px;
        left: 1px;
        transform: translateX(-50%);
        padding: 0 4px;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        background: var(--wt-rec);
        border-radius: 4px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 10px 16px;
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .legend > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      @media (max-width: 640px) {
        .epg {
          --ch: 132px;
        }
        .epg-ch .logo {
          display: none;
        }
      }
    `,
  ];
}

customElements.define("waipu-guide-tab", WaipuGuideTab);

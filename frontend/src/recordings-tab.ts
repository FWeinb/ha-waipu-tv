// Recordings: storage meter, status filter, series groups (stoppable), play, single and bulk delete.

import { LitElement, css, html, nothing } from "lit";

import {
  cancelSeries,
  deleteRecordings,
  type Channel,
  type HomeAssistant,
  type Recording,
  type RecordingStatus,
  type RecordingsResult,
} from "./api";
import { formatNumber, formatter, t } from "./i18n";
import { clockIcon, downIcon, playIcon, recIcon, stopIcon, trashIcon } from "./icons";
import { shared } from "./styles";
import { attempt, changed, toast, watch } from "./util";
import "./search-field";

type Filter = "all" | RecordingStatus;

const ORDER: Record<string, number> = { RECORDING: 0, SCHEDULED: 1, FINISHED: 2, FAILED: 3 };

/** Running first, then upcoming (soonest first), then finished (newest first). */
function compare(a: Recording, b: Recording) {
  const byStatus = (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
  if (byStatus) return byStatus;
  const diff = (a.start ?? "").localeCompare(b.start ?? "");
  return a.status === "SCHEDULED" ? diff : -diff;
}

class WaipuRecordingsTab extends LitElement {
  static properties = {
    hass: { attribute: false },
    channels: { attribute: false },
    data: { attribute: false },
    _filter: { state: true },
    _search: { state: true },
    _selected: { state: true },
    _open: { state: true },
    _busy: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare data?: RecordingsResult;
  declare _filter: Filter;
  declare _search: string;
  declare _selected: Set<string>;
  declare _open: Set<number>; // expanded series groups; collapsed by default
  declare _busy: boolean;

  constructor() {
    super();
    this._filter = "FINISHED";
    this._search = "";
    this._selected = new Set();
    this._open = new Set();
    this._busy = false;
  }

  private _shown() {
    const search = this._search.trim().toLowerCase();
    return (this.data?.recordings ?? [])
      .filter(
        (r) =>
          (this._filter === "all" || r.status === this._filter) &&
          (!search || `${r.title} ${r.episode_title ?? ""}`.toLowerCase().includes(search)),
      )
      .sort(compare);
  }

  /** Single recordings and series groups, in the order of their first recording. */
  private _rows(recordings: Recording[]) {
    const rows: (Recording | Recording[])[] = [];
    const groups = new Map<number, Recording[]>();
    for (const r of recordings) {
      if (r.group === null) rows.push(r);
      else if (groups.has(r.group)) groups.get(r.group)!.push(r);
      else {
        const group = [r];
        groups.set(r.group, group);
        rows.push(group);
      }
    }
    return rows;
  }

  private _toggle(ids: string[], on: boolean) {
    const selected = new Set(this._selected);
    for (const id of ids) {
      if (on) selected.add(id);
      else selected.delete(id);
    }
    this._selected = selected;
  }

  private async _delete(ids: string[]) {
    if (!ids.length || !confirm(t(this.hass, "confirm_delete", { count: ids.length }))) return;
    this._busy = true;
    const ok = await attempt(this, this.hass, () => deleteRecordings(this.hass, ids));
    this._busy = false;
    if (ok) {
      this._toggle(ids, false);
      changed(this, "recordings");
      toast(this, t(this.hass, "deleted", { count: ids.length }));
    }
  }

  private async _stopSeries(programId: string, title: string) {
    if (!confirm(t(this.hass, "confirm_stop_series", { title }))) return;
    this._busy = true;
    const ok = await attempt(this, this.hass, () => cancelSeries(this.hass, programId));
    this._busy = false;
    if (ok) {
      changed(this, "recordings");
      toast(this, t(this.hass, "series_stopped", { title }));
    }
  }

  protected render() {
    const all = this.data?.recordings ?? [];
    const count = (status: RecordingStatus) => all.filter((r) => r.status === status).length;
    const used = this.data?.recorded_hours ?? 0;
    const booked = this.data?.booked_hours ?? 0;
    const shown = this._shown();
    const shownIds = shown.map((r) => r.id);
    // running recordings are only listed under All
    const filters: Filter[] = ["FINISHED", "SCHEDULED", "all"];
    const filterLabel = { FINISHED: "recorded", SCHEDULED: "scheduled", all: "all" } as const;

    return html`<div class="content">
      <div class="stats">
        <div class="card stat">
          <div class="k">${t(this.hass, "storage_used")}</div>
          <div class="v">
            ${formatNumber(this.hass, used, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h
            ${booked ? html`<span class="muted of">${t(this.hass, "of_hours", { hours: booked })}</span>` : nothing}
          </div>
          ${booked
            ? html`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax=${booked} aria-valuenow=${used}>
                <div style="width:${Math.min(100, (used / booked) * 100)}%"></div>
              </div>`
            : nothing}
        </div>
        <div class="card stat"><div class="k">${t(this.hass, "recorded")}</div><div class="v">${formatNumber(this.hass, count("FINISHED"))}</div></div>
        <div class="card stat">
          <div class="k">${t(this.hass, "recording_now")}</div>
          <div class="v rec">${formatNumber(this.hass, count("RECORDING"))}</div>
        </div>
        <div class="card stat">
          <div class="k">${t(this.hass, "scheduled")}</div>
          <div class="v sched">${formatNumber(this.hass, count("SCHEDULED"))}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-h bar">
          <h2>${t(this.hass, "recordings")}</h2>
          <div class="seg center" role="group">
            ${filters.map(
              (f) => html`<button aria-pressed=${f === this._filter} @click=${() => (this._filter = f)}>
                ${t(this.hass, filterLabel[f as keyof typeof filterLabel])}
              </button>`,
            )}
          </div>
          <div class="toolbar">
            <waipu-search
              .label=${t(this.hass, "search_recordings")}
              .value=${this._search}
              @value-changed=${(e: CustomEvent) => (this._search = e.detail.value)}
            ></waipu-search>
          </div>
        </div>
        <div class="table-box">
          ${shown.length
            ? html`<table>
                <thead>
                  <tr>
                    <th class="check">
                      <input
                        type="checkbox"
                        .checked=${shownIds.every((id) => this._selected.has(id))}
                        @change=${(e: Event) => this._toggle(shownIds, (e.target as HTMLInputElement).checked)}
                      />
                    </th>
                    <th class="thumb-col"></th>
                    <th>${t(this.hass, "title")}</th>
                    <th class="wide">${t(this.hass, "channel")}</th>
                    <th class="wide">${t(this.hass, "date")}</th>
                    <th class="wide">${t(this.hass, "length")}</th>
                    ${this._showStatus ? html`<th class="wide">${t(this.hass, "status")}</th>` : nothing}
                    <th>${t(this.hass, "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${this._rows(shown).map((row) =>
                    Array.isArray(row) ? this._renderGroup(row) : this._renderRecording(row, false),
                  )}
                </tbody>
              </table>`
            : html`<p class="card-b muted">${this.data ? t(this.hass, "no_recordings") : t(this.hass, "loading")}</p>`}
        </div>
        <!-- below the table, pinned to the bottom of the window while the table scrolls -->
        ${this._selected.size
          ? html`<div class="bulk">
              <span>${t(this.hass, "selected", { count: this._selected.size })}</span>
              <button class="btn danger" ?disabled=${this._busy} @click=${() => this._delete([...this._selected])}>
                ${trashIcon()}${t(this.hass, "delete_selected")}
              </button>
              <button class="btn" @click=${() => (this._selected = new Set())}>${t(this.hass, "clear_selection")}</button>
            </div>`
          : nothing}
      </div>
    </div>`;
  }

  private _renderGroup(group: Recording[]) {
    const ids = group.map((r) => r.id);
    // the series is looked up from any of its episodes
    const programId = group.find((r) => r.program_id)?.program_id;
    const channel = this.channels.find((c) => c.id === group[0].channel_id);
    const key = group[0].group!;
    // folded, the row shows the latest episode's channel, date and length
    const latest = group.reduce((a, b) => ((b.start ?? "") > (a.start ?? "") ? b : a));
    // a search shows the matching episodes
    const open = this._open.has(key) || !!this._search.trim();
    return html`<tr class=${open ? "group open" : "group"}>
        <td class="check">
          <input
            type="checkbox"
            .checked=${ids.every((id) => this._selected.has(id))}
            @change=${(e: Event) => this._toggle(ids, (e.target as HTMLInputElement).checked)}
          />
        </td>
        <td><div class="stack">${this._thumb(group.find((r) => r.image) ?? group[0])}</div></td>
        <td class="title">
          <button class="expander" aria-expanded=${open} @click=${() => this._toggleGroup(key)}>
            <span>${group[0].title}${downIcon(18)}</span>
            <span>${[t(this.hass, "episodes", { count: group.length }), open && channel?.name].filter(Boolean).join(" · ")}</span>
          </button>
        </td>
        ${open ? html`<td class="wide"></td><td class="wide"></td><td class="wide"></td>` : this._details(latest)}
        ${this._showStatus ? html`<td class="wide"></td>` : nothing}
        <td class="actions">
          ${programId
            ? html`<button
                class="btn small stop"
                title=${t(this.hass, "stop_series")}
                aria-label=${t(this.hass, "stop_series")}
                ?disabled=${this._busy}
                @click=${() => this._stopSeries(programId, group[0].title)}
              >
                ${stopIcon()}<span>${t(this.hass, "stop_series")}</span>
              </button>`
            : nothing}
        </td>
      </tr>
      ${open ? group.map((r, i) => this._renderRecording(r, true, i === group.length - 1)) : nothing}`;
  }

  /** The status says nothing new when the filter already picks one. */
  private get _showStatus() {
    return this._filter === "all";
  }

  private _toggleGroup(key: number) {
    const open = new Set(this._open);
    if (!open.delete(key)) open.add(key);
    this._open = open;
  }

  private _thumb(r: Recording) {
    return r.image ? html`<img class="thumb" src=${r.image} alt="" loading="lazy" />` : html`<div class="thumb"></div>`;
  }

  /** Channel, date and length: their own columns, or one line under the title on narrow screens. */
  private _detailTexts(r: Recording) {
    const date = formatter(this.hass, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const channel = this.channels.find((c) => c.id === r.channel_id);
    return [
      channel?.name ?? r.channel_id,
      r.start ? date.format(new Date(r.start)) : "",
      `${formatNumber(this.hass, Math.round(r.duration / 60))} min`,
    ];
  }

  private _details(r: Recording) {
    return this._detailTexts(r).map((text) => html`<td class="wide">${text}</td>`);
  }

  /** child: an episode of the series group above; last: its last one. */
  private _renderRecording(r: Recording, child: boolean, last = false) {
    const episode = [r.season && r.episode ? `S${r.season}E${r.episode}` : "", r.episode_title ?? ""]
      .filter(Boolean)
      .join(" · ");
    return html`<tr class=${child ? (last ? "child last" : "child") : ""}>
      <td class="check">
        <input
          type="checkbox"
          .checked=${this._selected.has(r.id)}
          @change=${(e: Event) => this._toggle([r.id], (e.target as HTMLInputElement).checked)}
        />
      </td>
      <td class="thumb-cell">${this._thumb(r)}</td>
      <td class="title">
        <div>${child && episode ? episode : r.title}</div>
        ${!child && episode ? html`<div>${episode}</div>` : nothing}
        <p class="narrow">
          ${this._showStatus ? this._status(r.status) : nothing}
          ${this._detailTexts(r).filter(Boolean).join(" · ")}
        </p>
      </td>
      ${this._details(r)}
      ${this._showStatus ? html`<td class="wide">${this._status(r.status)}</td>` : nothing}
      <td class="actions">
        ${r.status === "FINISHED"
          ? html`<button
              class="play-btn"
              aria-label=${t(this.hass, "play_recording")}
              title=${t(this.hass, "play_recording")}
              @click=${() => watch(this, { recording: r })}
            >
              ${playIcon()}
            </button>`
          : nothing}
        <button class="icon-btn" aria-label=${t(this.hass, "delete")} title=${t(this.hass, "delete")} ?disabled=${this._busy} @click=${() => this._delete([r.id])}>
          ${trashIcon()}
        </button>
      </td>
    </tr>`;
  }

  private _status(status: RecordingStatus) {
    switch (status) {
      case "RECORDING":
        return html`<span class="chip rec">${recIcon()}${t(this.hass, "rec")}</span>`;
      case "SCHEDULED":
        return html`<span class="chip sched">${clockIcon(14)}${t(this.hass, "scheduled")}</span>`;
      case "FINISHED":
        return html`<span class="chip">${t(this.hass, "recorded")}</span>`;
      default:
        return html`<span class="chip">${status}</span>`;
    }
  }

  static styles = [
    shared,
    css`
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }
      .stat {
        padding: 16px;
      }
      .stat .k {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .stat .v {
        font-size: 26px;
        font-weight: 500;
        margin-top: 2px;
      }
      .stat .v.rec {
        color: var(--wt-rec);
      }
      .stat .v.sched {
        color: var(--wt-sched);
      }
      .of {
        font-size: 15px;
        font-weight: 400;
      }
      .meter {
        height: 8px;
        border-radius: 4px;
        background: var(--wt-chip);
        overflow: hidden;
        margin-top: 10px;
      }
      .meter > div {
        height: 100%;
        background: var(--wt-primary);
      }
      .bulk {
        position: sticky;
        bottom: 16px;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 8px;
        padding: 8px 8px 8px 16px;
        border-radius: 12px;
        border: 1px solid var(--wt-primary);
        /* opaque, as rows scroll beneath it */
        background: linear-gradient(var(--wt-primary-soft), var(--wt-primary-soft)), var(--wt-card);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        color: var(--wt-primary);
        font-weight: 500;
        flex-wrap: wrap;
      }
      .table-box {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 720px;
      }
      th {
        text-align: left;
        font-size: 12px;
        font-weight: 500;
        color: var(--wt-muted);
        padding: 8px;
        border-bottom: 1px solid var(--wt-line);
      }
      td {
        padding: 8px;
        border-bottom: 1px solid var(--wt-line);
        vertical-align: middle;
      }
      .check {
        width: 36px;
      }
      .thumb-col {
        width: 88px;
      }
      td.actions {
        white-space: nowrap;
      }
      /* a series: its row, then its episodes, smaller and joined by a line below its thumbnail */
      tr.group.open td,
      tr.child:not(.last) td {
        border-bottom: 0;
      }
      tr.group.open td {
        background: var(--wt-chip);
      }
      .expander {
        display: flex;
        flex-direction: column;
        padding: 0;
        border: 0;
        background: none;
        text-align: left;
        cursor: pointer;
      }
      .expander span:first-child {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
      }
      /* a disclosure chevron after the series title: right when folded, down when open */
      .expander svg {
        color: var(--wt-muted);
        transform: rotate(-90deg);
        transition: transform 0.15s;
      }
      .expander[aria-expanded="true"] svg {
        transform: none;
      }
      .expander:hover svg {
        color: var(--wt-fg);
      }
      /* a series' thumbnail as a little stack of episodes */
      .stack {
        width: 72px;
        position: relative;
      }
      .stack::before,
      .stack::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 6px;
        background: var(--wt-line);
      }
      .stack::before {
        transform: translate(6px, -6px) scale(0.9);
        opacity: 0.5;
      }
      .stack::after {
        transform: translate(3px, -3px) scale(0.95);
      }
      .stack .thumb {
        position: relative;
        z-index: 1;
      }
      .expander span:nth-child(2) {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      tr.child td {
        padding-top: 4px;
        padding-bottom: 4px;
      }
      tr.child.last td {
        padding-bottom: 10px;
      }
      tr.child td.thumb-cell {
        position: relative;
        padding-left: 30px;
      }
      tr.child td.thumb-cell::before {
        content: "";
        position: absolute;
        left: 20px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--wt-line);
      }
      tr.child.last td.thumb-cell::before {
        bottom: 50%;
      }
      tr.child .thumb {
        width: 50px;
        height: 28px;
      }
      .btn.small {
        height: 30px;
        padding: 0 12px;
        font-size: 13px;
      }
      .thumb {
        width: 72px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
        background: var(--wt-chip);
        display: block;
      }
      .title div:first-child {
        font-weight: 500;
      }
      .title div:nth-child(2) {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--wt-muted);
      }
      .icon-btn:hover {
        background: var(--wt-chip);
        color: var(--wt-rec);
      }
      .narrow,
      .stop svg {
        display: none;
      }
      /* narrow: channel, date, length and status move under the title, two cards per row */
      @media (max-width: 720px) {
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        table {
          min-width: 0;
        }
        th,
        td {
          padding: 6px 4px;
        }
        .check {
          width: 28px;
          padding-left: 8px;
        }
        /* Stop series as an icon, like the other actions */
        .stop {
          width: 36px;
          height: 36px;
          padding: 0;
          justify-content: center;
        }
        .stop svg {
          display: block;
        }
        .stop span {
          display: none;
        }
        th.wide,
        td.wide {
          display: none;
        }
        .narrow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin: 2px 0 0;
          font-size: 12.5px;
          color: var(--wt-muted);
        }
        .thumb-col {
          width: 56px;
        }
        .thumb,
        .stack {
          width: 48px;
          height: 27px;
        }
        tr.child .thumb {
          width: 40px;
          height: 23px;
        }
        tr.child td.thumb-cell {
          padding-left: 22px;
        }
        tr.child td.thumb-cell::before {
          left: 14px;
        }
      }
    `,
  ];
}

customElements.define("waipu-recordings-tab", WaipuRecordingsTab);

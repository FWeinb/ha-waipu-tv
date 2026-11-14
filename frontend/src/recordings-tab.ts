// Recordings: storage meter, status filter, series groups, single and bulk delete.

import { LitElement, css, html, nothing } from "lit";

import {
  deleteRecordings,
  type Channel,
  type HomeAssistant,
  type Recording,
  type RecordingStatus,
  type RecordingsResult,
} from "./api";
import { formatter, t } from "./i18n";
import { clockIcon, recIcon, searchIcon, trashIcon } from "./icons";
import { shared } from "./styles";
import { attempt, changed, toast } from "./util";

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
    _busy: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare data?: RecordingsResult;
  declare _filter: Filter;
  declare _search: string;
  declare _selected: Set<string>;
  declare _busy: boolean;

  constructor() {
    super();
    this._filter = "all";
    this._search = "";
    this._selected = new Set();
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

  protected render() {
    const all = this.data?.recordings ?? [];
    const count = (status: RecordingStatus) => all.filter((r) => r.status === status).length;
    const used = this.data?.recorded_hours ?? 0;
    const booked = this.data?.booked_hours ?? 0;
    const shown = this._shown();
    const shownIds = shown.map((r) => r.id);
    const filters: Filter[] = ["all", "FINISHED", "RECORDING", "SCHEDULED"];
    const filterLabel = {
      all: "all",
      FINISHED: "recorded",
      RECORDING: "recording_now",
      SCHEDULED: "scheduled",
      FAILED: "all",
    } as const;

    return html`<div class="content">
      <div class="stats">
        <div class="card stat">
          <div class="k">${t(this.hass, "storage_used")}</div>
          <div class="v">
            ${used.toFixed(1)} h
            ${booked ? html`<span class="muted of">${t(this.hass, "of_hours", { hours: booked })}</span>` : nothing}
          </div>
          ${booked
            ? html`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax=${booked} aria-valuenow=${used}>
                <div style="width:${Math.min(100, (used / booked) * 100)}%"></div>
              </div>`
            : nothing}
        </div>
        <div class="card stat"><div class="k">${t(this.hass, "recorded")}</div><div class="v">${count("FINISHED")}</div></div>
        <div class="card stat">
          <div class="k">${t(this.hass, "recording_now")}</div>
          <div class="v rec">${count("RECORDING")}</div>
        </div>
        <div class="card stat">
          <div class="k">${t(this.hass, "scheduled")}</div>
          <div class="v sched">${count("SCHEDULED")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-h">
          <h2>${t(this.hass, "recordings")}</h2>
          <div class="toolbar">
            <div class="seg" role="group">
              ${filters.map(
                (f) => html`<button aria-pressed=${f === this._filter} @click=${() => (this._filter = f)}>
                  ${t(this.hass, filterLabel[f])}
                </button>`,
              )}
            </div>
            <label class="search">
              ${searchIcon()}
              <input
                type="search"
                placeholder=${t(this.hass, "search_recordings")}
                .value=${this._search}
                @input=${(e: Event) => (this._search = (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        </div>
        ${this._selected.size
          ? html`<div class="bulk">
              <span>${t(this.hass, "selected", { count: this._selected.size })}</span>
              <button class="btn danger" ?disabled=${this._busy} @click=${() => this._delete([...this._selected])}>
                ${trashIcon()}${t(this.hass, "delete_selected")}
              </button>
              <button class="btn" @click=${() => (this._selected = new Set())}>${t(this.hass, "clear_selection")}</button>
            </div>`
          : nothing}
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
                    <th>${t(this.hass, "channel")}</th>
                    <th>${t(this.hass, "date")}</th>
                    <th>${t(this.hass, "length")}</th>
                    <th>${t(this.hass, "status")}</th>
                    <th></th>
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
      </div>
    </div>`;
  }

  private _renderGroup(group: Recording[]) {
    const ids = group.map((r) => r.id);
    return html`<tr class="group">
        <td class="check">
          <input
            type="checkbox"
            .checked=${ids.every((id) => this._selected.has(id))}
            @change=${(e: Event) => this._toggle(ids, (e.target as HTMLInputElement).checked)}
          />
        </td>
        <td></td>
        <td colspan="6">${group[0].title} <span class="muted">· ${t(this.hass, "episodes", { count: group.length })}</span></td>
      </tr>
      ${group.map((r) => this._renderRecording(r, true))}`;
  }

  private _renderRecording(r: Recording, child: boolean) {
    const date = formatter(this.hass, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const channel = this.channels.find((c) => c.id === r.channel_id);
    const episode = [r.season && r.episode ? `S${r.season}E${r.episode}` : "", r.episode_title ?? ""]
      .filter(Boolean)
      .join(" · ");
    return html`<tr class=${child ? "child" : ""}>
      <td class="check">
        <input
          type="checkbox"
          .checked=${this._selected.has(r.id)}
          @change=${(e: Event) => this._toggle([r.id], (e.target as HTMLInputElement).checked)}
        />
      </td>
      <td>${r.image ? html`<img class="thumb" src=${r.image} alt="" loading="lazy" />` : html`<div class="thumb"></div>`}</td>
      <td class="title">
        <div>${child && episode ? episode : r.title}</div>
        ${!child && episode ? html`<div>${episode}</div>` : nothing}
      </td>
      <td>${channel?.name ?? r.channel_id}</td>
      <td>${r.start ? date.format(new Date(r.start)) : ""}</td>
      <td>${Math.round(r.duration / 60)} min</td>
      <td>${this._status(r.status)}</td>
      <td>
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
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: var(--wt-primary-soft);
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
      tr.group td {
        background: var(--wt-chip);
        font-weight: 500;
      }
      tr.child td.title {
        padding-left: 28px;
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
    `,
  ];
}

customElements.define("waipu-recordings-tab", WaipuRecordingsTab);

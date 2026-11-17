// Playlist and guide URLs for IPTV players (admins only: the URLs carry the access key): the
// channel playlists, one per Mediathek category, and an editor that puts a custom playlist URL
// together to copy.

import { LitElement, css, html, nothing } from "lit";

import {
  fetchMediathekCategories,
  fetchPlaylists,
  type HomeAssistant,
  type MediathekCategory,
  type MediathekSort,
  type PlaylistsResult,
} from "./api";
import { t } from "./i18n";
import { copyIcon } from "./icons";
import { shared } from "./styles";
import { toast } from "./util";

const ORDER = ["favorites", "all", "live", "vod", "recordings", "epg"] as const;
const FILTERS = ["all", "favorites", "live", "vod"] as const;
const SORTS: MediathekSort[] = ["mostWatched", "latest", "titleAsc", "vanishingSoon"];
const LIMIT_MAX = 500;

/** The custom playlist in the editor: what it holds and its options, as the URL takes them. Empty
 * strings are the server's defaults. */
interface CustomPlaylist {
  kind: "channels" | "mediathek" | "recordings";
  filter: "all" | "favorites" | "live" | "vod";
  hidden: boolean;
  drm: boolean;
  protocol: "" | "hls" | "dash";
  timeshift: "" | "0" | "1";
  hls_proxy: "" | "0" | "1";
  category: string;
  genre: string;
  sort: MediathekSort;
  limit: number;
}

const blank = (category = ""): CustomPlaylist => ({
  kind: "channels",
  filter: "all",
  hidden: false,
  drm: true,
  protocol: "",
  timeshift: "",
  hls_proxy: "",
  category,
  genre: "",
  sort: "mostWatched",
  limit: 100,
});

/** A custom playlist's path and options; only what differs from the server's defaults. */
function playlistPath(p: CustomPlaylist): [string, URLSearchParams] {
  const query = new URLSearchParams();
  const set = (name: string, value: string | false) => value && query.set(name, value);
  if (p.kind === "channels") {
    set("hidden", p.hidden && "1");
    set("drm", !p.drm && "0");
    set("protocol", p.protocol);
    set("timeshift", p.timeshift);
    set("hls_proxy", p.hls_proxy);
    return [`${p.filter}.m3u`, query];
  }
  if (p.kind === "mediathek") {
    set("sort", p.sort !== "mostWatched" && p.sort);
    set("genre", p.genre);
    set("limit", p.limit !== 100 && String(p.limit));
    set("protocol", p.protocol === "dash" && "dash");
    set("hls_proxy", p.protocol !== "dash" && p.hls_proxy);
    return [`mediathek/${encodeURIComponent(p.category)}.m3u`, query];
  }
  set("protocol", p.protocol === "hls" && "hls");
  return ["recordings.m3u", query];
}

class WaipuPlaylistsTab extends LitElement {
  static properties = {
    hass: { attribute: false },
    _data: { state: true },
    _categories: { state: true },
    _draft: { state: true },
  };

  declare hass: HomeAssistant;
  declare _data?: PlaylistsResult;
  declare _categories?: MediathekCategory[];
  /** The playlist in the editor. */
  declare _draft: CustomPlaylist;

  constructor() {
    super();
    this._draft = blank();
  }

  protected firstUpdated() {
    fetchPlaylists(this.hass)
      .then((data) => (this._data = data))
      .catch((err) => this._error(err));
    fetchMediathekCategories(this.hass)
      .then(({ categories }) => {
        this._categories = categories;
        if (!this._draft.category) this._draft = { ...this._draft, category: categories[0]?.id ?? "" };
      })
      .catch(() => (this._categories = [])); // the Mediathek is optional here
  }

  private _error(err: unknown) {
    toast(this, t(this.hass, "error", { message: (err as Error)?.message ?? String(err) }));
  }

  /** The URL as players on this browser's network reach it. */
  private _url(path: string, query = new URLSearchParams()) {
    const data = this._data!;
    query.set("key", data.key);
    return `${location.origin}${data.base}/${path}?${query}`;
  }

  private async _copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast(this, t(this.hass, "copied"));
    } catch {
      toast(this, t(this.hass, "copy_failed"));
    }
  }

  private _set(change: Partial<CustomPlaylist>) {
    this._draft = { ...this._draft, ...change };
  }

  protected render() {
    const data = this._data;
    return html`<div class="content">
      <div class="card">
        <div class="card-h">
          <h2>${t(this.hass, "playlist_server")}</h2>
          <span class="chip">${t(this.hass, "admins_only")}</span>
          ${data
            ? data.enabled
              ? html`<span class="chip live"><span class="dot"></span>${t(this.hass, "running")}</span>`
              : html`<span class="chip">${t(this.hass, "off")}</span>`
            : nothing}
        </div>
        <div class="card-b">
          ${!data
            ? html`<p class="muted">${t(this.hass, "loading")}</p>`
            : !data.enabled
              ? html`<p>${t(this.hass, "playlists_off")}</p>`
              : html`<ul class="urls">
                    ${ORDER.map((name) => this._row(t(this.hass, `url_${name}`), location.origin + data.urls[name]))}
                  </ul>
                  ${this._categories?.length
                    ? html`<h3>${t(this.hass, "mediathek")}</h3>
                        <ul class="urls">
                          ${this._categories.map((c) => this._row(c.name, this._url(`mediathek/${encodeURIComponent(c.id)}.m3u`)))}
                        </ul>`
                    : nothing}`}
        </div>
        ${data
          ? html`<div class="card-b actions">
              <a class="btn" href="/config/integrations/integration/waipu_tv">${t(this.hass, "open_options")}</a>
            </div>`
          : nothing}
      </div>
      ${data?.enabled ? this._renderCustom(data) : nothing}
      ${data?.enabled ? this._renderOptions(data) : nothing}
      <p class="muted note">${t(this.hass, "playlists_note")}</p>
    </div>`;
  }

  private _row(label: string, url: string) {
    return html`<li>
      <div class="meta">
        <div>${label}</div>
        <div class="mono">${url}</div>
      </div>
      <button class="btn" @click=${() => this._copy(url)}>${copyIcon()}${t(this.hass, "copy")}</button>
    </li>`;
  }

  private _renderCustom(data: PlaylistsResult) {
    const draft = this._draft;
    const [path, query] = playlistPath(draft);
    const url = this._url(path, query);
    const category = this._categories?.find((c) => c.id === draft.category);
    const onOff = (value: boolean) => t(this.hass, value ? "on" : "off_value");
    const fromOptions = (value: boolean) => t(this.hass, "from_options", { value: onOff(value) });
    const tristate = (value: "" | "0" | "1", fallback: boolean, change: (v: "" | "0" | "1") => void) =>
      html`<select @change=${(e: Event) => change((e.target as HTMLSelectElement).value as "" | "0" | "1")}>
        <option value="" ?selected=${value === ""}>${fromOptions(fallback)}</option>
        <option value="1" ?selected=${value === "1"}>${onOff(true)}</option>
        <option value="0" ?selected=${value === "0"}>${onOff(false)}</option>
      </select>`;
    const kinds = [
      ["channels", "kind_channels"],
      ["mediathek", "mediathek"],
      ["recordings", "url_recordings"],
    ] as const;

    return html`<div class="card">
      <div class="card-h"><h2>${t(this.hass, "custom_title")}</h2></div>
      <div class="card-b">
        <p class="intro">${t(this.hass, "custom_intro")}</p>
        <div class="editor">
          <div class="fields">
            <div class="wide field">
              <span>${t(this.hass, "playlist_content")}</span>
              <div class="seg" role="group">
                ${kinds.map(
                  ([kind, label]) => html`<button
                    aria-pressed=${draft.kind === kind}
                    ?disabled=${kind === "mediathek" && !this._categories?.length}
                    @click=${() => this._set({ kind, protocol: "" })}
                  >
                    ${t(this.hass, label)}
                  </button>`,
                )}
              </div>
            </div>

            ${draft.kind === "channels"
              ? html`<label>
                    <span>${t(this.hass, "kind_channels")}</span>
                    <select @change=${(e: Event) => this._set({ filter: (e.target as HTMLSelectElement).value as CustomPlaylist["filter"] })}>
                      ${FILTERS.map((f) => html`<option value=${f} ?selected=${draft.filter === f}>${t(this.hass, `url_${f}`)}</option>`)}
                    </select>
                  </label>
                  <label>
                    <span>${t(this.hass, "playlist_protocol")}</span>
                    <select @change=${(e: Event) => this._set({ protocol: (e.target as HTMLSelectElement).value as CustomPlaylist["protocol"] })}>
                      <option value="" ?selected=${draft.protocol === ""}>${t(this.hass, "protocol_auto")}</option>
                      <option value="hls" ?selected=${draft.protocol === "hls"}>HLS</option>
                      <option value="dash" ?selected=${draft.protocol === "dash"}>DASH</option>
                    </select>
                  </label>
                  <label>
                    <span>${t(this.hass, "playlist_timeshift")}</span>
                    ${tristate(draft.timeshift, data.defaults.timeshift, (timeshift) => this._set({ timeshift }))}
                  </label>
                  <label>
                    <span>${t(this.hass, "playlist_hls_proxy")}</span>
                    ${tristate(draft.hls_proxy, data.defaults.hls_proxy, (hls_proxy) => this._set({ hls_proxy }))}
                  </label>
                  <label class="check">
                    <input type="checkbox" .checked=${draft.hidden} @change=${(e: Event) => this._set({ hidden: (e.target as HTMLInputElement).checked })} />
                    ${t(this.hass, "playlist_hidden")}
                  </label>
                  <label class="check">
                    <input type="checkbox" .checked=${draft.drm} @change=${(e: Event) => this._set({ drm: (e.target as HTMLInputElement).checked })} />
                    ${t(this.hass, "playlist_drm")}
                  </label>`
              : draft.kind === "mediathek"
                ? html`<label>
                      <span>${t(this.hass, "playlist_category")}</span>
                      <select @change=${(e: Event) => this._set({ category: (e.target as HTMLSelectElement).value, genre: "" })}>
                        ${(this._categories ?? []).map((c) => html`<option value=${c.id} ?selected=${draft.category === c.id}>${c.name}</option>`)}
                      </select>
                    </label>
                    <label>
                      <span>${t(this.hass, "playlist_genre")}</span>
                      <select ?disabled=${!category?.genres.length} @change=${(e: Event) => this._set({ genre: (e.target as HTMLSelectElement).value })}>
                        <option value="" ?selected=${!draft.genre}>${t(this.hass, "all_genres")}</option>
                        ${(category?.genres ?? []).map((g) => html`<option value=${g.id} ?selected=${draft.genre === g.id}>${g.name}</option>`)}
                      </select>
                    </label>
                    <label>
                      <span>${t(this.hass, "thek_sort")}</span>
                      <select @change=${(e: Event) => this._set({ sort: (e.target as HTMLSelectElement).value as MediathekSort })}>
                        ${SORTS.map((s) => html`<option value=${s} ?selected=${draft.sort === s}>${t(this.hass, `sort_${s}`)}</option>`)}
                      </select>
                    </label>
                    <label>
                      <span>${t(this.hass, "playlist_limit")}</span>
                      <input
                        type="number"
                        min="1"
                        max=${LIMIT_MAX}
                        .value=${String(draft.limit)}
                        @change=${(e: Event) => {
                          const value = Math.round(Number((e.target as HTMLInputElement).value)) || 100;
                          this._set({ limit: Math.max(1, Math.min(LIMIT_MAX, value)) });
                        }}
                      />
                    </label>
                    <label>
                      <span>${t(this.hass, "playlist_protocol")}</span>
                      <select @change=${(e: Event) => this._set({ protocol: (e.target as HTMLSelectElement).value === "dash" ? "dash" : "" })}>
                        <option value="" ?selected=${draft.protocol !== "dash"}>HLS</option>
                        <option value="dash" ?selected=${draft.protocol === "dash"}>DASH</option>
                      </select>
                    </label>
                    ${draft.protocol !== "dash"
                      ? html`<label>
                          <span>${t(this.hass, "playlist_hls_proxy")}</span>
                          ${tristate(draft.hls_proxy, data.defaults.hls_proxy, (hls_proxy) => this._set({ hls_proxy }))}
                        </label>`
                      : nothing}`
                : html`<label>
                    <span>${t(this.hass, "playlist_protocol")}</span>
                    <select @change=${(e: Event) => this._set({ protocol: (e.target as HTMLSelectElement).value === "hls" ? "hls" : "" })}>
                      <option value="" ?selected=${draft.protocol !== "hls"}>DASH</option>
                      <option value="hls" ?selected=${draft.protocol === "hls"}>HLS</option>
                    </select>
                  </label>`}
          </div>
          <div class="preview">
            <div class="mono">${url}</div>
          </div>
          <div class="toolbar">
            <button class="btn primary" ?disabled=${draft.kind === "mediathek" && !draft.category} @click=${() => this._copy(url)}>
              ${copyIcon()}${t(this.hass, "copy")}
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  private _renderOptions(data: PlaylistsResult) {
    const onOff = (value: boolean) => t(this.hass, value ? "on" : "off_value");
    const fromOptions = (value: boolean) => t(this.hass, "from_options", { value: onOff(value) });
    const m3u = t(this.hass, "m3u_playlists");
    const restart = data.instant_restart ? "" : ` ${t(this.hass, "needs_restart")}`;
    const rows: [string, string, string, string, string][] = [
      ["hidden", "0 | 1", onOff(false), `${m3u}, epg.xml`, t(this.hass, "param_hidden")],
      ["drm", "0 | 1", onOff(true), `${m3u}, epg.xml`, t(this.hass, "param_drm")],
      ["protocol", "auto | hls | dash", "auto", `${m3u}, recordings.m3u, mediathek`, t(this.hass, "param_protocol")],
      ["timeshift", "0 | 1", fromOptions(data.defaults.timeshift), m3u, t(this.hass, "param_timeshift") + restart],
      ["hls_proxy", "0 | 1", fromOptions(data.defaults.hls_proxy), m3u, t(this.hass, "param_hls_proxy")],
      ["filter", "all | favorites | live | vod", "all", "epg.xml", t(this.hass, "param_filter")],
      ["sort", "mostWatched | latest | titleAsc | vanishingSoon", "mostWatched", "mediathek", t(this.hass, "param_sort")],
      ["genre", "krimi, drama, …", "", "mediathek", t(this.hass, "param_genre")],
      ["limit", "1–500", "100", "mediathek", t(this.hass, "param_limit")],
    ];
    return html`<div class="card">
      <div class="card-h"><h2>${t(this.hass, "options_title")}</h2></div>
      <div class="card-b">
        <p class="intro">${t(this.hass, "options_intro")}</p>
        <div class="table-box">
          <table>
            <thead>
              <tr>
                <th>${t(this.hass, "parameter")}</th>
                <th>${t(this.hass, "values")}</th>
                <th>${t(this.hass, "default")}</th>
                <th>${t(this.hass, "applies_to")}</th>
                <th>${t(this.hass, "meaning")}</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(
                ([name, values, def, applies, meaning]) => html`<tr>
                  <td class="mono">${name}</td>
                  <td class="mono">${values}</td>
                  <td>${def}</td>
                  <td>${applies}</td>
                  <td>${meaning}</td>
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  static styles = [
    shared,
    css`
      .card,
      .note {
        max-width: 1000px;
      }
      .note {
        margin: 0;
        font-size: 12.5px;
      }
      h3 {
        margin: 16px 0 4px;
        font-size: 14px;
        font-weight: 500;
      }
      .urls {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .urls li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--wt-line);
      }
      .urls li:last-child {
        border-bottom: 0;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .meta div:first-child {
        font-weight: 500;
      }
      .meta div:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--wt-muted);
      }
      .actions {
        padding-top: 0;
      }
      .intro {
        margin: 0 0 12px;
        color: var(--wt-muted);
        font-size: 13px;
      }
      .fields {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px 16px;
      }
      .fields .wide {
        grid-column: 1 / -1;
      }
      .fields label,
      .fields .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
      }
      .fields label > span,
      .fields .field > span {
        color: var(--wt-muted);
      }
      .fields label.check {
        flex-direction: row;
        align-items: center;
        gap: 8px;
        align-self: end;
        min-height: 36px;
      }
      .fields input[type="number"],
      .fields select {
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--wt-line);
        background: var(--card-background-color, #fff);
        color: inherit;
        padding: 0 10px;
        font: inherit;
        font-size: 14px;
        min-width: 0;
      }
      .seg {
        align-self: flex-start;
      }
      .seg button:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .preview {
        margin-top: 16px;
        padding: 10px 12px;
        border-radius: 8px;
        background: rgba(127, 127, 127, 0.14);
        overflow-x: auto;
      }
      .preview .mono {
        white-space: nowrap;
      }
      .toolbar {
        margin-top: 12px;
      }
      .table-box {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 640px;
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
        vertical-align: top;
        font-size: 13px;
      }
      td.mono {
        white-space: nowrap;
      }
    `,
  ];
}

customElements.define("waipu-playlists-tab", WaipuPlaylistsTab);

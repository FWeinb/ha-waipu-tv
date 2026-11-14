// Favorites (stored in the waipu.tv account) and all channels with star toggles.

import { LitElement, css, html } from "lit";

import { setFavorite, type Channel, type HomeAssistant } from "./api";
import { t } from "./i18n";
import { refreshIcon, searchIcon, starIcon } from "./icons";
import { shared } from "./styles";
import { attempt, changed, toast } from "./util";

type Filter = "all" | "live" | "vod" | "hidden";

class WaipuFavoritesTab extends LitElement {
  static properties = {
    hass: { attribute: false },
    channels: { attribute: false },
    _filter: { state: true },
    _search: { state: true },
    _busy: { state: true },
  };

  declare hass: HomeAssistant;
  declare channels: Channel[];
  declare _filter: Filter;
  declare _search: string;
  declare _busy?: string;

  constructor() {
    super();
    this._filter = "all";
    this._search = "";
  }

  private async _toggle(c: Channel) {
    this._busy = c.id;
    const ok = await attempt(this, this.hass, () => setFavorite(this.hass, c.id, !c.favorite));
    this._busy = undefined;
    if (ok) {
      changed(this, "channels");
      toast(this, t(this.hass, c.favorite ? "favorite_removed" : "favorite_added", { name: c.name }));
    }
  }

  private _star(c: Channel) {
    const label = t(this.hass, c.favorite ? "remove_favorite" : "add_favorite");
    return html`<button
      class="star-btn"
      aria-pressed=${c.favorite}
      title=${label}
      aria-label="${label}: ${c.name}"
      ?disabled=${this._busy === c.id}
      @click=${() => this._toggle(c)}
    >
      ${starIcon()}
    </button>`;
  }

  private _kind(c: Channel) {
    return [
      `${c.number}`,
      t(this.hass, c.vod ? "on_demand" : "live_tv"),
      ...(c.visible ? [] : [t(this.hass, "hidden")]),
    ].join(" · ");
  }

  protected render() {
    const channels = this.channels ?? [];
    const favorites = channels.filter((c) => c.favorite);
    const search = this._search.trim().toLowerCase();
    const shown = channels.filter(
      (c) =>
        (this._filter === "hidden" ? !c.visible : c.visible) &&
        (this._filter !== "live" || !c.vod) &&
        (this._filter !== "vod" || c.vod) &&
        (!search || c.name.toLowerCase().includes(search) || c.id.includes(search)),
    );
    const filters: Filter[] = ["all", "live", "vod", "hidden"];
    const filterLabel = { all: "all", live: "live_tv", vod: "on_demand", hidden: "hidden" } as const;

    return html`<div class="content">
      <div class="layout">
        <div class="card">
          <div class="card-h">
            <h2>${t(this.hass, "your_favorites")}</h2>
            <span class="chip">${favorites.length}</span>
          </div>
          <div class="note">${refreshIcon()}${t(this.hass, "favorites_note")}</div>
          <div class="card-b">
            <ul class="list">
              ${favorites.map(
                (c) => html`<li>
                  <img class="logo" src=${c.logo} alt="" loading="lazy" />
                  <div class="meta">
                    <div>${c.name}</div>
                    <div>${this._kind(c)}</div>
                  </div>
                  ${this._star(c)}
                </li>`,
              )}
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-h">
            <h2>${t(this.hass, "all_channels")}</h2>
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
                  placeholder=${t(this.hass, "filter_channels")}
                  .value=${this._search}
                  @input=${(e: Event) => (this._search = (e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          </div>
          <div class="card-b">
            <div class="grid">
              ${shown.map(
                (c) => html`<div class="tile">
                  <img class="logo" src=${c.logo} alt="" loading="lazy" />
                  <div class="meta">
                    <div>${c.name}</div>
                    <div>${this._kind(c)}</div>
                  </div>
                  ${this._star(c)}
                </div>`,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  static styles = [
    shared,
    css`
      .layout {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: flex-start;
      }
      .layout > .card:first-child {
        flex: 1 1 340px;
      }
      .layout > .card:last-child {
        flex: 999 1 560px;
        min-width: 0;
      }
      .note {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: var(--wt-muted);
        padding: 0 16px 12px;
      }
      .note svg {
        width: 16px !important;
        height: 16px !important;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 4px;
        border-bottom: 1px solid var(--wt-line);
      }
      .list li:last-child {
        border-bottom: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 8px;
      }
      .tile {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 4px 8px 10px;
        border: 1px solid var(--wt-line);
        border-radius: 10px;
        min-width: 0;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .meta div:first-child {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .meta div:last-child {
        font-size: 12px;
        color: var(--wt-muted);
      }
    `,
  ];
}

customElements.define("waipu-favorites-tab", WaipuFavoritesTab);

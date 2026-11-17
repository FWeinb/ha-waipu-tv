// The Mediathek tab: waipu.tv's on-demand library to browse, by category, genre and order, as a
// grid of titles and seasons of series; a title opens its player page (mediathek-view.ts), a season
// its episodes (mediathek-series.ts). What was shown, loaded pages
// and scroll position included, survives a visit to a title, so Back to the library continues
// where it was.

import { LitElement, css, html, nothing } from "lit";

import {
  fetchMediathek,
  fetchMediathekCategories,
  type HomeAssistant,
  type MediathekCategory,
  type MediathekItem,
  type MediathekSort,
} from "./api";
import { formatNumber, formatter, t } from "./i18n";
import { shared } from "./styles";
import { openThek } from "./util";

const SORTS: MediathekSort[] = ["mostWatched", "latest", "titleAsc", "vanishingSoon"];

interface Browse {
  category: string;
  genre: string; // "" for all of the category
  sort: MediathekSort;
  items: MediathekItem[];
  page: number; // the last one loaded
  more: boolean;
  scroll: number;
}

// kept while the panel is open, so leaving for a title and coming back keeps the place
let categories: MediathekCategory[] | undefined;
let kept: Browse | undefined;

class WaipuMediathekTab extends LitElement {
  static properties = {
    hass: { attribute: false },
    _categories: { state: true },
    _browse: { state: true },
    _loading: { state: true },
  };

  declare hass: HomeAssistant;
  declare _categories?: MediathekCategory[];
  declare _browse?: Browse;
  declare _loading: boolean;
  private _loadId = 0;

  constructor() {
    super();
    this._loading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._categories = categories;
    this._browse = kept;
    if (!kept) this._init();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._browse) kept = { ...this._browse, scroll: window.scrollY };
  }

  protected firstUpdated() {
    if (kept?.scroll) window.scrollTo(0, kept.scroll);
  }

  private async _init() {
    try {
      categories ??= (await fetchMediathekCategories(this.hass)).categories;
      this._categories = categories;
      if (categories[0]) this._show({ category: categories[0].id, genre: "", sort: "mostWatched" });
    } catch (err) {
      this._fail(err);
    }
  }

  /** Starts a new list; only the newest request's answer is shown. */
  private _show(choice: Pick<Browse, "category" | "genre" | "sort">) {
    this._browse = { ...choice, items: [], page: -1, more: true, scroll: 0 };
    this._loadMore();
  }

  private async _loadMore() {
    const browse = this._browse;
    if (!browse || this._loading) return;
    const loadId = ++this._loadId;
    this._loading = true;
    try {
      const page = browse.page + 1;
      const { items, more } = await fetchMediathek(this.hass, browse.category, browse.sort, browse.genre || undefined, page);
      if (loadId !== this._loadId) return;
      // a title can move between pages while loading; it's listed once
      const seen = new Set(browse.items.map((i) => i.id));
      this._browse = { ...browse, items: [...browse.items, ...items.filter((i) => !seen.has(i.id))], page, more };
    } catch (err) {
      if (loadId === this._loadId) {
        this._browse = { ...browse, more: false };
        this._fail(err);
      }
    } finally {
      if (loadId === this._loadId) this._loading = false;
    }
  }

  private _choose(choice: Partial<Pick<Browse, "category" | "genre" | "sort">>) {
    const browse = this._browse;
    if (!browse) return;
    this._loading = false; // the running request's answer is dropped
    this._show({ category: browse.category, genre: browse.genre, sort: browse.sort, ...choice });
  }

  private _fail(err: unknown) {
    this.dispatchEvent(
      new CustomEvent("waipu-toast", {
        detail: { message: t(this.hass, "error", { message: (err as Error)?.message ?? String(err) }) },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected render() {
    const browse = this._browse;
    const category = this._categories?.find((c) => c.id === browse?.category);
    const until = formatter(this.hass, { day: "numeric", month: "short" });
    return html`<div class="content">
      <div class="card head">
        <div class="categories" role="tablist">
          ${(this._categories ?? []).map(
            (c) => html`<button role="tab" aria-selected=${c.id === browse?.category} @click=${() => this._choose({ category: c.id, genre: "" })}>
              ${c.name}
            </button>`,
          )}
        </div>
        <div class="filters">
          ${category?.genres.length
            ? html`<div class="genres">
                ${[{ id: "", name: t(this.hass, "all_genres") }, ...category.genres].map(
                  (g) => html`<button class="chip" aria-pressed=${g.id === browse?.genre} @click=${() => this._choose({ genre: g.id })}>
                    ${g.name}
                  </button>`,
                )}
              </div>`
            : html`<span class="grow"></span>`}
          <select aria-label=${t(this.hass, "thek_sort")} @change=${(e: Event) => this._choose({ sort: (e.target as HTMLSelectElement).value as MediathekSort })}>
            ${SORTS.map((s) => html`<option value=${s} ?selected=${s === browse?.sort}>${t(this.hass, `sort_${s}`)}</option>`)}
          </select>
        </div>
      </div>
      <div class="grid">
        ${(browse?.items ?? []).map(
          (i) => html`<button class="title" @click=${() => openThek(this, i.series ? { series: i.id } : { title: i.id })}>
            <div class="cover">
              ${i.image ? html`<img src=${i.image} alt="" loading="lazy" />` : nothing}
              ${i.series ? html`<span class="badge">${t(this.hass, "series")}</span>` : nothing}
              ${i.expires ? html`<span class="until">${t(this.hass, "thek_until", { date: until.format(new Date(i.expires)) })}</span>` : nothing}
            </div>
            <div class="name">${i.title}</div>
            <div class="muted meta">
              ${[i.channel, i.genre, i.duration ? `${formatNumber(this.hass, Math.round(i.duration / 60))} min` : ""].filter(Boolean).join(" · ")}
            </div>
          </button>`,
        )}
      </div>
      <div class="foot">
        ${this._loading
          ? html`<span class="muted">${t(this.hass, "loading")}</span>`
          : browse?.more
            ? html`<button class="btn" @click=${this._loadMore}>${t(this.hass, "load_more")}</button>`
            : browse && !browse.items.length
              ? html`<span class="muted">${t(this.hass, "no_titles")}</span>`
              : nothing}
      </div>
    </div>`;
  }

  static styles = [
    shared,
    css`
      .head {
        padding: 4px 16px 12px;
      }
      .categories {
        display: flex;
        overflow-x: auto;
        border-bottom: 1px solid var(--wt-line);
        margin: 0 -16px;
        padding: 0 8px;
      }
      .categories button {
        height: 44px;
        padding: 0 14px;
        border: 0;
        background: none;
        cursor: pointer;
        color: inherit;
        font: inherit;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0.75;
        border-bottom: 2px solid transparent;
      }
      .categories button[aria-selected="true"] {
        opacity: 1;
        color: var(--wt-primary);
        border-bottom-color: var(--wt-primary);
      }
      .filters {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-top: 12px;
      }
      .genres {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .grow {
        flex: 1;
      }
      .chip {
        height: 30px;
        padding: 0 12px;
        border-radius: 15px;
        border: 1px solid var(--wt-line);
        background: none;
        color: inherit;
        font: inherit;
        font-size: 13px;
        cursor: pointer;
      }
      .chip[aria-pressed="true"] {
        background: var(--wt-primary-soft);
        border-color: transparent;
        color: var(--wt-primary);
        font-weight: 500;
      }
      select {
        height: 32px;
        border-radius: 16px;
        border: 1px solid var(--wt-line);
        background: var(--card-background-color, #fff);
        color: inherit;
        padding: 0 10px;
        font: inherit;
        font-size: 13px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px 16px;
      }
      .title {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .cover {
        position: relative;
        aspect-ratio: 16 / 9;
        border-radius: 8px;
        overflow: hidden;
        background: var(--wt-chip);
        margin-bottom: 4px;
      }
      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.2s;
      }
      .title:hover .cover img,
      .title:focus-visible .cover img {
        transform: scale(1.04);
      }
      .until {
        position: absolute;
        left: 6px;
        bottom: 6px;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 11.5px;
      }
      .badge {
        position: absolute;
        left: 6px;
        top: 6px;
        padding: 2px 8px;
        border-radius: 10px;
        background: var(--wt-primary);
        color: #fff;
        font-size: 11.5px;
        font-weight: 500;
      }
      .name {
        font-weight: 500;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .meta {
        font-size: 12.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .foot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      @media (max-width: 640px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px 12px;
        }
        .filters {
          flex-direction: column-reverse;
        }
      }
    `,
  ];
}

customElements.define("waipu-mediathek-tab", WaipuMediathekTab);

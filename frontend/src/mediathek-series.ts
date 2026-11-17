// A season of a series in the Mediathek: the series' seasons to switch between and the season's
// episodes; an episode opens the player page (mediathek-view.ts), with the series' episodes beside
// the player.

import { LitElement, css, html, nothing, type PropertyValues } from "lit";

import { fetchMediathekSeries, type HomeAssistant, type MediathekSeries } from "./api";
import { formatNumber, formatter, t } from "./i18n";
import { backIcon, playIcon } from "./icons";
import { shared } from "./styles";
import { openThek, thekBack } from "./util";

// an episode's "until" shows when it leaves within this long; most stay for years
const LEAVING_SOON = 30 * 86_400_000;

class WaipuMediathekSeries extends LitElement {
  static properties = {
    hass: { attribute: false },
    seasonId: { attribute: false },
    _series: { state: true },
    _failed: { state: true },
  };

  declare hass: HomeAssistant;
  declare seasonId: string;
  declare _series?: MediathekSeries;
  declare _failed: boolean;

  constructor() {
    super();
    this._failed = false;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("seasonId")) this._load(this.seasonId);
  }

  private async _load(id: string) {
    this._failed = false;
    // another season of the same series is already there: no request, no flash
    try {
      const series = await fetchMediathekSeries(this.hass, id);
      if (id === this.seasonId) this._series = series;
    } catch (err) {
      if (id !== this.seasonId) return;
      this._failed = true;
      this.dispatchEvent(
        new CustomEvent("waipu-toast", {
          detail: { message: t(this.hass, "error", { message: (err as Error)?.message ?? String(err) }) },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  protected render() {
    const series = this._series;
    const season = series?.seasons.find((s) => s.id === this.seasonId);
    const until = formatter(this.hass, { day: "numeric", month: "short", year: "numeric" });
    const now = Date.now();
    return html`<div class="content">
      <button class="back" @click=${() => thekBack(this)}>${backIcon()}${t(this.hass, "back")}</button>
      <div class="card head">
        <h2>${series?.title ?? ""}</h2>
        ${series?.channel ? html`<div class="muted">${series.channel}</div>` : nothing}
        ${series && series.seasons.length > 1
          ? html`<div class="seasons" role="group" aria-label=${t(this.hass, "seasons")}>
              ${series.seasons.map(
                (s) => html`<button
                  class="chip"
                  aria-pressed=${s.id === this.seasonId}
                  @click=${() => s.id !== this.seasonId && openThek(this, { series: s.id }, true)}
                >
                  ${s.season !== null ? t(this.hass, "season_n", { number: s.season }) : s.title}
                </button>`,
              )}
            </div>`
          : season
            ? html`<div class="muted">${season.title}</div>`
            : nothing}
      </div>
      ${!season
        ? html`<p class="muted">${t(this.hass, this._failed ? "no_episodes" : "loading")}</p>`
        : !season.episodes.length
          ? html`<p class="muted">${t(this.hass, "no_episodes")}</p>`
          : html`<ul class="card episodes">
              ${season.episodes.map((e) => {
                const leaving = e.expires && new Date(e.expires).getTime() - now < LEAVING_SOON;
                return html`<li>
                  <button @click=${() => openThek(this, { series: this.seasonId, episode: e.id })}>
                    <div class="thumb">
                      ${e.image ? html`<img src=${e.image} alt="" loading="lazy" />` : nothing}
                      <span class="play">${playIcon()}</span>
                    </div>
                    <div class="text">
                      <div class="name">
                        ${e.episode !== null ? t(this.hass, "episode_title", { number: e.episode, title: e.title }) : e.title}
                      </div>
                      <div class="muted meta">
                        ${[
                          e.duration ? `${formatNumber(this.hass, Math.round(e.duration / 60))} min` : "",
                          leaving ? t(this.hass, "thek_until", { date: until.format(new Date(e.expires!)) }) : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      ${e.description ? html`<p class="desc">${e.description}</p>` : nothing}
                    </div>
                  </button>
                </li>`;
              })}
            </ul>`}
    </div>`;
  }

  static styles = [
    shared,
    css`
      .content {
        max-width: 1200px;
        margin: 0 auto;
      }
      .back {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 12px 0 6px;
        border: 0;
        border-radius: 18px;
        background: none;
        color: var(--wt-primary);
        font: inherit;
        font-weight: 500;
        cursor: pointer;
      }
      .back:hover {
        background: var(--wt-primary-soft);
      }
      .head {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .head h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 500;
      }
      .seasons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      .chip {
        min-width: 36px;
        height: 32px;
        padding: 0 12px;
        border-radius: 16px;
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
      .episodes {
        list-style: none;
        margin: 0;
        padding: 4px 0;
      }
      .episodes li + li {
        border-top: 1px solid var(--wt-line);
      }
      .episodes button {
        width: 100%;
        display: flex;
        gap: 16px;
        align-items: flex-start;
        padding: 12px 16px;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .episodes button:hover {
        background: var(--wt-chip);
      }
      .thumb {
        position: relative;
        flex: none;
        width: 200px;
        aspect-ratio: 16 / 9;
        border-radius: 8px;
        overflow: hidden;
        background: rgba(127, 127, 127, 0.18);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .play {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background: rgba(0, 0, 0, 0.35);
        opacity: 0;
        transition: opacity 0.2s;
      }
      .episodes button:hover .play,
      .episodes button:focus-visible .play {
        opacity: 1;
      }
      .text {
        flex: 1;
        min-width: 0;
      }
      .name {
        font-weight: 500;
      }
      .meta {
        font-size: 12.5px;
        margin-top: 2px;
      }
      .desc {
        margin: 6px 0 0;
        font-size: 13.5px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      @media (max-width: 640px) {
        .thumb {
          width: 120px;
        }
        .desc {
          -webkit-line-clamp: 2;
        }
      }
    `,
  ];
}

customElements.define("waipu-mediathek-series", WaipuMediathekSeries);

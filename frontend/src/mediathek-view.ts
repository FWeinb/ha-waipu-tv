// A Mediathek title's or episode's page: the shared player (player.ts) and the details, with the
// way back. An episode (opened with its season) also lists the series' episodes beside the player,
// any season's, to switch to, and has Next episode in the player. Titles play from their start with
// their length on the timeline; the player uses the browser's DRM system where it has one.

import { LitElement, css, html, nothing, type PropertyValues } from "lit";

import {
  fetchMediathekContent,
  fetchMediathekSeries,
  type Channel,
  type HomeAssistant,
  type MediathekContent,
  type MediathekEpisode,
  type MediathekSeries,
} from "./api";
import { formatNumber, t } from "./i18n";
import { backIcon } from "./icons";
import { videoButtons, type PlaySource } from "./player";
import { shared } from "./styles";
import { openThek, thekBack } from "./util";
import "./player";

class WaipuMediathekView extends LitElement {
  static properties = {
    hass: { attribute: false },
    contentId: { attribute: false },
    seasonId: { attribute: false },
    channels: { attribute: false },
    audioLanguage: { attribute: false },
    _content: { state: true },
    _source: { state: true },
    _series: { state: true },
    _listed: { state: true },
  };

  declare hass: HomeAssistant;
  declare contentId: string;
  /** An episode's season ("<collection>:<category>"); unset for a film or other single title. */
  declare seasonId?: string;
  /** To show the title's channel logo when the account has the channel. */
  declare channels: Channel[];
  declare audioLanguage: string | null;
  declare _content?: MediathekContent;
  declare _source?: PlaySource;
  declare _series?: MediathekSeries;
  /** The season shown in the episode list; starts as the episode's own. */
  declare _listed?: string;
  private _scrolled?: string;

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("contentId")) {
      this._content = undefined;
      this._source = { stream: { mediathek: this.contentId }, drm: "optional", name: "" };
      this._loadContent(this.contentId);
    }
    if (changed.has("seasonId")) {
      this._listed = this.seasonId;
      if (!this.seasonId) this._series = undefined;
      else this._loadSeries(this.seasonId);
    }
  }

  protected updated() {
    // the playing episode in view in the list, once per episode
    if (!this._series || this._scrolled === this.contentId) return;
    const list = this.renderRoot.querySelector<HTMLElement>(".episodes");
    const current = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (list && current) {
      list.scrollTop = current.offsetTop - list.offsetTop - 8;
      this._scrolled = this.contentId;
    }
  }

  private async _loadContent(id: string) {
    try {
      const content = await fetchMediathekContent(this.hass, id);
      if (id === this.contentId) this._content = content;
    } catch {
      // the details are extra information; playback works without them
    }
  }

  private async _loadSeries(seasonId: string) {
    try {
      const series = await fetchMediathekSeries(this.hass, seasonId);
      if (seasonId === this.seasonId) this._series = series;
    } catch {
      // without the list the episode still plays
    }
  }

  /** The series' episodes in order, each with its season's id. */
  private _episodes(): [string, MediathekEpisode][] {
    return (this._series?.seasons ?? []).flatMap((s) => s.episodes.map((e): [string, MediathekEpisode] => [s.id, e]));
  }

  private _play(seasonId: string, episode: MediathekEpisode) {
    // replaces this page, so Back goes to where the series was opened
    openThek(this, { series: seasonId, episode: episode.id }, true);
  }

  private _label(e: MediathekEpisode) {
    return e.episode !== null ? t(this.hass, "episode_title", { number: e.episode, title: e.title }) : e.title;
  }

  protected render() {
    const content = this._content;
    const series = this._series;
    const all = this._episodes();
    const index = all.findIndex(([, e]) => e.id === this.contentId);
    const episode = index >= 0 ? all[index][1] : undefined;
    const next = index >= 0 ? all[index + 1] : undefined;
    const channel = this.channels.find((c) => c.id === content?.station_id);
    const minutes = (seconds: number) => `${formatNumber(this.hass, Math.round(seconds / 60))} min`;
    const seasonLabel = episode?.season !== null && episode?.season !== undefined ? t(this.hass, "season_n", { number: episode.season }) : "";
    const title = episode ? this._label(episode) : (content?.title ?? "");
    const sub = series
      ? [series.title, seasonLabel, episode?.duration ? minutes(episode.duration) : ""]
      : [content?.channel, content?.genre, content?.duration ? minutes(content.duration) : ""];

    return html`<div class=${this.seasonId ? "content with-list" : "content"}>
      <button class="back" @click=${() => thekBack(this)}>${backIcon()}${t(this.hass, "back")}</button>
      <div class="layout">
        <div class="main">
          <waipu-player
            .hass=${this.hass}
            .source=${this._source}
            .audioLanguage=${this.audioLanguage}
            .logo=${channel?.logo}
            .heading=${series?.title ?? content?.title ?? ""}
            .subheading=${series ? [seasonLabel, title].filter(Boolean).join(" · ") : (content?.channel ?? "")}
          >
            ${next
              ? html`<button slot="controls" class="pill" @click=${() => this._play(next[0], next[1])}>
                  ${t(this.hass, "next_episode")}
                </button>`
              : nothing}
          </waipu-player>
          <div class="card info">
            <h2>${title}</h2>
            ${sub.some(Boolean) ? html`<div class="muted sub">${sub.filter(Boolean).join(" · ")}</div>` : nothing}
            ${(episode?.description ?? content?.description)
              ? html`<p>${episode?.description ?? content?.description}</p>`
              : nothing}
          </div>
        </div>
        ${this.seasonId ? this._renderList(series) : nothing}
      </div>
    </div>`;
  }

  private _renderList(series: MediathekSeries | undefined) {
    const season = series?.seasons.find((s) => s.id === this._listed) ?? series?.seasons[0];
    return html`<aside class="card">
      <div class="list-head">
        <div class="series">${series?.title ?? ""}</div>
        ${series && series.seasons.length > 1
          ? html`<select
              aria-label=${t(this.hass, "seasons")}
              @change=${(e: Event) => (this._listed = (e.target as HTMLSelectElement).value)}
            >
              ${series.seasons.map(
                (s) => html`<option value=${s.id} ?selected=${s.id === season?.id}>
                  ${s.season !== null ? t(this.hass, "season_n", { number: s.season }) : s.title}
                </option>`,
              )}
            </select>`
          : nothing}
      </div>
      <ul class="episodes">
        ${!series
          ? html`<li class="note">${t(this.hass, "loading")}</li>`
          : !season?.episodes.length
            ? html`<li class="note">${t(this.hass, "no_episodes")}</li>`
            : season.episodes.map(
                (e) => html`<li>
                  <button aria-current=${e.id === this.contentId} @click=${() => e.id !== this.contentId && this._play(season.id, e)}>
                    <div class="thumb">${e.image ? html`<img src=${e.image} alt="" loading="lazy" />` : nothing}</div>
                    <div class="meta">
                      <div>${this._label(e)}</div>
                      <div>${e.duration ? `${formatNumber(this.hass, Math.round(e.duration / 60))} min` : ""}</div>
                    </div>
                  </button>
                </li>`,
              )}
      </ul>
    </aside>`;
  }

  static styles = [
    shared,
    videoButtons,
    css`
      .content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .content.with-list {
        max-width: 1600px;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }
      .with-list .layout {
        grid-template-columns: minmax(0, 1fr) 340px;
      }
      .main {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
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
        white-space: pre-line;
      }
      .list-head {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 12px 8px;
      }
      .series {
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
      .episodes {
        list-style: none;
        margin: 0;
        padding: 0 0 8px;
        max-height: 640px;
        overflow-y: auto;
      }
      .episodes button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px 8px 9px;
        border: 0;
        border-left: 3px solid transparent;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .episodes button:hover {
        background: var(--wt-chip);
      }
      .episodes button[aria-current="true"] {
        background: var(--wt-primary-soft);
        border-left-color: var(--wt-primary);
      }
      .thumb {
        flex: none;
        width: 96px;
        aspect-ratio: 16 / 9;
        border-radius: 4px;
        overflow: hidden;
        background: rgba(127, 127, 127, 0.18);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .meta div:first-child {
        font-weight: 500;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .meta div:last-child {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .note {
        padding: 10px 12px 4px 15px;
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      @media (max-width: 1100px) {
        .with-list .layout {
          grid-template-columns: minmax(0, 1fr);
        }
        .episodes {
          max-height: none;
        }
      }
      @media (max-width: 640px) {
        .content {
          padding: 12px 0;
        }
        .back,
        .info,
        aside {
          margin: 0 12px;
        }
      }
    `,
  ];
}

customElements.define("waipu-mediathek-view", WaipuMediathekView);

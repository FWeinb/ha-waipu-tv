// The waipu.tv sidebar panel: guide, watch (the player, also for favorites), recordings and (for
// admins) playlists.

import { LitElement, css, html, nothing } from "lit";

import {
  fetchChannels,
  fetchRecordings,
  type ChannelsResult,
  type HomeAssistant,
  type RecordingsResult,
} from "./api";
import { t } from "./i18n";
import { refreshIcon } from "./icons";
import { shared } from "./styles";
import type { WatchTarget } from "./util";
import "./guide-tab";
import "./playlists-tab";
import "./player-view";
import "./recordings-tab";

type Tab = "guide" | "watch" | "recordings" | "playlists";

const LAST_WATCHED = "waipu-tv.last-watched";

class WaipuTvPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    route: { attribute: false },
    _tab: { state: true },
    _channels: { state: true },
    _recordings: { state: true },
    _watch: { state: true },
    _toast: { state: true },
  };

  declare hass: HomeAssistant;
  declare narrow: boolean;
  /** From Home Assistant: the path below the panel's URL, e.g. "/watch/rtl". */
  declare route?: { prefix: string; path: string };
  declare _tab: Tab;
  declare _channels?: ChannelsResult;
  declare _recordings?: RecordingsResult;
  declare _watch?: WatchTarget; // the player replaces the tab while set; follows the URL
  declare _toast?: string;
  private _loaded = false;
  private _watchPath?: string;
  private _toastTimer?: number;

  constructor() {
    super();
    this._tab = "guide";
    this.addEventListener("waipu-changed", (e) => this._reload((e as CustomEvent).detail.what));
    this.addEventListener("waipu-toast", (e) => this._showToast((e as CustomEvent).detail.message));
    this.addEventListener("waipu-watch", (e) => {
      const target: WatchTarget | null = (e as CustomEvent).detail.target;
      const path = !target
        ? ""
        : "recording" in target
          ? `/recording/${encodeURIComponent(target.recording.id)}`
          : `/watch/${encodeURIComponent(target.channel)}${target.fromStart ? "/from-start" : ""}`;
      // switching inside the player replaces the history entry, so Back leaves the player
      this._navigate(path, !!target && !!this._watch);
      window.scrollTo(0, 0);
    });
  }

  protected willUpdate() {
    if (this.hass && !this._loaded) {
      this._loaded = true;
      this._reload("channels");
      this._reload("recordings");
    }
    this._followRoute();
  }

  /** Deep links: /waipu-tv/watch/<channel>[/from-start] and /waipu-tv/recording/<id>; the Watch
   * tab's /waipu-tv/watch resumes what this browser watched last, else the first favorite. */
  private _followRoute() {
    const path = this.route?.path ?? "";
    if (path === "/watch") {
      if (!this._channels) return;
      let last: string | null = null;
      try {
        last = localStorage.getItem(LAST_WATCHED);
      } catch {
        // storage blocked: start with a favorite
      }
      const first = this._channels.channels.find((c) => c.favorite) ?? this._channels.channels[0];
      this._navigate(last ?? (first ? `/watch/${encodeURIComponent(first.id)}` : ""), true);
      return;
    }
    const match = path.match(/^\/(watch|recording)\/([^/]+)(\/from-start)?$/);
    if (!match) {
      this._watch = this._watchPath = undefined;
      return;
    }
    // built once per path, after the data it needs, so the player doesn't restart on reloads
    const [, kind, id, fromStart] = match;
    if (path === this._watchPath || !(kind === "watch" ? this._channels : this._recordings)) return;
    this._watchPath = path;
    try {
      localStorage.setItem(LAST_WATCHED, path);
    } catch {
      // only a convenience
    }
    if (kind === "watch") this._watch = { channel: decodeURIComponent(id), fromStart: !!fromStart };
    else {
      const recording = this._recordings!.recordings.find((r) => r.id === decodeURIComponent(id));
      this._watch = recording ? { recording } : undefined;
    }
  }

  /** A deep link whose data is still loading. */
  private _linkPending() {
    const path = this.route?.path ?? "";
    return (path === "/watch" || /^\/(watch|recording)\//.test(path)) && path !== this._watchPath;
  }

  /** Like Home Assistant's own navigation, so the URL, Back and bookmarks work. */
  private _navigate(path: string, replace = false) {
    const url = `${this.route?.prefix ?? "/waipu-tv"}${path}`;
    if (replace) history.replaceState(history.state, "", url);
    else history.pushState(null, "", url);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace } }));
  }

  private async _reload(what: "channels" | "recordings") {
    try {
      if (what === "channels") this._channels = await fetchChannels(this.hass);
      else this._recordings = await fetchRecordings(this.hass);
    } catch (err) {
      this._showToast(t(this.hass, "error", { message: (err as Error).message ?? String(err) }));
    }
  }

  private _showToast(message: string) {
    this._toast = message;
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = undefined), 4000);
  }

  private async _refresh() {
    this._showToast(t(this.hass, "refreshing"));
    await this.hass.callService("button", "press", { entity_id: "button.waipu_tv_refresh" });
    await Promise.all([this._reload("channels"), this._reload("recordings")]);
  }

  protected render() {
    if (!this.hass) return nothing;
    const tabs: Tab[] = ["guide", "watch", "recordings"];
    if (this.hass.user?.is_admin) tabs.push("playlists");
    return html`
      <header>
        <div class="row">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <h1>waipu.tv</h1>
          ${this._channels?.subscription
            ? html`<span class="pill">${this._channels.subscription}</span>`
            : nothing}
          <button class="icon-btn" title=${t(this.hass, "refresh")} aria-label=${t(this.hass, "refresh")} @click=${this._refresh}>
            ${refreshIcon()}
          </button>
        </div>
        <div class="tabs" role="tablist">
          ${tabs.map(
            (tab) => html`<button
              role="tab"
              aria-selected=${tab === "watch" ? !!this._watch : !this._watch && tab === this._tab}
              @click=${() => {
                if (tab === "watch") {
                  if (!this._watch) this._navigate("/watch");
                  return;
                }
                this._tab = tab;
                if (this._watch) this._navigate("");
              }}
            >
              ${t(this.hass, tab)}
            </button>`,
          )}
        </div>
      </header>
      ${this._watch
        ? html`<waipu-player
            .hass=${this.hass}
            .channels=${this._channels?.channels ?? []}
            .recordings=${this._recordings?.recordings ?? []}
            .instantRestart=${this._channels?.instant_restart ?? false}
            .target=${this._watch}
          ></waipu-player>`
        : this._linkPending()
          ? html`<p class="pending">${t(this.hass, "loading")}</p>`
          : this._renderTab()}
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
    `;
  }

  private _renderTab() {
    const channels = this._channels?.channels ?? [];
    const recordings = this._recordings?.recordings ?? [];
    switch (this._tab) {
      case "guide":
        return html`<waipu-guide-tab .hass=${this.hass} .channels=${channels} .recordings=${recordings}></waipu-guide-tab>`;
      case "recordings":
        return html`<waipu-recordings-tab .hass=${this.hass} .channels=${channels} .data=${this._recordings}></waipu-recordings-tab>`;
      case "playlists":
        return html`<waipu-playlists-tab .hass=${this.hass}></waipu-playlists-tab>`;
    }
  }

  static styles = [
    shared,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color);
      }
      header {
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, #fff);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .row {
        height: var(--header-height, 56px);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px 0 4px;
      }
      h1 {
        font-size: 20px;
        font-weight: 400;
        margin: 0 0 0 12px;
        flex: 1;
      }
      .pill {
        padding: 2px 10px;
        border-radius: 999px;
        background: var(--wt-chip);
        font-size: 12px;
        font-weight: 500;
      }
      .icon-btn {
        width: 44px;
        height: 44px;
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
        background: rgba(127, 127, 127, 0.16);
      }
      .tabs {
        display: flex;
        padding: 0 8px;
        overflow-x: auto;
      }
      .tabs button {
        height: 48px;
        padding: 0 20px;
        border: 0;
        background: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.8;
        border-bottom: 2px solid transparent;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
      }
      .tabs button[aria-selected="true"] {
        opacity: 1;
        border-bottom-color: currentColor;
      }
      .pending {
        padding: 16px;
        color: var(--secondary-text-color);
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: 24px;
        transform: translateX(-50%);
        background: #323232;
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 20;
        max-width: calc(100vw - 32px);
      }
    `,
  ];
}

customElements.define("waipu-tv-panel", WaipuTvPanel);

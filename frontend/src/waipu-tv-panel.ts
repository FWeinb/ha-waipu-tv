// The waipu.tv sidebar panel: guide, favorites, recordings and (for admins) playlists.

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
import "./favorites-tab";
import "./guide-tab";
import "./playlists-tab";
import "./recordings-tab";

type Tab = "guide" | "favorites" | "recordings" | "playlists";

class WaipuTvPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    _tab: { state: true },
    _channels: { state: true },
    _recordings: { state: true },
    _toast: { state: true },
  };

  declare hass: HomeAssistant;
  declare narrow: boolean;
  declare _tab: Tab;
  declare _channels?: ChannelsResult;
  declare _recordings?: RecordingsResult;
  declare _toast?: string;
  private _loaded = false;
  private _toastTimer?: number;

  constructor() {
    super();
    this._tab = "guide";
    this.addEventListener("waipu-changed", (e) => this._reload((e as CustomEvent).detail.what));
    this.addEventListener("waipu-toast", (e) => this._showToast((e as CustomEvent).detail.message));
  }

  protected willUpdate() {
    if (this.hass && !this._loaded) {
      this._loaded = true;
      this._reload("channels");
      this._reload("recordings");
    }
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
    const tabs: Tab[] = ["guide", "favorites", "recordings"];
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
            (tab) => html`<button role="tab" aria-selected=${tab === this._tab} @click=${() => (this._tab = tab)}>
              ${t(this.hass, tab)}
            </button>`,
          )}
        </div>
      </header>
      ${this._renderTab()}
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
    `;
  }

  private _renderTab() {
    const channels = this._channels?.channels ?? [];
    const recordings = this._recordings?.recordings ?? [];
    switch (this._tab) {
      case "guide":
        return html`<waipu-guide-tab .hass=${this.hass} .channels=${channels} .recordings=${recordings}></waipu-guide-tab>`;
      case "favorites":
        return html`<waipu-favorites-tab .hass=${this.hass} .channels=${channels}></waipu-favorites-tab>`;
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
        background: rgba(255, 255, 255, 0.18);
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

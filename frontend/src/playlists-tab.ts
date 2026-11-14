// Playlist and guide URLs for IPTV players (admins only: the URLs carry the access key).

import { LitElement, css, html, nothing } from "lit";

import { fetchPlaylists, type HomeAssistant, type PlaylistsResult } from "./api";
import { t } from "./i18n";
import { copyIcon } from "./icons";
import { shared } from "./styles";
import { toast } from "./util";

const ORDER = ["favorites", "all", "live", "vod", "recordings", "epg"] as const;

class WaipuPlaylistsTab extends LitElement {
  static properties = {
    hass: { attribute: false },
    _data: { state: true },
  };

  declare hass: HomeAssistant;
  declare _data?: PlaylistsResult;

  protected firstUpdated() {
    fetchPlaylists(this.hass)
      .then((data) => (this._data = data))
      .catch((err) => toast(this, t(this.hass, "error", { message: err.message ?? String(err) })));
  }

  private async _copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast(this, t(this.hass, "copied"));
    } catch {
      toast(this, t(this.hass, "copy_failed"));
    }
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
              : !Object.keys(data.urls).length
                ? html`<p>${t(this.hass, "no_url")}</p>`
                : html`<ul class="urls">
                    ${ORDER.map(
                      (name) => html`<li>
                        <div class="meta">
                          <div>${t(this.hass, `url_${name}`)}</div>
                          <div class="mono">${data.urls[name]}</div>
                        </div>
                        <button class="btn" @click=${() => this._copy(data.urls[name])}>
                          ${copyIcon()}${t(this.hass, "copy")}
                        </button>
                      </li>`,
                    )}
                  </ul>`}
        </div>
        ${data
          ? html`<div class="card-b actions">
              <a class="btn" href="/config/integrations/integration/waipu_tv">${t(this.hass, "open_options")}</a>
            </div>`
          : nothing}
      </div>
      <p class="muted note">${t(this.hass, "playlists_note")}</p>
    </div>`;
  }

  static styles = [
    shared,
    css`
      .card,
      .note {
        max-width: 760px;
      }
      .note {
        margin: 0;
        font-size: 12.5px;
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
    `,
  ];
}

customElements.define("waipu-playlists-tab", WaipuPlaylistsTab);

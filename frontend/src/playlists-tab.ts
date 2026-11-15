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
              : html`<ul class="urls">
                  ${ORDER.map((name) => {
                    // the address this browser uses, which players on the same network reach too
                    const url = location.origin + data.urls[name];
                    return html`<li>
                      <div class="meta">
                        <div>${t(this.hass, `url_${name}`)}</div>
                        <div class="mono">${url}</div>
                      </div>
                      <button class="btn" @click=${() => this._copy(url)}>
                        ${copyIcon()}${t(this.hass, "copy")}
                      </button>
                    </li>`;
                  })}
                </ul>`}
        </div>
        ${data
          ? html`<div class="card-b actions">
              <a class="btn" href="/config/integrations/integration/waipu_tv">${t(this.hass, "open_options")}</a>
            </div>`
          : nothing}
      </div>
      ${data?.enabled ? this._renderOptions(data) : nothing}
      <p class="muted note">${t(this.hass, "playlists_note")}</p>
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
      ["protocol", "auto | hls | dash", "auto", `${m3u}, recordings.m3u`, t(this.hass, "param_protocol")],
      ["timeshift", "0 | 1", fromOptions(data.defaults.timeshift), m3u, t(this.hass, "param_timeshift") + restart],
      ["hls_proxy", "0 | 1", fromOptions(data.defaults.hls_proxy), m3u, t(this.hass, "param_hls_proxy")],
      ["filter", "all | favorites | live | vod", "all", "epg.xml", t(this.hass, "param_filter")],
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

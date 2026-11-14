// Program details with Record, Record series, Cancel and the channel's favorite star.

import { LitElement, css, html, nothing } from "lit";

import {
  deleteRecordings,
  fetchProgram,
  record,
  setFavorite,
  type Channel,
  type HomeAssistant,
  type Program,
  type Recording,
} from "./api";
import { formatter, t } from "./i18n";
import { clockIcon, closeIcon, recIcon, starIcon } from "./icons";
import { shared } from "./styles";
import { attempt, changed, toast } from "./util";

class WaipuProgramDialog extends LitElement {
  static properties = {
    hass: { attribute: false },
    program: { attribute: false },
    channel: { attribute: false },
    recording: { attribute: false },
    _description: { state: true },
    _busy: { state: true },
  };

  declare hass: HomeAssistant;
  declare program: Program;
  declare channel?: Channel;
  declare recording?: Recording;
  declare _description?: string;
  declare _busy: boolean;

  constructor() {
    super();
    this._busy = false;
  }

  protected firstUpdated() {
    this.renderRoot.querySelector("dialog")!.showModal();
    fetchProgram(this.hass, this.program.id)
      .then((d) => (this._description = d.textContent?.descLong || d.textContent?.descShort || ""))
      .catch(() => (this._description = ""));
  }

  private _close() {
    this.renderRoot.querySelector("dialog")?.close();
  }

  private async _run(action: () => Promise<unknown>, message: string, what: "channels" | "recordings") {
    this._busy = true;
    const ok = await attempt(this, this.hass, action);
    this._busy = false;
    if (ok) {
      changed(this, what);
      toast(this, message);
      if (what === "recordings") this._close();
    }
  }

  protected render() {
    const p = this.program;
    const start = new Date(p.start).getTime();
    const stop = new Date(p.stop).getTime();
    const now = Date.now();
    const time = formatter(this.hass, { hour: "2-digit", minute: "2-digit" });
    const date = formatter(this.hass, { weekday: "long", day: "numeric", month: "long" });
    const live = start <= now && now < stop;
    const ended = stop <= now;
    const rec = this.recording;
    const fav = this.channel?.favorite ?? false;

    return html`<dialog @close=${() => this.dispatchEvent(new CustomEvent("closed"))}>
      <div class="dlg-h">
        ${this.channel ? html`<img class="logo" src=${this.channel.logo} alt="" />` : nothing}
        <div class="meta">
          <div class="muted small">${this.channel?.name ?? p.channel_id}</div>
          <h3>${p.title}</h3>
          <div class="muted small">
            ${date.format(start)}, ${time.format(start)}–${time.format(stop)}
            ${p.episode_title ? html` · ${p.episode_title}` : nothing}
          </div>
        </div>
        ${this.channel
          ? html`<button
              class="star-btn"
              aria-pressed=${fav}
              title=${t(this.hass, fav ? "remove_favorite" : "add_favorite")}
              aria-label=${t(this.hass, fav ? "remove_favorite" : "add_favorite")}
              ?disabled=${this._busy}
              @click=${() =>
                this._run(
                  () => setFavorite(this.hass, this.channel!.id, !fav),
                  t(this.hass, fav ? "favorite_removed" : "favorite_added", { name: this.channel!.name }),
                  "channels",
                )}
            >
              ${starIcon()}
            </button>`
          : nothing}
        <button class="icon-btn" aria-label=${t(this.hass, "close")} @click=${this._close}>${closeIcon()}</button>
      </div>
      <div class="dlg-b">
        <div class="toolbar">
          ${live ? html`<span class="chip live"><span class="dot"></span>${t(this.hass, "live")}</span>` : nothing}
          ${ended ? html`<span class="chip">${t(this.hass, "ended")}</span>` : nothing}
          ${rec?.status === "RECORDING" ? html`<span class="chip rec">${recIcon()}${t(this.hass, "rec")}</span>` : nothing}
          ${rec?.status === "SCHEDULED"
            ? html`<span class="chip sched">${clockIcon(14)}${t(this.hass, "scheduled")}</span>`
            : nothing}
          ${p.genre ? html`<span class="chip">${p.genre}</span>` : nothing}
        </div>
        ${live
          ? html`<div class="progress"><div style="width:${((now - start) / (stop - start)) * 100}%"></div></div>`
          : nothing}
        ${p.image ? html`<img class="still" src=${p.image} alt="" />` : nothing}
        <p>${this._description ?? t(this.hass, "loading")}</p>
        ${!p.recordable ? html`<p class="muted small">${t(this.hass, "not_recordable")}</p>` : nothing}
      </div>
      <div class="dlg-a">
        ${rec
          ? html`<button
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() =>
                this._run(
                  () => deleteRecordings(this.hass, [rec.id]),
                  t(this.hass, "recording_cancelled"),
                  "recordings",
                )}
            >
              ${t(this.hass, "cancel_recording")}
            </button>`
          : nothing}
        ${!rec && !ended && p.recordable && p.series_id
          ? html`<button
              class="btn"
              ?disabled=${this._busy}
              @click=${() =>
                this._run(
                  () => record(this.hass, p.id, true),
                  t(this.hass, "series_started", { title: p.title }),
                  "recordings",
                )}
            >
              ${t(this.hass, "record_series")}
            </button>`
          : nothing}
        ${!rec && !ended && p.recordable
          ? html`<button
              class="btn primary"
              ?disabled=${this._busy}
              @click=${() =>
                this._run(
                  () => record(this.hass, p.id),
                  t(this.hass, "recording_started", { title: p.title }),
                  "recordings",
                )}
            >
              ${recIcon()}${t(this.hass, "record")}
            </button>`
          : nothing}
      </div>
    </dialog>`;
  }

  static styles = [
    shared,
    css`
      dialog {
        border: 0;
        border-radius: 20px;
        padding: 0;
        width: min(560px, calc(100vw - 32px));
        background: var(--wt-card);
        color: var(--wt-fg);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.45);
      }
      .small {
        font-size: 13px;
      }
      .dlg-h {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 20px 12px 8px 24px;
      }
      .dlg-h .meta {
        flex: 1;
        min-width: 0;
      }
      h3 {
        margin: 0;
        font-size: 22px;
        font-weight: 400;
      }
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .icon-btn:hover {
        background: var(--wt-chip);
      }
      .dlg-b {
        padding: 4px 24px 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .dlg-b p {
        margin: 0;
      }
      .still {
        width: 100%;
        border-radius: 12px;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        background: var(--wt-chip);
      }
      .progress {
        height: 4px;
        border-radius: 2px;
        background: var(--wt-chip);
        overflow: hidden;
      }
      .progress > div {
        height: 100%;
        background: var(--wt-primary);
      }
      .dlg-a {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
        padding: 12px 16px 20px;
      }
    `,
  ];
}

customElements.define("waipu-program-dialog", WaipuProgramDialog);

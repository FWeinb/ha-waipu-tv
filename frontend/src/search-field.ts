// A search that is a round icon button until clicked, then the input field; an empty field closes
// again when left, Escape clears and closes it. Fires "value-changed" with { value }.

import { LitElement, css, html } from "lit";

import { searchIcon } from "./icons";
import { shared } from "./styles";

class WaipuSearch extends LitElement {
  static properties = {
    label: {},
    value: {},
    _open: { state: true },
  };

  declare label: string;
  declare value: string;
  declare _open: boolean;

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this._open = false;
  }

  protected render() {
    if (!this._open && !this.value) {
      return html`<button class="btn search-btn" title=${this.label} aria-label=${this.label} @click=${this._expand}>
        ${searchIcon()}
      </button>`;
    }
    return html`<label class="search">
      ${searchIcon()}
      <input
        type="search"
        placeholder=${this.label}
        .value=${this.value}
        @input=${(e: Event) => this._change((e.target as HTMLInputElement).value)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key !== "Escape") return;
          this._change("");
          (e.target as HTMLInputElement).blur();
        }}
        @blur=${() => (this._open = false)}
      />
    </label>`;
  }

  private async _expand() {
    this._open = true;
    await this.updateComplete;
    this.renderRoot.querySelector("input")?.focus();
  }

  private _change(value: string) {
    this.value = value;
    this.dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
  }

  static styles = [
    shared,
    css`
      :host {
        display: flex;
        min-width: 0;
      }
      .search {
        width: 240px;
        max-width: 100%;
      }
      .search-btn {
        width: 36px;
        padding: 0;
        justify-content: center;
      }
    `,
  ];
}

customElements.define("waipu-search", WaipuSearch);

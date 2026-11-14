// Shared styles. Colors come from Home Assistant's theme variables, so the panel follows the
// user's theme and dark mode; the layout follows mockups/homeassistant.html.

import { css } from "lit";

export const shared = css`
  :host {
    --wt-card: var(--card-background-color, #fff);
    --wt-fg: var(--primary-text-color, #212121);
    --wt-muted: var(--secondary-text-color, #616161);
    --wt-line: var(--divider-color, #e0e0e0);
    --wt-chip: var(--secondary-background-color, #f1f3f4);
    --wt-primary: var(--primary-color, #0277bd);
    --wt-on-primary: var(--text-primary-color, #fff);
    --wt-primary-soft: rgba(var(--rgb-primary-color, 2, 119, 189), 0.14);
    --wt-rec: var(--error-color, #c62828);
    --wt-rec-soft: rgba(var(--rgb-error-color, 198, 40, 40), 0.14);
    --wt-sched: var(--warning-color, #b45309);
    --wt-sched-soft: rgba(var(--rgb-warning-color, 180, 83, 9), 0.14);
    --wt-fav: var(--state-icon-active-color, #b7791f);
    color: var(--wt-fg);
  }
  * {
    box-sizing: border-box;
  }
  [hidden] {
    display: none !important;
  }
  button,
  input {
    font: inherit;
    color: inherit;
  }
  svg.i {
    width: 20px;
    height: 20px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .muted {
    color: var(--wt-muted);
  }
  .mono {
    font-family: var(--code-font-family, ui-monospace, monospace);
    font-size: 12.5px;
  }
  .content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1600px;
  }
  .card {
    background: var(--wt-card);
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    border: 1px solid var(--wt-line);
  }
  .card-h {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 16px 8px;
    flex-wrap: wrap;
  }
  .card-h h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    flex: 1;
    min-width: 12em;
  }
  .card-b {
    padding: 8px 16px 16px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--wt-line);
    border-radius: 999px;
    overflow: hidden;
  }
  .seg button {
    border: 0;
    background: none;
    padding: 0 14px;
    height: 36px;
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--wt-line);
  }
  .seg button[aria-pressed="true"] {
    background: var(--wt-primary-soft);
    color: var(--wt-primary);
    font-weight: 500;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    border-radius: 18px;
    border: 1px solid var(--wt-line);
    background: var(--wt-card);
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    color: var(--wt-fg);
  }
  .btn:hover {
    background: var(--wt-chip);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .btn.primary {
    background: var(--wt-primary);
    color: var(--wt-on-primary);
    border-color: var(--wt-primary);
  }
  .btn.danger {
    color: var(--wt-rec);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border-radius: 18px;
    border: 1px solid var(--wt-line);
    background: var(--wt-card);
    min-width: 0;
    flex: 0 1 260px;
  }
  .search input {
    border: 0;
    outline: 0;
    background: none;
    min-width: 0;
    flex: 1;
  }
  .search:focus-within {
    border-color: var(--wt-primary);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border-radius: 14px;
    background: var(--wt-chip);
    font-size: 12.5px;
    white-space: nowrap;
  }
  .chip.rec {
    background: var(--wt-rec-soft);
    color: var(--wt-rec);
    font-weight: 500;
  }
  .chip.sched {
    background: var(--wt-sched-soft);
    color: var(--wt-sched);
    font-weight: 500;
  }
  .chip.live {
    background: var(--wt-primary-soft);
    color: var(--wt-primary);
    font-weight: 500;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    display: inline-block;
  }
  .star-btn {
    width: 36px;
    height: 36px;
    border: 0;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--wt-muted);
    flex: none;
  }
  .star-btn:hover {
    background: var(--wt-chip);
  }
  .star-btn[aria-pressed="true"] {
    color: var(--wt-fav);
  }
  .star-btn[aria-pressed="true"] svg {
    fill: currentColor;
  }
  .logo {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex: none;
    object-fit: contain;
    background: var(--wt-chip);
  }
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--wt-primary);
  }
  @media (max-width: 640px) {
    .content {
      padding: 12px;
    }
  }
`;

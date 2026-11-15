import { svg } from "lit";

const icon = (paths: ReturnType<typeof svg>, size = 20) =>
  svg`<svg class="i" viewBox="0 0 24 24" style="width:${size}px;height:${size}px" aria-hidden="true">${paths}</svg>`;

export const refreshIcon = () => icon(svg`<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>`);
export const clockIcon = (size = 20) =>
  icon(svg`<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`, size);
export const searchIcon = () => icon(svg`<circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/>`);
export const closeIcon = () => icon(svg`<path d="M6 6l12 12M18 6 6 18"/>`);
export const trashIcon = () =>
  icon(svg`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`);
export const copyIcon = () =>
  icon(svg`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`);
export const starIcon = () =>
  icon(svg`<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>`);
export const playIcon = () =>
  svg`<svg class="i" viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;stroke:none" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`;
export const backIcon = () => icon(svg`<path d="M15 6l-6 6 6 6"/>`);
export const upIcon = () => icon(svg`<path d="M6 15l6-6 6 6"/>`);
export const downIcon = () => icon(svg`<path d="M6 9l6 6 6-6"/>`);
export const restartIcon = (size = 16) =>
  icon(svg`<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/>`, size);
export const recIcon = (size = 14) =>
  svg`<svg class="i" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:currentColor;stroke:none" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>`;

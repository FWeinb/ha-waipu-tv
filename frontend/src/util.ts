import type { HomeAssistant, Recording } from "./api";
import { t } from "./i18n";

/** Ask the panel to reload data after a change. */
export function changed(el: HTMLElement, what: "channels" | "recordings") {
  el.dispatchEvent(new CustomEvent("waipu-changed", { detail: { what }, bubbles: true, composed: true }));
}

export function toast(el: HTMLElement, message: string) {
  el.dispatchEvent(new CustomEvent("waipu-toast", { detail: { message }, bubbles: true, composed: true }));
}

/** Run a change against waipu.tv; failures become a toast with Home Assistant's message. */
export async function attempt(el: HTMLElement, hass: HomeAssistant, action: () => Promise<unknown>) {
  try {
    await action();
    return true;
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    toast(el, t(hass, "error", { message }));
    return false;
  }
}

/** What the TV tab plays: a live channel (optionally from the running program's start) or a recording. */
export type WatchTarget = { channel: string; fromStart?: boolean } | { recording: Recording };

/** Ask the panel to open the TV tab's player, or to close it with null. */
export function watch(el: HTMLElement, target: WatchTarget | null) {
  el.dispatchEvent(new CustomEvent("waipu-watch", { detail: { target }, bubbles: true, composed: true }));
}

/** Mediathek pages: the library, a season of a series with its episodes (by the season's id), an
 * episode's player (the season's id and the episode's content id), or a title's player. */
export type ThekTarget = { browse: true } | { series: string; episode?: string } | { title: string };

export const thekPath = (target: ThekTarget) =>
  "title" in target
    ? `/mediathek/watch/${encodeURIComponent(target.title)}`
    : "series" in target
      ? `/mediathek/series/${encodeURIComponent(target.series)}${target.episode ? `/${encodeURIComponent(target.episode)}` : ""}`
      : "/mediathek";

/** Ask the panel to open a Mediathek page; replace: instead of the page shown (another season). */
export function openThek(el: HTMLElement, target: ThekTarget, replace = false) {
  el.dispatchEvent(new CustomEvent("waipu-thek", { detail: { target, replace }, bubbles: true, composed: true }));
}

/** Ask the panel to go back one Mediathek page, to the library when there's none. */
export function thekBack(el: HTMLElement) {
  el.dispatchEvent(new CustomEvent("waipu-thek-back", { bubbles: true, composed: true }));
}

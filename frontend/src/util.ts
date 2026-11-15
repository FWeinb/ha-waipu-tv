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

/** What the player shows: a live channel (optionally from the running program's start) or a recording. */
export type WatchTarget = { channel: string; fromStart?: boolean } | { recording: Recording };

/** Ask the panel to open the player, or to close it with null. */
export function watch(el: HTMLElement, target: WatchTarget | null) {
  el.dispatchEvent(new CustomEvent("waipu-watch", { detail: { target }, bubbles: true, composed: true }));
}

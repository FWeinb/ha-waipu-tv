import type { HomeAssistant } from "./api";
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

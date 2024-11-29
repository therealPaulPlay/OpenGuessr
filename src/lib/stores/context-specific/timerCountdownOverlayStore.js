import { writable } from "svelte/store";

export const timerCountdownOverlay = writable(false);
export const timerCountdownOverlayTitle = writable("Default title");
export const timerCountdownOverlaySubtitle = writable("Default subtitle");
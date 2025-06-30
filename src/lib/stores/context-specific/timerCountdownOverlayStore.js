import { writable } from "svelte/store";

export const singleplayerTimer = writable();
export const timerCountdownOverlay = writable(false);
export const timerCountdownOverlayTitle = writable("Default title");
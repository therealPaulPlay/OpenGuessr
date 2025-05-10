import { writable } from "svelte/store";

export const mapModeIndicatorVisible = writable(false);
export const leaveFunction = writable(false);
export const modeText = writable("No info");
export const timerText = writable("00:00");
export const indicatorFading = writable(false);
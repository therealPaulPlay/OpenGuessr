import { writable } from "svelte/store";

export const leaveFunction = writable(false);
export const timerText = writable(null);
export const mapModeIndicatorFading = writable(false);
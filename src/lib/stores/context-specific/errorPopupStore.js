import { writable } from "svelte/store";

export const popupOpen = writable(false);
export const hideDisableOption = writable(true); // This will hide the "Don't show again" Option - Mostly for minor messages that are needed
export const hideErrors = writable(false); // False, if the user clicks on "Don't Show again" Option (ignored for critical errors) it will become true
export const title = writable("");
export const description = writable("");
export const errorCode = writable("");
export const reload = writable(false);
import { writable } from "svelte/store";

export const notificationMarginTop = writable(0);
export const notificationOpacity = writable(0);
export const notificationText = writable(false);
export const acceptText = writable("Accept");
export const showAcceptButton = writable(true);

export const acceptFunction = writable();
export const dismissFunction = writable();
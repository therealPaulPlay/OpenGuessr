import { writable } from "svelte/store";

export const notificationVisible = writable(false);
export const notificationText = writable("Default");
export const acceptText = writable("Accept");
export const clickableText = writable();

export const textClickFunction = writable();
export const acceptFunction = writable();
export const dismissFunction = writable();
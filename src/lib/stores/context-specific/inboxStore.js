import { writable } from "svelte/store";

export const inboxContent = writable();
export const inboxIconNew = writable(false);
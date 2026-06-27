import { writable } from "svelte/store";

export const matchData = writable();
export const historyForUserId = writable(null);
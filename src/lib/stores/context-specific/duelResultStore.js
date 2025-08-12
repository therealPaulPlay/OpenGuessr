import { writable } from "svelte/store";

export const eloChange = writable(0);
export const tokenGain = writable(0);
export const duelResultTitle = writable("Default title");
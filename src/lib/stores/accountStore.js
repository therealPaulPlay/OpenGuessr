import { writable } from "svelte/store";

export const isAuthenticated = writable(false);

export const supporterLevel = writable(0);
export const supportedAmount = writable(0);
export const freeSupporterBoostEnabled = writable(false);
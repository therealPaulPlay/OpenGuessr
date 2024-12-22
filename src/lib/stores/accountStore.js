import { writable } from "svelte/store";

export const isAuthenticated = writable(false);

// Supporter Data
export const supportedAmount = writable(0);
export const freeSupporterBoostEnabled = writable(false);

// Account Data
export const experience = writable(0);
export const supporterLevel = writable(0);
export const username = writable(); // No default name - Guest will be a fallback
export const selectedPinIndex = writable(0); // Number representing the selected pin
export const selectedBadge = writable(null);
export const elo = writable(1000);
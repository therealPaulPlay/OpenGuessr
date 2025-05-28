import { writable } from "svelte/store";

export const isAuthenticated = writable(false);

// Supporter Data
export const supportedAmount = writable(0);

// Account Data
export const experience = writable(0);
export const supporterLevel = writable(0);
export const username = writable(); // No default name - Guest will be a fallback
export const elo = writable(1000);

// Account Cosmetics
export const tokens = writable(0);
export const selectedPinIndex = writable(0); // Number representing the selected pin
export const selectedBadge = writable(null);
export const purchasedPins = writable([]);


// Moderation related
export const isBanned = writable(false);
export const isWarned = writable(false);

export const banReportEntryData = writable();
export const warnReportEntryData = writable();

export const checkedForBan = writable(false);
export const checkedForWarning = writable(false);
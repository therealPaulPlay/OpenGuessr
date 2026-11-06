import { writable } from "svelte/store";

export const isAuthenticated = writable(false);

// Supporter data
export const supportedAmount = writable(0);

// Account data
export const experience = writable(0);
export const supporterLevel = writable(0);
export const username = writable(null);
export const elo = writable(1000);

// State
export const accountDataLoaded = writable(false);

// Account cosmetics
export const tokens = writable(0);
export const selectedPinIndex = writable(0); // Number representing the selected pin
export const selectedBadge = writable(null);
export const purchasedPins = writable([]);

// Moderation related
export const warnReportEntryData = writable();
export const checkedForWarning = writable(false);

// Special stats
export const duelWinStreak = writable(0);

// Optional callback after signup (retry the account-only action the user wanted to do)
export const postSignupAction = writable();
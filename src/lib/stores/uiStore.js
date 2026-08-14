import { writable } from 'svelte/store';

// Misc UI Parts
export const navigationMenu = writable(false);
export const loadingScreenVisible = writable(true);
export const littleTimeVignetteVisible = writable(false);

// Popup Visibility
export const settingsPopup = writable(false);
export const signupPopup = writable(false);
export const profilePopup = writable(false);
export const pinPopup = writable(false);
export const flagPickerPopup = writable(false);
export const badgePopup = writable(false);
export const linkJoinPopup = writable(false);
export const friendBrowserPopup = writable(false);
export const inboxPopup = writable(false);
export const duelResultPopup = writable(false);
export const reportPopup = writable(false);
export const divisionMatchHistoryPopup = writable(false);
export const guestNamePickerPopup = writable(false);
export const bugspotPopup = writable(false);
export const roundLogPopup = writable(false);
export const tournamentInfoPopup = writable(false);
export const tournamentMatchResultsPopup = writable(false);
export const chatManagePopup = writable(false);
export const chatMobilePopup = writable(false);
export const matchOverviewPopup = writable(false);
export const messagesPopup = writable(false);
export const competitionResultPopup = writable(false);
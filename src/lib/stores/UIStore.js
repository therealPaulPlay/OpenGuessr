import { writable } from 'svelte/store';

// Misc UI Parts
export const loadingScreenVisible = writable(false);
export const littleTimeVignette = writable(false);

// Popup Visibility
export const settingsPopup = writable(false);
export const helpPopup = writable(false);
export const signupPopup = writable(false);
export const discordPopup = writable(false);
export const singleplayerOptionsPopup = writable(false);
export const profilePopup = writable(false);
export const pinPopup = writable(false);
export const badgePopup = writable(false);
export const troubleshootPopup = writable(false);
export const linkJoinPopup = writable(false);
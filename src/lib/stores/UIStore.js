import { writable } from 'svelte/store';

// Misc UI Parts
export const loadingScreenVisible = writable(false);
export const littleTimeVignette = writable(false);

// Popup Visibility
export const settingsPopup = writable(false);
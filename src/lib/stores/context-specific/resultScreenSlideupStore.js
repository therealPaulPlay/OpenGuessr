import { writable } from "svelte/store";

export const showSlideup = writable(false);
export const slideupTitle = writable("Default");
export const slideupText = writable("Default body text.");
export const slideupCallback = writable();
export const slideupButtonText = writable("Default");
export const slideupImageUrl = writable(null);
export const slideupNote = writable(null);

// Specific
export const monthlySupportAmount = writable();
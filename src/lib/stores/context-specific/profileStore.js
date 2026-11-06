import { writable } from "svelte/store";

// Loaded data
export const profileData = writable();
export const profileId = writable(-1);  // -1, so that this default cannot be a user

// Temp state
export const unsavedAboutChanges = writable(false); // Stores whether there are unsaved changes to the about text
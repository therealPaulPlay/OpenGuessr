import { writable } from "svelte/store";

export const profileData = writable();
export const profileId = writable(-1);  // -1, so that this default cannot be a user

export const unsavedAboutChanges = writable(false); // Stores whether there are unsaved changes to the about text
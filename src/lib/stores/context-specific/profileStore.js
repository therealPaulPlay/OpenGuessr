import { writable } from "svelte/store";

export const profileData = writable();
export const profileName = writable("Default User");
export const profileExperience = writable(0);
export const joinedDate = writable(0);
export const profileSupporterLevel = writable(0);
export const profileId = writable(-1);  // -1, so that this default cannot be a user
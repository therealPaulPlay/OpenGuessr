import { writable } from "svelte/store";

// Settings
export const isHost = writable(false);
export const coordsFromHost = writable([35.7072457, 139.863412]); // Default panorama to prevent black screen flash on e.g. link join
export const multiplayerCategory = writable("standard");
export const highestMultiplayerSupporterLevel = writable(0);

// Data
export const multiplayerGuessesLocationsArray = writable([]);
export const peerId = writable();

// UI
export const multiplayerStatus = writable("None set");
export const loadedFriendsData = writable();
export const currentScreen = writable("main");
export const hostStage = writable(1);
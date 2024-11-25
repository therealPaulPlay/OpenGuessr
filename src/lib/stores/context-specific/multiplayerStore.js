import { writable } from "svelte/store";

// Settings
export const isHost = writable(false);
export const coordsFromHost = writable([35.7072457, 139.863412]); // Default panorama to prevent black screen flash on e.g. link join
export const multiplayerCategory = writable("standard");
export const highestMultiplayerSupporterLevel = writable(0);

// Data
export const multiplayerGuessesLocationsArray = writable([]);
export const peerId = writable();
export const connectedClientsCount = writable(0); // Players in round connected to host (excluding host)
export const savedGuestName = writable("Guest (Default)");

// UI
export const multiplayerStatus = writable(); // Status for Duel, Join, Linjoin etc.
export const loadedFriendsData = writable();
export const currentScreen = writable("main");
export const hostStage = writable(1);
export const screenEscapeDisabled = writable(false); // Set the Close and Back buttons disabled (e.g. when establishing connection)
export const duelRetryEnabled = writable(false);
export const restrictionButtonText = writable("Standard");
export const teamsDisplayText = writable(); // Displays all connected players and their teams, as a string

export const timeReducedOverlay = writable(false);
export const timeReducedOverlayText = writable("Default");

// Chat
export const chatHTML = writable(); // Inner Chat HTML
export const chatVisible = writable(false);
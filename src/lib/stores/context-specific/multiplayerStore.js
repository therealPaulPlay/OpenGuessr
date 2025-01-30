import { writable } from "svelte/store";

// Peer
export const peer = writable();

// Settings
export const roundAmount = writable(3);
export const roundLength = writable(60);
export const teamAmount = writable(1);

// Matchmaking and Duels
export const matchmakingActive = writable(false);

// Data
export const savedGuestName = writable("Guest (Default)");

// UI
export const multiplayerStatus = writable(); // Status for Duel, Join, Linjoin etc.
export const loadedFriendsData = writable();
export const currentScreen = writable("main");
export const hostStage = writable(1);
export const screenEscapeDisabled = writable(false); // Set the Close and Back buttons disabled (e.g. when establishing connection)
export const duelRetryEnabled = writable(false);
export const restrictionButtonText = writable("Standard");

// UI - Host
export const connectionCount = writable(0);
export const teamsDisplayText = writable("");
export const roomcode = writable("loading...");

// UI - Time reduced Overlay for Duels
export const timeReducedOverlay = writable(false);
export const timeReducedOverlayText = writable("Default");

// UI - Multiplayer Overlay (Table Overlay)
export const multiplayerOverlay = writable(false);
export const multiplayerOverlayTitle = writable("Default Title");
export const overlayTitleElement = writable(); // Used for animations
export const multiplayerTableArray = writable([]); // Array used for the table in the overlay (with all players ranked by XP etc.)
export const overlayShowSubtitle = writable(false);

export const rematchButtonVisible = writable(false);
export const leaveMatchButtonVisible = writable(false);

// UI - Chat
export const chatArray = writable(); // Inner Chat HTML
export const chatVisible = writable(false);
export const remainingPlayers = writable([]);
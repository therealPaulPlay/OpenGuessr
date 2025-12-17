import { writable } from "svelte/store";

// Peer
export const socket = writable();

// Settings
export const roundAmount = writable(3);
export const roundLength = writable(60);
export const teamAmount = writable(1);
export const multiplayerRestriction = writable("standard");

// Style
export const multiplayerStyle = writable("standard");

// Matchmaking and Duels
export const matchmakingActive = writable(false);
export const skillBasedMatchmaking = writable(false);
export const matchmakingHosting = writable(false);

// Guest-exclusive
export const guestName = writable("Guest (Default)");
export const guestNamePromise = writable();

// UI
export const multiplayerStatus = writable(); // Status for Duel, Join, Linjoin etc.
export const loadedFriendsData = writable();
export const currentScreen = writable("main");
export const hostStage = writable(1);
export const screenEscapeDisabled = writable(false); // Set the Close and Back buttons disabled (e.g. when establishing connection)
export const duelRetryEnabled = writable(false);
export const currentRound = writable(0);
export const multiplayerMap = writable(null);

// UI - Host
export const connectionCount = writable(0);
export const roomcode = writable(null);

// UI - Time reduced Overlay for Duels
export const timeReducedOverlay = writable(false);

// UI - Multiplayer Overlay (Table Overlay)
export const multiplayerOverlay = writable(false);
export const multiplayerOverlayTitle = writable("Default Title");
export const overlayTitleElement = writable(); // Used for animations
export const multiplayerTableArray = writable([]); // Array used for the table in the overlay (with all players ranked by XP etc.)
export const multiplayerSortedPlayersArray = writable([]);
export const overlayShowSubtitle = writable(false);

export const rematchButtonVisible = writable(false);
export const leaveMatchButtonVisible = writable(false);

// UI - Chat
export const chatArray = writable([]); // Chat messages
export const mobileChatLastOpenedMsgCount = writable(0); // Chat msg maount as the player on mobile has last seen it (display "new message" otherwise)
export const chatVisible = writable(false);
export const chatMutedPlayers = writable([]);
export const remainingPlayers = writable([]);
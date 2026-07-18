import { get, writable } from "svelte/store";
import { defaultRestriction } from "./restrictionStore";

// Client
export const socket = writable();

// Settings
export const roundAmount = writable(3);
export const roundLength = writable(60);
export const teamAmount = writable(1);
export const multiplayerRestriction = writable(get(defaultRestriction));
export const multiplayerStyle = writable("standard");

// Matchmaking and Duels
export const matchmakingActive = writable(false);
export const skillBasedMatchmaking = writable(false);
export const matchmakingHosting = writable(false);
export const cancellingMatchmaking = writable(false);

// If matchmaking is disabled, also disable hosting
matchmakingActive.subscribe((value) => {
    if (!value) matchmakingHosting.set(false);
});

// Guest-exclusive
export const guestName = writable("Guest (Default)");
export const guestNamePromise = writable();

// UI
export const multiplayerStatus = writable(); // Status for Duel, Join, Linjoin etc.
export const loadedFriendsData = writable();
export const currentRound = writable(0);
export const multiplayerMap = writable(null);

// UI - Host
export const participantCount = writable(0);
export const roomCode = writable(null);

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
export const roomLocked = writable(false);
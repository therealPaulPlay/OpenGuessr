import { get, writable } from "svelte/store";
import { defaultRestriction } from "./restrictionStore";
import { defaultMap } from "./officialMapsStore";

// Client
export const socket = writable();

// Token to verify socket ownership
export const clientToken = writable();

// Settings
export const roundAmount = writable(3);
export const roundLength = writable(60);
export const teamAmount = writable(1);
export const multiplayerRestriction = writable(get(defaultRestriction));
export const multiplayerStyle = writable("standard");

// Matchmaking
export const matchmakingActive = writable(false);
export const matchmakingHosting = writable(false); // The room for matchmaking is now being created (set to true right before createRoom is called)
export const matchmakingSubmitted = writable(false); // The room is submitted to the matchmaking queue (set to true after awaited submission)
export const cancellingMatchmaking = writable(false);
export const matchmakingEloRange = writable(null);
export const movingTeammate = writable(false);

// If matchmaking is disabled, also reset adjacent state
matchmakingActive.subscribe((value) => {
    if (!value) {
        matchmakingHosting.set(false);
        matchmakingSubmitted.set(false);
        matchmakingEloRange.set(null);
    }
});

// Guest-exclusive
export const guestName = writable("Guest (Default)");
export const guestNamePromise = writable();

// UI
export const multiplayerStatus = writable(); // Status for Duel, Join, Linjoin etc.
export const loadedFriendsData = writable();
export const currentRound = writable(0);
export const multiplayerMap = writable(get(defaultMap));

// UI - Host
export const participantCount = writable(0);
export const roomCode = writable(null);

// UI - Time reduced overlay for duels
export const timeReducedOverlay = writable(false);

// UI - Multiplayer Overlay (Table overlay)
export const multiplayerOverlay = writable(false);
export const multiplayerOverlayTitle = writable("Default Title");
export const multiplayerSortedPlayers = writable([]); // Player array used for moderation panel
export const multiplayerGroupedSortedPlayers = writable([]); // Player array used for the table in the overlay (grouped by teams)
export const overlayShowSubtitle = writable(false);
export const teamMoveClients = writable({});

export const rematchButtonVisible = writable(false);
export const playAnotherTeamDuelButtonVisible = writable(false);
export const leaveMatchButtonVisible = writable(false);

// UI - Chat
export const chatArray = writable([]); // Chat messages
export const mobileChatLastOpenedMsgCount = writable(0); // Chat msg maount as the player on mobile has last seen it (display "new message" otherwise)
export const chatVisible = writable(false);
export const chatMutedPlayers = writable([]);
export const remainingPlayers = writable([]);
export const roomLocked = writable(false);

// Rejoin
export const rejoinRoomCode = writable();
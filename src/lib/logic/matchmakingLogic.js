// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, roomCode, matchmakingHosting, matchmakingSubmitted, multiplayerStyle, roundAmount, roundLength, teamAmount, socket, clientToken, matchmakingEloRange } from "$lib/stores/context-specific/multiplayerStore";
import { createMultiplayerRoom, leaveMultiplayer } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { isAuthenticated } from "$lib/stores/accountStore";
import { goto } from "$app/navigation";
import { signupPrompt } from "$lib/utils/signupPrompt";
import { showErrorPopup } from "openguessr-ui";
import { multiplayer } from "$lib/stores/modeStore";

// Logic -----------------------

const matchmakingRoomConfigs = {
    "division-duel": { teamAmount: 1, roundAmount: 5, sizeLimit: 2 },
    "team-duel": { teamAmount: 2, roundAmount: 5, sizeLimit: 4 },
}

// Safe cancel: remove from matchmaking queue - if removed, the server destroys the room
// which triggers instanceDestroyed -> leaveMultiplayer -> matchmakingActive = false; If not removed, the game was already matched
export async function safeCancel() {
    const code = get(roomCode);
    if (!code) return showErrorPopup("Failed to cancel", "The room hasn't been created yet.");

    try {
        const response = await fetch(get(apiUrl) + "/matchmaking/delete-room/" + code, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId: get(socket)?.id, clientToken: get(clientToken) }),
        });
        if (!response.ok) throw new Error(response.status);
        const data = await response.json();

        if (!data.removed) {
            multiplayerStatus.set("Room not in matchmaking, cannot cancel."); // Either the game was matched in between pressing "cancel" & the req resolving, or the code hasn't been submitted yet
            return;
        }
    } catch (error) {
        console.warn("Failed to remove room from matchmaking queue:", error);
        multiplayerStatus.set("Failed to cancel: " + (error?.message || error));
        return;
    }
}

// Division duel -----------------------

// This initiates the find duel system
export function findDuel() {
    const action = async () => {
        // There's a brief delay between goto("/") call and the page navigation, in which the user can click "Try again" even though a duel has been found,
        // which causes the multiplayer instance to recreate & the player to lose the game
        if (get(multiplayer)) return showErrorPopup("Already in multiplayer", "Finding a duel is only possible outside of multiplayer.");
        goto("/multiplayer/duel"); // Visit duel load page
        matchmakingActive.set(true);

        // Create & submit a room, which the server then pairs up with another queued room
        const created = await createMatchmakingRoom(matchmakingRoomConfigs["division-duel"]);
        if (created) await submitRoomCodeForMatchmaking("division-duel");
    };

    if (!get(isAuthenticated)) signupPrompt(action);
    else action();
}

// Team duel (2v2) -----------------------

export function createTeamDuelRoom() {
    goto("/multiplayer/team-duel");
    return createMatchmakingRoom(matchmakingRoomConfigs["team-duel"]);
}

export async function startFindTeamDuel() {
    if (get(matchmakingActive)) return;
    matchmakingActive.set(true);

    // Submit room code and look for a match if successful
    if (await submitRoomCodeForMatchmaking("team-duel")) attemptFindTeamDuel();
}

// Shared -----------------------

function createMatchmakingRoom(roomOptions) {
    if (!roomOptions || !roomOptions.roundAmount || roomOptions.teamAmount == null) return console.error("Provided room options are lacking:", JSON.stringify(roomOptions));

    // Set standard matchmaking room options
    multiplayerStyle.set("duel");
    roundLength.set(60);

    // Set customizable options
    teamAmount.set(roomOptions.teamAmount);
    roundAmount.set(roomOptions.roundAmount);

    // Set hosting enabled
    matchmakingHosting.set(true);

    // Create room and submit code for matchmaking (and return promise)
    return createMultiplayerRoom(roomOptions.sizeLimit, true);
}

async function submitRoomCodeForMatchmaking(type) {
    multiplayerStatus.set("Submitting code...");

    const data = await submitRoomCode(type);
    if (!data) {
        matchmakingActive.set(false);
        leaveMultiplayer();
        return false;
    } else {
        if (data.eloRange) matchmakingEloRange.set({ ...data.eloRange, receivedAt: Date.now() });
        matchmakingSubmitted.set(true);
        multiplayerStatus.set("Waiting for players...");
        return true;
    }
}

// API --------------------------

// The server forms the match by moving all involved players into one of the queued rooms
async function attemptFindTeamDuel() {
    try {
        const response = await fetch(get(apiUrl) + "/matchmaking/find-team-duel", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: get(roomCode), clientToken: get(clientToken) })
        });
        if (!response.ok) throw new Error(response.status);

    } catch (error) {
        // Ignore if the room left the queue in the meantime (somebody else matched it, or matchmaking was cancelled)
        if (!get(matchmakingActive)) return;

        // Leave, since the room code is still in the server's matchmaking queue (this also sets matchmakingActive to false)
        leaveMultiplayer();

        // Display error
        console.error("Error finding match:", error);
        showErrorPopup("Failed to find a team duel", "An error occurred finding a team duel.", error.message);
    }
}

export async function submitRoomCode(type) {
    if (!type) {
        console.error("Room type must be specified for submitting a code!");
        return false;
    }
    try {
        if (get(roomCode) == null) {
            console.warn("Room code not loaded, not sending room code to server.");
            return false;
        }
        const requestBody = {
            clientId: get(socket)?.id,
            clientToken: get(clientToken),
            type,
        }
        if (localStorage.getItem("id") != null) requestBody.id = localStorage.getItem("id");

        const headers = {
            "Content-Type": "application/json",
        }
        if (localStorage.getItem("bearer")) headers.Authorization = "Bearer " + localStorage.getItem("bearer");

        const response = await fetch(get(apiUrl) + "/matchmaking/submit-room/" + get(roomCode), {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(response.status);
        return await response.json(); // Success (return response data)

    } catch (error) {
        console.error('Failed sending room code to server: ', error);
        showErrorPopup("Failed to submit code", "Failed to submit the room code, which is needed for matchmaking.", error.message);
        return false; // Error (return false)
    }
}

export async function setMatchmakingEloRange(lower, upper, paused = false) {
    try {
        const response = await fetch(get(apiUrl) + "/matchmaking/set-elo-range/" + get(roomCode), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId: get(socket)?.id, clientToken: get(clientToken), lower, upper, paused }),
        });
        if (!response.ok) throw new Error(response.status);
    } catch (error) {
        console.error("Failed to set matchmaking range:", error);
        showErrorPopup("Failed to set range", "An error occurred setting the elo matchmaking range.", error.message);
    }
}

export async function fetchOpenRooms() {
    try {
        const response = await fetch(get(apiUrl) + "/matchmaking/all-rooms-of-type/open-room");

        if (response.ok) {
            const data = await response.json();
            return data || [];
        } else {
            console.error("Failed to load open rooms: " + response.status);
        }
    } catch (error) {
        console.error("Failed to load open rooms (Network): ", error);
    }
}
// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, roomCode, matchmakingHosting, multiplayerStyle, roundAmount, roundLength, teamAmount, multiplayerMap, skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
import { createMultiplayerRoom, joinMultiplayerRoom, leaveMultiplayer } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { elo, isAuthenticated } from "$lib/stores/accountStore";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
import { goto } from "$app/navigation";
import { signupPrompt } from "$lib/utils/signupPrompt";
import { errorPopup } from "$lib/utils/errorHandling";
import { multiplayer } from "$lib/stores/modeStore";

// Logic -----------------------

const matchmakingRoomConfigs = {
    "division-duel": { teamAmount: 1, roundAmount: 5, divisionRoom: true, sizeLimit: 2 },
    "team-duel": { teamAmount: 2, roundAmount: 5, divisionRoom: false, sizeLimit: 4 },
}

// Safe cancel: remove from matchmaking queue - if removed, the server destroys the room
// which triggers instanceDestroyed -> leaveMultiplayer -> matchmakingActive = false; If not removed, the game was already matched
export async function safeCancel() {
    const code = get(roomCode);
    if (!code) return console.warn("safeCancel called without a room code!");

    try {
        const response = await fetch(get(apiUrl) + "/matchmaking/delete-room/" + code, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({ id: localStorage.getItem("id") }),
        });
        if (!response.ok) throw new Error(response.status);
        const data = await response.json();

        if (!data.removed) {
            multiplayerStatus.set("Room not in matchmaking, cannot cancel."); // Game has started in between player pressing "cancel" & req resolving
            return;
        }

        if (findTeamDuelActive) clearFindTeamDuelInterval(); // Stop polling
    } catch (error) {
        console.warn("Failed to remove room from matchmaking queue:", error);
        multiplayerStatus.set("Failed to cancel: " + (error?.message || error));
        return;
    }
}

// Division duel -----------------------

let roomIndex = 0;

// This initiates the find duel system
export async function findDuel() {
    if (!get(isAuthenticated)) return signupPrompt();
     // There's a brief delay between goto("/") call and the page navigation, in which the user can click "Try again" even though a duel has been found, 
     // which causes the multiplayer instance to recreate & the player to lose the game
    if (get(multiplayer)) return errorPopup("Already in multiplayer", "Finding a duel is only possible outside of multiplayer.");
    goto("/multiplayer/duel"); // Visit duel load page
    roomIndex = 0; // Reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive.set(true);
    attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
}

// This occurs when the multiplayer system's connect/join returns an error
function findNextDuel() {
    if (!get(matchmakingActive)) return; // Exit the loop if matchmaking was disabled
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
    } else {
        matchmakingActive.set(false);
        multiplayerStatus.set("Couldn't connect to any room.");
    }
}

// Team duel (2v2) -----------------------

let findTeamDuelInterval = null;
let findTeamDuelActive = false;

export function createTeamDuelRoom() {
    if (!get(isAuthenticated)) return signupPrompt();
    goto("/multiplayer/team-duel");
    return createMatchmakingRoom("team-duel", false, matchmakingRoomConfigs["team-duel"]);
}

export async function startFindTeamDuel() {
    if (findTeamDuelActive) return;
    findTeamDuelActive = true;
    matchmakingActive.set(true);

    // Submit room code and start find team interval if successful,
    // otherwise reset active variable
    const success = await submitRoomCodeForMatchmaking("team-duel", false);
    if (success) attemptTeamDuelFind();
    else findTeamDuelActive = false;
}

export function clearFindTeamDuelInterval() {
    findTeamDuelActive = false;
    if (findTeamDuelInterval) {
        clearInterval(findTeamDuelInterval);
        findTeamDuelInterval = null;
    }
}
// Shared -----------------------

function createMatchmakingRoom(type, skillBased, roomOptions) {
    if (skillBased === undefined) return console.warn("Skill-based argument not defined!");
    if (!roomOptions || !roomOptions.roundAmount || roomOptions.teamAmount == null || roomOptions.divisionRoom == null) return console.error("Provided room options are lacking:", JSON.stringify(roomOptions));

    // Set standard matchmaking room options
    multiplayerStyle.set("duel");
    roundLength.set(60);
    multiplayerMap.set(get(defaultMap))

    // Set customizable options
    teamAmount.set(roomOptions.teamAmount);
    roundAmount.set(roomOptions.roundAmount);

    // Set hosting enabled
    matchmakingHosting.set(true);

    // Create room and submit code for matchmaking (and return promise)
    return createMultiplayerRoom(roomOptions.sizeLimit, true, roomOptions.divisionRoom);
}

async function submitRoomCodeForMatchmaking(type, skillBased) {
    multiplayerStatus.set("Submitting code...");

    const success = await submitRoomCode(type, skillBased);
    if (!success) {
        matchmakingActive.set(false);
        leaveMultiplayer();
        return false;
    } else {
        multiplayerStatus.set("Waiting for players...");
        return true;
    }
}

// API --------------------------

// This function attempts to get a room code from the server and to join the room
async function attemptDuelJoin(index, skillBased) {
    index == 0 ? multiplayerStatus.set("Requesting roomcode...") : multiplayerStatus.set("Requesting new roomcode...");
    let receivedRoomCode;

    try {
        // Get Roomcode from server
        const response = await fetch(get(apiUrl) + "/matchmaking/get-room/" + index, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Bearer " + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                type: "division-duel",
                elo: get(elo),
                skillBased
            }),
        });

        if (response.ok) receivedRoomCode = await response.json().then(data => data.code);
        if (!response.ok) throw new Error(response.status);

        // Attempt to join if there is a code, otherwise create room
        if (receivedRoomCode) {
            const success = await joinMultiplayerRoom(receivedRoomCode);
            if (!success) findNextDuel(); // Code exists but failed to join -> check next code
        } else {
            // Status will be set in this function
            const success = await createMatchmakingRoom("division-duel", skillBased, matchmakingRoomConfigs["division-duel"]);
            if (success) await submitRoomCodeForMatchmaking("division-duel", skillBased);
        }

    } catch (error) {
        console.error('Error fetching room code: ', error);
        multiplayerStatus.set("Couldn't fetch code: " + (error?.message || error));
        matchmakingActive.set(false);
    }
}

async function attemptTeamDuelFind() {
    try {
        const response = await fetch(get(apiUrl) + "/matchmaking/find-team-duel", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("bearer")
            },
            body: JSON.stringify({ id: localStorage.getItem("id") })
        });

        if (!response.ok) throw new Error(response.status);

        const data = await response.json();
        if (data.matched) clearFindTeamDuelInterval();
        else if (!findTeamDuelInterval && findTeamDuelActive) findTeamDuelInterval = setInterval(attemptTeamDuelFind, 5000); // Start polling (if still active / matchmaking wasn't cancelled)

    } catch (error) {
        if (!findTeamDuelActive) return; // Request arrived after match/cancel, ignore (match can start without a client ever calling this endpoint since submitting & waiting for sb else to call it also works)

        // Cancel interval and leave since the room code is still in the server's matchmaking queue (this also sets matchmakingActive to false)
        clearFindTeamDuelInterval();
        leaveMultiplayer();

        // Display error
        console.error("Error finding team duel:", error);
        errorPopup("Failed to find a team duel", "The request returned an error.", error.message);
    }
}

export async function submitRoomCode(type, skillBased = false, map = get(defaultMap)) {
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
            id: localStorage.getItem("id"),
            type,
            skillBased,
            map
        }

        const response = await fetch(get(apiUrl) + "/matchmaking/submit-room/" + get(roomCode), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(response.status);
        return true; // Success

    } catch (error) {
        console.error('Failed sending room code to server: ', error);
        errorPopup("Failed to submit code", "Failed to submit the room code, which is needed for matchmaking.", error.message);
        return false; // Error
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
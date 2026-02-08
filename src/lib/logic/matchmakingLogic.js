// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, roomcode, matchmakingHosting, multiplayerStyle, roundAmount, roundLength, divisionRoom, teamAmount, multiplayerMap, multiplayerRestriction, skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
import { createMultiplayerRoom, joinMultiplayerRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { elo } from "$lib/stores/accountStore";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
import { goto } from "$app/navigation";
import { signupPrompt } from "$lib/utils/signupPrompt";

// Logic -----------------------

let roomIndex = 0;

const matchmakingRoomConfigs = {
    "ranked-duel": { teamAmount: 1, roundAmount: 5, divisionRoom: true, sizeLimit: 2 },
    "team-duel": { teamAmount: 2, roundAmount: 5, divisionRoom: false, sizeLimit: 4 },
}

// This initiates the find duel system
export async function findDuel() {
    if (!get(isAuthenticated)) return signupPrompt();
    goto("/multiplayer/duel"); // Visit duel load page
    roomIndex = 0; // Reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive.set(true);
    attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
}

// This occurs when the multiplayer system's connect/join returns an error
function findNextDuel() {
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
    } else {
        matchmakingActive.set(false);
        multiplayerStatus.set("Couldn't connect to any room.");
    }
}

export function createTeamDuelRoom() {
    goto("/multiplayer/team-duel");
    return createMatchmakingRoom("team-duel", false, matchmakingRoomConfigs["team-duel"]);
}

async function createMatchmakingRoom(type, skillBased, roomOptions) {
    if (skillBased === undefined) return console.warn("Skill-based argument not defined!");
    if (!roomOptions || !roomOptions.roundAmount || roomOptions.teamAmount == null || roomOptions.divisionRoom == null) return console.error("Provided room options are lacking:", JSON.stringify(roomOptions));

    // Set room options
    multiplayerStyle.set("duel");
    teamAmount.set(roomOptions.teamAmount);
    roundAmount.set(roomOptions.roundAmount);
    roundLength.set(60);
    divisionRoom.set(roomOptions.divisionRoom);
    multiplayerMap.set(get(defaultMap))

    // Create room and submit code for matchmaking
    await createMultiplayerRoom(roomOptions.sizeLimit);
    if (get(matchmakingActive)) multiplayerStatus.set("Waiting for opponent..."); // Wait status
    matchmakingHosting.set(true);
    return submitRoomCode(type, skillBased);
}

// API --------------------------

// This function attempts to get a room code from the server and to join the room
async function attemptDuelJoin(index, skillBased) {
    index == 0 ? multiplayerStatus.set("Requesting roomcode...") : multiplayerStatus.set("Requesting new roomcode...");
    let receivedRoomCode;

    try {
        // Get Roomcode from server
        const response = await fetch(get(apiUrl) + "/matchmaking/join-room/" + index, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Bearer " + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                type: "ranked-duel",
                elo: get(elo),
                skillBased
            }),
        });

        if (response.ok) receivedRoomCode = await response.json().then(data => data.code);
        if (!response.ok) throw new Error(response.status);

        // Attempt to join if there is a code, otherwise create room
        if (receivedRoomCode) {
            const success = joinMultiplayerRoom(receivedRoomCode);
            if (!success) findNextDuel(); // Code exists but failed to join -> check next code
        } else {
            // Status will be set in this function
            createMatchmakingRoom("ranked-duel", skillBased, matchmakingRoomConfigs["ranked-duel"]);
        }

    } catch (error) {
        console.error('Error fetching room code: ', error);
        multiplayerStatus.set("Couldn't fetch room code: " + error);
        matchmakingActive.set(false);
    }
}

export async function submitRoomCode(type, skillBased = false, map = get(defaultMap)) {
    if (!type) return console.error("Room type must be specified for submitting a code!");
    try {
        if (get(roomcode)?.includes("loading")) return console.warn("Room code not loaded, not sending room code to server.");
        const requestBody = {
            id: localStorage.getItem("id"),
            type,
            skillBased,
            map
        }

        const response = await fetch(get(apiUrl) + "/matchmaking/host-room/" + get(roomcode), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(response.status);

    } catch (error) {
        console.error('Failed sending room code to server: ', error);
        multiplayerStatus.set("Error submitting room code: " + error);
        matchmakingActive.set(false);
    }
}

let lastOpenRoomCode;

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
        console.error("Failed ro load open rooms (Network): ", error);
    }
}

// Misc -------------

// If matchmaking is no longer active, also disable matchmakingHosting
matchmakingActive.subscribe((value) => {
    if (!value) matchmakingHosting.set(false);
});
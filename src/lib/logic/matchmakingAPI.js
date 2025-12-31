// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, screenEscapeDisabled, roomcode, matchmakingHosting, multiplayerStyle } from "$lib/stores/context-specific/multiplayerStore";
import { setupMultiplayerRoom, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { elo } from "$lib/stores/accountStore";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";

// This function attempts to get a room code from the server and to join the room
export async function attemptRoomJoin(index, type = "ranked-duel", skillBased) {
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
                type,
                elo: get(elo),
                skillBased
            }),
        });

        if (response.ok) receivedRoomCode = await response.json().then(data => data.code);
        if (!response.ok) throw new Error(response.status);

        // Attempt to join if there is a code, otherwise create room
        if (receivedRoomCode) joinRoom(receivedRoomCode); // Status will be set in this function
        else {
            multiplayerStyle.set("duel"); // Set style to duel
            await setupMultiplayerRoom(5, 60, 2, true);
            submitRoomCode("ranked-duel", skillBased);
            matchmakingHosting.set(true);
        }

    } catch (error) {
        console.error('Error fetching room code: ', error);
        multiplayerStatus.set("Couldn't fetch room code: " + error);
        matchmakingActive.set(false);
    }
}

export async function submitRoomCode(type = "ranked-duel", skillBased, map = get(defaultMap)) {
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

matchmakingActive.subscribe((value) => {
    screenEscapeDisabled.set(value);
    if (!value) matchmakingHosting.set(false);
});
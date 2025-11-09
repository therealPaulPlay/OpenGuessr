// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, screenEscapeDisabled, roomcode, matchmakingHosting, multiplayerStyle } from "$lib/stores/context-specific/multiplayerStore";
import { setupMultiplayerRoom, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { elo } from "$lib/stores/accountStore";

export async function deleteRoomCodeFromMatchmakingServer() {
    if (!get(roomcode)) return console.warn("Can't delete room code from server as it is null.");
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        }

        const response = await fetch(get(apiUrl) + "/rooms/delete-duel/" + get(roomcode), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.warn("Failed deleting the Room Code from the server: " + response.status);
            multiplayerStatus.set("Error deleting roomcode from server: " + response.status);
        }

    } catch (error) {
        console.error('Failed making a delete request to the server: ', error);
        multiplayerStatus.set("Error making a request to server: " + error);
    }
}

// This function attempts to get a room code from the server and to join the room
export async function attemptDuelJoin(index, skillBased) {
    index == 0 ? multiplayerStatus.set("Requesting roomcode...") : multiplayerStatus.set("Requesting new roomcode...");
    let receivedRoomCode;

    try {
        // Get Roomcode from server
        const response = await fetch(get(apiUrl) + "/rooms/join-duel/" + index + `?elo=${get(elo)}&skill-based=${skillBased ?? false}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Bearer " + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({ id: localStorage.getItem("id") }),
        });

        if (response.ok) receivedRoomCode = await response.json().then(data => data.code);
        if (!response.ok) throw new Error(response.status);

        // Attempt to join if there is a code, otherwise create room
        if (receivedRoomCode) joinRoom(receivedRoomCode); // Duel status will be set in this function
        else {
            multiplayerStyle.set("duel"); // Set style to duel
            await setupMultiplayerRoom(5, 60, 2, true);
            sendRoomCodeToMatchmakingServer(skillBased);
            matchmakingHosting.set(true); // Enable hosting
        }

    } catch (error) {
        console.error('Error fetching room code: ', error);
        multiplayerStatus.set("Couldn't fetch room code: " + error);
        matchmakingActive.set(false);
    }
}

async function sendRoomCodeToMatchmakingServer(skillBased) {
    try {
        if (get(roomcode)?.includes("loading")) return console.warn("Room code not loaded, not sending room code to server.");
        const requestBody = {
            id: localStorage.getItem("id"),
            skillBased
        }

        const response = await fetch(get(apiUrl) + "/rooms/host-duel/" + get(roomcode), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            setTimeout(() => {
                if (get(matchmakingActive)) sendRoomCodeToMatchmakingServer(skillBased);
            }, 10000); // After 10 seconds, resubmit as code will expire
        } else {
            throw new Error(response.status);
        }

    } catch (error) {
        console.error('Failed sending room code to server: ', error);
        multiplayerStatus.set("Error submitting room code: " + error);
        matchmakingActive.set(false);
    }
}

matchmakingActive.subscribe((value) => {
    screenEscapeDisabled.set(value);
    if (!value) matchmakingHosting.set(false);
});
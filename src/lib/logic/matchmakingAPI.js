// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, screenEscapeDisabled, roomcode } from "$lib/stores/context-specific/multiplayerStore";
import { changeCategory } from "$lib/utils/changeCategory";
import { leaveMultiplayerRound, setupMultiplayerRoom, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { elo } from "$lib/stores/accountStore";

export async function deleteRoomCodeFromMatchmakingServer() {
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        }

        const response = await fetch(get(accountUrl) + "/accounts/rooms/delete-duel/" + get(roomcode), {
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
        const response = await fetch(get(accountUrl) + "/accounts/rooms/join-duel/" + index + `?elo=${get(elo)}&skill-based=${skillBased ?? false}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Bearer " + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({ id: localStorage.getItem("id") }),
        });

        if (response.ok) {
            receivedRoomCode = await response.json();
            receivedRoomCode = receivedRoomCode.code?.replace("openguessr_", "");
        } else {
            console.error('Error fetching room code:', response.status);
            multiplayerStatus.set("Bad Get Request response: " + response.status);
            matchmakingActive.set(false);
        }

    } catch (error) {
        console.error('Error occurred when trying to fetch room code: ', error);
        multiplayerStatus.set("Couldn't send get request");
        matchmakingActive.set(false); // if there is no sever response, stop the matchmaking process
    }

    // Attempt to join if there is a code, otherwise create room
    if (receivedRoomCode != null) {
        joinRoom(receivedRoomCode); // Duel status will be set in this function as well

    } else if (receivedRoomCode == null) {
        // Create room
        if (localStorage.getItem("selectedCategory") && localStorage.getItem("selectedCategory") !== "standard") await changeCategory("standard", true); // Regenerate to update the bounds (await to ensure bounds are ready)
        await setupMultiplayerRoom(5, 60, 2);
        sendRoomCodeToMatchmakingServer(skillBased);
    }
}

async function sendRoomCodeToMatchmakingServer(skillBased) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            skillBased
        }

        const response = await fetch(get(accountUrl) + "/accounts/rooms/host-duel/" + get(roomcode), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            setTimeout(() => {
                if (get(matchmakingActive)) {
                    leaveMultiplayerRound(); // Sets matchmaking active to false & destroys peer, which calls the delete room code function
                    multiplayerStatus.set("No match found. Please retry.");
                }
            }, 10000); // After 10 seconds, as the room code is now expired, leave the multiplayer round and show the retry button

        } else {
            console.error("Failed sending the Room Code to the server: " + response.status);
            multiplayerStatus.set("Error sending roomcode to server: " + response.status);
            matchmakingActive.set(false);
        }

    } catch (error) {
        console.error('Failed making a post request to the server: ', error);
        multiplayerStatus.set("Error making a request to server: " + error);
        matchmakingActive.set(false);
    }
}

matchmakingActive.subscribe((value) => {
    screenEscapeDisabled.set(value);
});
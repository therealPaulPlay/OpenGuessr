// Multiplayer room matchmaking APIs, for Duels
import { matchmakingActive, multiplayerStatus, screenEscapeDisabled, roomcode } from "$lib/stores/context-specific/multiplayerStore";
import { changeCategory } from "$lib/utils/changeCategory";
import { leaveMultiplayerRound, setupMultiplayerRoom, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";

export async function deleteRoomCodeFromMatchmakingServer() {
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        }

        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/delete-duel/" + get(roomcode).replace("openguessr_", ""), {
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
export async function attemptDuelJoin(index) {
    index == 0 ? multiplayerStatus.set("Requesting roomcode...") : multiplayerStatus.set("Requesting new roomcode...");
    let receivedRoomCode = "default";

    try {
        // Get Roomcode from server
        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/join-duel/" + index, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            receivedRoomCode = await response.json();
            receivedRoomCode = receivedRoomCode.code;
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
    if (receivedRoomCode != null && receivedRoomCode != "default") {
        joinRoom(receivedRoomCode); // duel find status will be set in this function as well
    } else if (receivedRoomCode == null) {
        // Create room & hide close + back button for the time
        screenEscapeDisabled.set(true);

        if (localStorage.getItem("selectedCategory") && localStorage.getItem("selectedCategory") !== "standard") await changeCategory("standard", true); // Regenerate to update the bounds (await to ensure bounds are ready)
        await setupMultiplayerRoom(5, 60, 2);
        sendRoomCodeToMatchmakingServer();
    }
}

async function sendRoomCodeToMatchmakingServer() {
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        }

        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/host-duel/" + get(roomcode).replace("openguessr_", ""), {
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
    if (!value) screenEscapeDisabled.set(false);
});
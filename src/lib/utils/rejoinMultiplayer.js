import { browser } from "$app/environment";
import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
import { isAuthenticated } from "$lib/stores/accountStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { rejoinRoomCode, roomCode, socket } from "$lib/stores/context-specific/multiplayerStore";
import { rejoinPopup } from "$lib/stores/uiStore";
import { get } from "svelte/store";
import { showErrorPopup } from "openguessr-ui";

let initialCall = true; // Triggers once on pageload, we only care about when it changes
roomCode.subscribe((value) => {
    if (!browser) return;
    if (initialCall) return initialCall = false;
    if (value && get(isAuthenticated)) persistActiveRoom();
    else localStorage.removeItem("rejoinRoom");
});

function persistActiveRoom() {
    const data = {
        code: get(roomCode),
        oldClientId: get(socket)?.id,
    }
    localStorage.setItem("rejoinRoom", JSON.stringify(data));
}

export async function checkRejoin(interactive = true) {
    const data = localStorage.getItem("rejoinRoom");

    if (data) {
        let parsedData;
        try { parsedData = JSON.parse(data); } catch { return localStorage.removeItem("rejoinRoom") };
        const { code } = parsedData;

        // Clear the active room so that on further reloads it does not prompt the user again
        localStorage.removeItem("rejoinRoom");

        // Ask server whether this room still exists, and ensure it has more participants (not just the player's old client)
        try {
            const response = await fetch(get(apiUrl) + "/matchmaking/can-rejoin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("bearer")
                },
                body: JSON.stringify({
                    ...parsedData,
                    id: localStorage.getItem("id")
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || response.status);
            }

            const data = await response.json();
            if (!data.rejoinable) return; // If the room can't be rejoined, exit (e.g. if the room no longer exists)

        } catch (error) {
            console.error("Failed to check if room is rejoinable:", error);
            return showErrorPopup("Error checking rejoin", "An error occurred checking whether the previous multiplayer room can be rejoined.", error.message);
        }

        // Open the rejoin popup and inform the user
        if (interactive) {
            rejoinRoomCode.set(code);
            rejoinPopup.set(true);
        } else joinFromAnywhere(code);
    }
}
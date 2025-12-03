import { showNotification } from "$lib/utils/notifications";
import { username } from "$lib/stores/accountStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

export async function sendFriendRequest(targetUserId, button) {
    try {
        if (!targetUserId) return;

        const requestBody = {
            id: localStorage.getItem("id"),
            senderId: localStorage.getItem("id"),
            recipientId: targetUserId
        };

        const response = await fetch(get(apiUrl) + "/friends/send", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            showNotification("Friend request sent.");

            try {
                button.style.opacity = "0.5";
                button.style.pointerEvents = "none";
            } catch (error) {
                console.error("Error changing button style after friend request:", error);
            }

        } else {
            const data = await response.json();
            console.error("Error sending the friend request: " + response.status);
            errorPopup("Error sending friend request", "The server returned an error for your friend request.", response.status + " - " + data.error);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending the friend request:', error);
        errorPopup("Network error sending friend request", "The friend request couldn't be sent.", error);
    }
}
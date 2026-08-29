import { showNotification } from "$lib/utils/notifications";
import { errorPopup } from "$lib/utils/errorHandling";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

export async function sendFriendRequest(targetUserId) {
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

        if (response.ok) showNotification("Friend request sent.");
        else {
            const data = await response.json();
            if (response.status === 409) return showNotification("Already sent a friend request.");
            console.error("Error sending the friend request: " + response.status);
            errorPopup("Error sending friend request", "The server returned an error for your friend request.", response.status + " - " + data.error);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending the friend request:', error);
        errorPopup("Network error sending friend request", "The friend request couldn't be sent.", error);
    }
}
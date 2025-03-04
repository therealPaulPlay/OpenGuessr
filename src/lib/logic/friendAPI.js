import { isAuthenticated, username } from "$lib/stores/accountStore";
import { showNotification } from "$lib/utils/notifications";
import { loadedFriendsData, multiplayerStatus, roomcode } from "$lib/stores/context-specific/multiplayerStore";
import { inboxContent } from "$lib/stores/context-specific/inboxStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { setPlayingDuels, setFriendDuel, setupMultiplayerRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { changeCategory } from "$lib/utils/changeCategory";
import { accountUrl, friendUrl } from "$lib/stores/context-specific/apiConfigStore";

// Inbox -----------------------------------------------------------------------------------------------------------------------------------
export async function loadInbox() {
    if (!get(isAuthenticated)) return;

    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch(get(friendUrl) + "/friends/requests", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            inboxContent.set(data?.requests);
            if (get(inboxContent).length == 0) inboxContent.set(undefined);

        } else {
            console.error("Error loading inbox: " + response.status);
            errorPopup("Error fetching inbox", "An error occured fetching the friend inbox.", response.status);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while loading inbox: ', error);
        errorPopup("Error fetching inbox (Network)", "An error occured fetching the friend inbox.", error);
    }
}

// accept friend request
export async function acceptFriendRequest(senderId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            senderId: senderId,
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch(get(friendUrl) + "/friends/accept", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            loadInbox();
            loadFriends();
        } else {
            const data = await response.json();
            console.error("Error accepting / deleting the friend request: " + response.status);
            errorPopup("Error accepting / deletingfriend request", "The server returned an error for your action.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Error occurred while sending the friend request (Network):', error);
        errorPopup("Network error accepting / deleting friend request", "The friend request couldn't be accepted or deleted.", error, false, false);
    }
}

// accept friend request
export async function declineFriendRequest(senderId) {
    try {

        const requestBody = {
            id: localStorage.getItem("id"),
            senderId: senderId,
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch(get(friendUrl) + "/friends/decline", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            loadInbox();
        } else {
            const data = await response.json();
            console.error("Error accepting / deleting the friend request: " + response.status);
            errorPopup("Error accepting / deletingfriend request", "The server returned an error for your action.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Error occurred while sending the friend request:', error);
        errorPopup("Error accepting / deleting friend request (Network)", "The friend request couldn't be accepted or deleted.", error, false, false);
    }
}

// Load friends ------------------------------------------------------------------------------------------------------------------------
export async function loadFriends() {
    if (!get(isAuthenticated)) return;

    try {
        const requestBody = {
            id: localStorage.getItem("id")
        };

        const response = await fetch(get(friendUrl) + "/friends/friends", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            loadedFriendsData.set(data.friends);
            if (get(loadedFriendsData)?.length == 0) loadedFriendsData.set(undefined);

        } else {
            console.error("Error loading friends: " + response.status);
        }

    } catch (error) {
        console.error('Error occurred while loading friends (Network): ', error);
    }
}

export async function removeFriend(friendId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friendId: friendId
        };

        const response = await fetch(get(friendUrl) + "/friends/remove", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            loadFriends();
        } else {
            const data = await response.json();
            console.error("Error removing friend: " + response.status);
            errorPopup("Error removing friend", "The server returned an error for your action.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while removing friend:', error);
        errorPopup("Error removing friend (Network)", "The friend request couldn't be accepted or deleted.", error, false, false);
    }
}

// Match invites -------------------------------------------------------------------------------------------------------------
export async function sendMatchInvite(recipientId, duel) {
    if (duel) {
        // If Duel, create a room first
        setPlayingDuels(true);
        setFriendDuel(true);
        linkJoinPopup.set(true);
        if (localStorage.getItem("selectedCategory") && localStorage.getItem("selectedCategory") !== "standard") await changeCategory("standard", true); // Regenerate to update the bounds (await to ensure bounds are ready)
        await setupMultiplayerRoom(5, 60, 2);
        multiplayerStatus.set("Waiting for response from friend...");
    }

    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friend_id: recipientId,
            roomcode: get(roomcode),
            senderName: get(username),
            isDuel: duel
        };

        const response = await fetch(get(accountUrl) + "/friends/send-invite", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            showNotification(`Invite sent.`);
        } else {
            const data = await response.json();
            console.error("Error sending invite: " + response.status + ", " + data.error);
            showNotification("User is not reachable.");
        }

    } catch (error) {
        console.error('Error occurred while sending/accepting/declining invite (Network):', error);
        errorPopup("Error sending invite (Network)", "The invite couldn't be sent due to a network problem.", error, false, false);
    }
}
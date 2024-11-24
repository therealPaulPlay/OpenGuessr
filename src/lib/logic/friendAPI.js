import { isAuthenticated } from "$lib/stores/accountStore";
import { showNotification } from "$lib/utils/notifications";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { peerId } from "$lib/stores/context-specific/multiplayerStore";
import { loadProfileFromId } from "$lib/utils/loadProfile";
import { inboxContent } from "$lib/stores/context-specific/inboxStore";
import { errorPopup } from "$lib/utils/errorHandling";

// Inbox -----------------------------------------------------------------------------------------------------------------------------------
export async function loadInbox() {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch("https://friends.openguessr.com/friends/requests", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            inboxContent.set(data);

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

        const response = await fetch("https://friends.openguessr.com/friends/accept", {
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
        console.error('Fetch/Network error occurred while sending the friend request: ', error);
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

        const response = await fetch("https://friends.openguessr.com/friends/decline", {
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
        console.error('Fetch/Network error occurred while sending the friend request: ', error);
        errorPopup("Network error accepting / deleting friend request", "The friend request couldn't be accepted or deleted.", error, false, false);
    }
}

// Load friends ------------------------------------------------------------------------------------------------------------------------
export async function loadFriends(animate) {
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        };

        const response = await fetch("https://friends.openguessr.com/friends/friends", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            try {
                const data = await response.json();

                let idCounter = 0;

                friendsContainer.innerHTML = "";

                data.friends.forEach(entry => {
                    idCounter++;

                    let newEntry = document.createElement("div");
                    newEntry.classList.add("friendItem");
                    newEntry.classList.add("standardButton");

                    let friendOnlineBar = entry.online ? `<div class="friendOnlineBar"></div>` : "";

                    newEntry.innerHTML = `
                    ${friendOnlineBar}
                    <p>${entry.user_name}</p>
                    <button id="duelFriend${idCounter}" class="standardButton friendItemButtons">
                        1v1
                    </button>
                    <button id="removeFriend${idCounter}" class="standardButton friendItemButtons">
                        <img alt="remove friend" class="friendRemoveIcon" src="/img/delete_icon.png">
                    </button>
                    `;

                    newEntry.id = "friendEntry" + idCounter;

                    friendsContainer.appendChild(newEntry);

                    document.getElementById("friendEntry" + idCounter).addEventListener("click", () => {
                        loadProfileFromId(entry.id, true);
                    });

                    document.getElementById("removeFriend" + idCounter).addEventListener("click", (e) => {
                        e.stopPropagation();
                        showConfirmPopup("Remove friend?", "You are about to remove your friend from your list. Your friend will see this and might not like it. Use this at our own risk.", () => {
                            removeFriend(entry.id);
                        });
                    });


                    document.getElementById("duelFriend" + idCounter).addEventListener("click", (e) => {
                        e.stopPropagation();
                        sendMatchInvite(entry.id, true);
                    });
                });

                setTimeout(() => {
                    friendsContainer.style.maxHeight = "";
                }, 50);

                if (!friendsContainer.innerHTML) {
                    friendContainerMessage.textContent = "You haven't added any friends.";
                    friendContainerMessage.style.display = "block";
                    document.getElementById("friendBox").style.display = "none";
                } else {
                    friendContainerMessage.style.display = "none";
                    document.getElementById("friendBox").style.display = "flex";
                }

            } catch (error) {
                console.error("In-Code error loading friends: " + error);
            }

        } else {
            console.error("Error loading friends: " + response.status);
            friendContainerMessage.textContent = "Error loading friends: " + response.status;
            friendContainerMessage.style.display = "block";
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while loading friends: ', error);
        friendContainerMessage.textContent = "An error occured loading your friends.";
        friendContainerMessage.style.display = "block";
    }
}

async function removeFriend(friendId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friendId: friendId
        };

        const response = await fetch("https://friends.openguessr.com/friends/remove", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            loadFriends(false);
        } else {
            const data = await response.json();
            console.error("Error removing friend: " + response.status);
            errorPopup("Error removing friend", "The server returned an error for your action.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while removing friend: ', error);
        errorPopup("Network error removing friend", "The friend request couldn't be accepted or deleted.", error, false, false);
    }
}

export async function sendMatchInvite(recipientId, duel) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friend_id: recipientId,
            roomcode: peerId,
            senderName: localStorage.getItem("username"),
            isDuel: duel
        };

        const response = await fetch("https://friends.openguessr.com/friends/send-invite", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            showNotification(`Invite sent.`, false, false, false);
        } else {
            const data = await response.json();
            console.error("Error sending invite: " + response.status + ", " + data.error);
            showNotification("User is not reachable.", false, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending/accepting/declining invite: ', error);
        errorPopup("Network error sending invite", "The invite couldn't be sent due to a network problem.", error, false, false);
    }
}
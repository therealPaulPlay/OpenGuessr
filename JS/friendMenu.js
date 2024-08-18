import { isAuthenticated } from "./accountLogic";
import { leaveCompetition } from "./competitionLogic";
import { errorPopup } from "./errorHandling";
import { showConfirmPopup, showNotification, showPageBrowser } from "./mainUI";
import { joinRoom, leaveMultiplayerRound, peerId, setFriendDuel, setLinkjoinPopup, setPlayingDuels, setupMultiplayerRoom, toggleMultiplayerSelector } from "./multiplayer";
import { loadProfileFromId } from "./profileView";
import { playSound } from "./soundManager";

// Friend browser ---------------------------------------------------------------------------------------
const container = document.getElementById("playerSearchBox");
let addFriendsButton = document.getElementById("browseUsersFriends");

addFriendsButton.addEventListener("click", () => {
    playSound("basic_button");
    if (isAuthenticated) {
        container.innerHTML = `<p class="playerSearchError">Input a query.</p>`;
        document.getElementById("friendBrowserInput").value = "";
        document.getElementById("friendBrowserPopup").style.display = "flex";
    } else {
        toggleMultiplayerSelector("close");
        showPageBrowser("/signup.html", true);
    }
});

document.getElementById("friendBrowserClose").addEventListener("click", () => {
    playSound("basic_button");
    document.getElementById("friendBrowserPopup").style.display = "none";
});

document.getElementById("friendBrowserInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
    };
});

document.getElementById("friendBrowserInput").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        startSearch();
    };
});

document.getElementById("startFriendSearch").addEventListener("click", startSearch);

async function startSearch() {
    container.innerHTML = `<p class="playerSearchError">Searching...</p>`;

    try {
        const query = document.getElementById("friendBrowserInput").value;

        if (!query) {
            container.innerHTML = `<p class="playerSearchError">Query cannot be empty.</p>`;
            return;
        }

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/search/" + query, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            try {
                const data = await response.json();

                let idCounter = 0;

                container.innerHTML = "";

                data.users.forEach(entry => {
                    idCounter++;

                    let newEntry = document.createElement("div");
                    newEntry.classList.add("friendSearchItem");

                    newEntry.innerHTML = `
                    <p>${entry.user_name}</p>
                    <button id="sendFriendRequest${idCounter}" class="sendFriendRequestBrowser standardButton">
                        Send request +
                    </button>`;

                    if (entry.id == localStorage.getItem("id")) {
                        newEntry.classList.add("friendSearchYou");
                    }

                    newEntry.id = "friendSearchEntry" + idCounter;

                    container.appendChild(newEntry);

                    document.getElementById("sendFriendRequest" + idCounter).addEventListener("click", (e) => {
                        e.stopPropagation();
                        playSound("basic_button");
                        sendFriendRequest(entry.id);
                    });

                    document.getElementById("friendSearchEntry" + idCounter).addEventListener("click", () => {
                        loadProfileFromId(entry.id, false, true);
                    });
                });

                if (!container.innerHTML) {
                    container.innerHTML = `<p class="playerSearchError">No results.</p>`;
                }

            } catch (error) {
                console.error("In-Code error loading user browser: " + error);
            }

        } else {
            console.error("Error loading the user browser: " + response.status);
            container.innerHTML = `<p class="playerSearchError">Error: ${response.status}</p>`;
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while loading user browser results: ', error);
        container.innerHTML = `<p class="playerSearchError">Network error: ${error}</p>`;
    }
}

// send friend request ---------------------------------------------------------------------------------------------

async function sendFriendRequest(targetUserId) {
    try {
        if (!targetUserId) {
            return;
        }

        const requestBody = {
            id: localStorage.getItem("id"),
            senderId: localStorage.getItem("id"),
            recipientId: targetUserId,
            senderName: localStorage.getItem("username")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/send", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            showConfirmPopup("Friend request sent!", "Your friend request was sent successfully.", () => { }, false, false, true);
        } else {
            const data = await response.json();
            console.error("Error sending the friend request: " + response.status);
            errorPopup("Error sending friend request", "The server returned an error for your friend request.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending the friend request: ', error);
        errorPopup("Network error sending friend request", "The friend request couldn't be sent.", error, false, false);
    }
}

// Inbox -----------------------------------------------------------------------------------------------------------------------------------

const inboxButton = document.getElementById("openFriendInbox");
const inboxContainer = document.getElementById("friendInbox");
let inboxRefreshInterval;

export function setInboxStatus(newRequests) {
    if (newRequests) {
        document.getElementById("inboxIcon").src = "/IMG/inbox_icon_new.png";
    } else {
        document.getElementById("inboxIcon").src = "/IMG/inbox_icon.png";
    }
}

inboxButton.addEventListener("click", () => {
    playSound("basic_button");
    if (isAuthenticated) {
        inboxContainer.innerHTML = `<p class="playerSearchError">Your inbox is empty.</p>`;
        document.getElementById("friendInboxPopup").style.display = "flex";
        loadInbox(false);
        setInboxStatus(false);
        // auto refresh inbox 
        clearInterval(inboxRefreshInterval);
        inboxRefreshInterval = setInterval(() => {
            if (document.getElementById("friendInboxPopup").style.display == "flex") {
                loadInbox(true);
            }
        }, 5000);
    } else {
        toggleMultiplayerSelector("close");
        showPageBrowser("/signup.html", true);
    }
});

document.getElementById("friendInboxClose").addEventListener("click", () => {
    playSound("basic_button");
    document.getElementById("friendInboxPopup").style.display = "none";
    clearInterval(inboxRefreshInterval);
});

async function loadInbox(silent) {
    if (!silent) {
        inboxContainer.innerHTML = `<p class="playerSearchError">Loading...</p>`;
    }

    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/requests", {
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

                inboxContainer.innerHTML = "";

                data.requests.forEach(entry => {
                    idCounter++;

                    let newEntry = document.createElement("div");
                    newEntry.classList.add("friendSearchItem");

                    newEntry.innerHTML = `
                    <p>${entry.user_name}</p>
                    <div class="inboxItemButtons">
                        <button id="acceptFriendRequest${idCounter}" class="manageFriendRequest standardButton">
                            Accept
                        </button>
                        <button id="declineFriendRequest${idCounter}" class="manageFriendRequest standardButton">
                            Decline
                        </button>
                    </div>`;

                    newEntry.id = "friendInboxEntry" + idCounter;

                    inboxContainer.appendChild(newEntry);

                    document.getElementById("acceptFriendRequest" + idCounter).addEventListener("click", (e) => {
                        e.stopPropagation();
                        playSound("basic_button");
                        acceptFriendRequest(entry.id);
                    });

                    document.getElementById("declineFriendRequest" + idCounter).addEventListener("click", (e) => {
                        e.stopPropagation();
                        playSound("basic_button");
                        declineFriendRequest(entry.id);
                    });

                    document.getElementById("friendInboxEntry" + idCounter).addEventListener("click", () => {
                        loadProfileFromId(entry.id, false, true);
                    });
                });

                if (!inboxContainer.innerHTML) {
                    inboxContainer.innerHTML = `<p class="playerSearchError">Your inbox is empty.</p>`;
                }

            } catch (error) {
                console.error("In-Code error loading inbox: " + error);
            }

        } else {
            console.error("Error loading inbox: " + response.status);
            inboxContainer.innerHTML = `<p class="playerSearchError">Error: ${response.status}</p>`;
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while loading inbox: ', error);
        inboxContainer.innerHTML = `<p class="playerSearchError">Network error: ${error}</p>`;
    }
}

// accept friend request
async function acceptFriendRequest(senderId) {
    try {

        const requestBody = {
            id: localStorage.getItem("id"),
            senderId: senderId,
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/accept", {
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
async function declineFriendRequest(senderId) {
    try {

        const requestBody = {
            id: localStorage.getItem("id"),
            senderId: senderId,
            recipientId: localStorage.getItem("id")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/decline", {
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

let friendsContainer = document.getElementById("friendBox");
let friendContainerMessage = document.getElementById("noFriendsText");

export async function loadFriends() {
    try {
        friendContainerMessage.textContent = "Loading...";

        const requestBody = {
            id: localStorage.getItem("id")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/friends", {
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
                        <img alt="remove friend" class="friendRemoveIcon" src="/IMG/delete_icon.png">
                    </button>
                    `;

                    newEntry.id = "friendEntry" + idCounter;

                    friendsContainer.appendChild(newEntry);

                    document.getElementById("friendEntry" + idCounter).addEventListener("click", () => {
                        loadProfileFromId(entry.id, false, true);
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

                if (!friendsContainer.innerHTML) {
                    friendContainerMessage.textContent = "You haven't added any friends.";
                    friendContainerMessage.style.display = "block";
                    document.getElementById("friendBox").style.display = "none";
                } else {
                    friendContainerMessage.style.display = "none";
                    document.getElementById("friendBox").style.display = "flex";
                }

            } catch (error) {
                console.error("In-Code error loading inbox: " + error);
            }

        } else {
            console.error("Error loading friends: " + response.status);
            friendContainerMessage.textContent = "Error loading friends: " + response.status;
            friendContainerMessage.style.display = "block";
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while loading friends: ', error);
        friendContainerMessage.textContent = "Error occured while loading friends: " + error;
        friendContainerMessage.style.display = "block";
    }
}

async function removeFriend(friendId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friendId: friendId
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/remove", {
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
        console.error('Fetch/Network error occurred while removing friend: ', error);
        errorPopup("Network error removing friend", "The friend request couldn't be accepted or deleted.", error, false, false);
    }
}

async function sendMatchInvite(recipientId, duel) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friend_id: recipientId,
            roomcode: peerId,
            senderName: localStorage.getItem("username"),
            isDuel: duel
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/send-invite", {
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
            showNotification("Error sending invite (user offline).", false, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending/accepting/declining invite: ', error);
        errorPopup("Network error sending invite", "The invite couldn't be sent due to a network problem.", error, false, false);
    }
}

async function acceptDuelInvite(recipientId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friend_id: recipientId,
            senderName: localStorage.getItem("username")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/accept-invite", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {

        } else {
            const data = await response.json();
            console.error("Error accepting invite: " + response.status);
            errorPopup("Error accepting invite", "The server returned an error for your action.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending/accepting/declining invite: ', error);
        errorPopup("Network error sending/accepting/declining invite", "The invite couldn't be sent / accepted / declined.", error, false, false);
    }
}

async function declineMatchInvite(recipientId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friend_id: recipientId,
            senderName: localStorage.getItem("username")
        };

        const response = await fetch("https://accounts.openguessr.com/accounts/friends/decline-invite", {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + localStorage.getItem("bearer"),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {

        } else {
            const data = await response.json();
            console.error("Error declining invite: " + response.status);
            errorPopup("Error declining invite", "The server returned an error for your action.", response.status + " - " + data.error, false, false);
        }

    } catch (error) {
        console.error('Fetch/Network error occurred while sending/accepting/declining invite: ', error);
        errorPopup("Network error sending/accepting/declining invite", "The invite couldn't be sent / accepted / declined.", error, false, false);
    }
}

// Web socket for notifications -------------------------------------------------------------------------------

export function initializeWebsocketConnection() {
    const ws = new WebSocket('wss://accounts.openguessr.com/ws/');

    ws.onopen = () => {
        // Authenticate the WebSocket connection
        ws.send(JSON.stringify({ id: localStorage.getItem("id") })); // Replace `userId` with the actual user ID
    };

    // Handle incoming WebSocket messages
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'room-invite') {
            showNotification(`Received room invite from ${data.name}.`, () => {
                joinRoomFromNotification(data.roomcode, data.from, data.duel);
            }, () => {
                declineMatchInvite(data.from);
            }, true);

        } else if (data.type === 'invite-accepted') {
            createDuelRoom();

        } else if (data.type === 'invite-declined') {
            showNotification(`${data.name} declined your invite.`, false, false, false);
        } else if (data.type === 'friend-request-received') {
            showNotification(`${data.name} sent you a friend request.`, () => {
                acceptFriendRequest(data.from);
            }, false, true);
        }
    };
}

function joinRoomFromNotification(roomcode, recipientId, duel) {
    let joinTimeout = 10;

    if (duel) {
        acceptDuelInvite(recipientId); // informs the host that they should create a room
        joinTimeout = 1000;
    }

    // wait 1000ms for the other player to respond + host the room
    setTimeout(() => {
        leaveMultiplayerRound();
        leaveCompetition(false);

        if (duel) {
            setPlayingDuels(true);
            setFriendDuel(true);
        }

        setLinkjoinPopup(true);
        joinRoom(roomcode.replace("openguessr_", ""));
    }, joinTimeout);
}

function createDuelRoom() {
    leaveMultiplayerRound();
    leaveCompetition(false);
    setPlayingDuels(true);
    setFriendDuel(true);
    setupMultiplayerRoom(5, 60);
    toggleMultiplayerSelector("close");
}


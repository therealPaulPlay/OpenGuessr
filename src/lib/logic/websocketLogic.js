import { showNotification } from "$lib/utils/notifications";
import { username } from "$lib/stores/accountStore";
import { acceptFriendRequest } from "$lib/logic/friendAPI";
import { errorPopup } from "$lib/utils/errorHandling";
import { multiplayerPopup, linkJoinPopup } from "$lib/stores/UIStore";
import { leaveCompetition } from "$lib/logic/competitionLogic";
import { leaveMultiplayerRound, setPlayingDuels, setFriendDuel, setupMultiplayerRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";

export async function initializeWebsocketConnection() {
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    async function connectWebSocket() {
        try {
            ws = new WebSocket('wss://friends.openguessr.com');

            ws.onopen = () => {
                reconnectAttempts = 0; // Reset the reconnect attempts on a successful connection
                ws.send(JSON.stringify({ id: localStorage.getItem("id") }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'room-invite') {
                    const roomOrDuel = data.duel ? "Duel" : "Room";
                    showNotification(`${roomOrDuel} invite from ${data.name}.`, () => {
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

            ws.onclose = () => {
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.warn(`WebSocket closed. Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
                    // slightly delayed reconnect attempt
                    setTimeout(() => {
                        connectWebSocket();
                    }, 500);
                } else {
                    console.error('Max reconnect attempts reached. Could not reconnect. Re-attempting approx. every minute from now on.');
                    setTimeout(() => {
                        connectWebSocket();
                    }, 60000 + Math.floor(Math.random() * 10000));
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket encountered an error: ', error.message);
                ws.close(); // Close the socket to trigger the onclose event
            };
        } catch (error) {
            console.error("Error in websocket friends code:", error);
        }
    }

    connectWebSocket();
}

// Related functions --------------------------------------------------------------------------------------------------------
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

        linkJoinPopup.set(true);
        joinRoom(roomcode.replace("openguessr_", ""));
    }, joinTimeout);
}

function createDuelRoom() {
    leaveMultiplayerRound();
    leaveCompetition(false);
    setPlayingDuels(true);
    setFriendDuel(true);
    setupMultiplayerRoom(5, 60);
    multiplayerPopup.set(false);
}

async function acceptDuelInvite(recipientId) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            friend_id: recipientId,
            senderName: get(username)
        };

        const response = await fetch("https://friends.openguessr.com/friends/accept-invite", {
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
            senderName: get(username)
        };

        const response = await fetch("https://friends.openguessr.com/friends/decline-invite", {
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
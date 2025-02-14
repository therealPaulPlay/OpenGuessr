import { showNotification } from "$lib/utils/notifications";
import { username, elo } from "$lib/stores/accountStore";
import { acceptFriendRequest } from "$lib/logic/friendAPI";
import { errorPopup } from "$lib/utils/errorHandling";
import { leaveCompetition } from "$lib/logic/competitionLogic";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { leaveMultiplayerRound, setPlayingDuels, setFriendDuel, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { duelResultPopup } from "$lib/stores/uiStore";
import { eloChange } from "$lib/stores/context-specific/duelResultStore";
import { goto } from "$app/navigation";

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
                    showNotification(`${data.name} accepted your invite.`);
                    goto("/"); // Go to main game page

                } else if (data.type === 'invite-declined') {
                    showNotification(`${data.name} declined your invite.`);
                    leaveMultiplayerRound(); // Close the room
                    linkJoinPopup.set(false);

                } else if (data.type === 'friend-request-received') {
                    showNotification(`${data.name} sent you a friend request.`, () => {
                        acceptFriendRequest(data.from);
                    }, false, true);

                } else if (data.type === "duel-result") {
                    duelResultPopup.set(true);
                    eloChange.set(data?.eloChanges?.[localStorage.getItem("id")]);
                    elo.set(Math.max(0, get(elo) + get(eloChange))); // Prevent elo from becoming negative

                } else if (data.type === "duel-registration-error") {
                    errorPopup("Duel not registered", "Your opponent failed to register the duel, meaning, it won't affect your elo. You can leave penalty-free.", data?.message);

                } else if (data.type === "duel-late-result") {
                    eloChange.set(data?.eloChanges?.[localStorage.getItem("id")]);
                    elo.set(Math.max(0, get(elo) + get(eloChange))); // Prevent elo from becoming negative
                    showNotification(`Received ${get(eloChange)} Elo from previous game.`);
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
    if (duel) acceptDuelInvite(recipientId); // Informs the host that they accepted
    leaveMultiplayerRound();
    leaveCompetition(false);

    if (duel) {
        setPlayingDuels(true);
        setFriendDuel(true);
    }

    linkJoinPopup.set(true);
    joinRoom(roomcode.replace("openguessr_", ""));
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
import { showNotification } from "$lib/utils/notifications";
import { username, elo } from "$lib/stores/accountStore";
import { acceptFriendRequest, declineMatchInvite, acceptMatchInvite } from "$lib/logic/friendAPI";
import { errorPopup } from "$lib/utils/errorHandling";
import { leaveCompetition } from "$lib/logic/competitionLogic";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { leaveMultiplayerRound, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { duelResultPopup } from "$lib/stores/uiStore";
import { duelResultTitle, eloChange } from "$lib/stores/context-specific/duelResultStore";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { multiplayer } from "$lib/stores/modeStore";
import { roundAmount, socket } from "$lib/stores/context-specific/multiplayerStore";

export async function initializeSSEConnection() {
    let eventSource;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const userId = localStorage.getItem("id");
    if (!userId) return console.error("Can't init SSE with no user id.");

    async function connectSSE() {
        try {
            if (eventSource) eventSource.close();

            // Create a new EventSource connection with the user ID as a query parameter
            eventSource = new EventSource(`${get(accountUrl)}/events?userId=${userId}`);

            eventSource.onopen = () => {
                reconnectAttempts = 0; // Reset the reconnect attempts on successful connection
            };

            // Handle incoming messages
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle different event types
                    switch (data.type) {
                        case 'room-invite':
                            showNotification(`Room invite from ${data.name}.`, () => {
                                joinRoomFromNotification(data.roomcode, data.from);
                            }, () => {
                                declineMatchInvite(data.from);
                            }, true);
                            break;

                        case 'invite-accepted':
                            showNotification(`${data.name} accepted your invite.`);
                            break;

                        case 'invite-declined':
                            showNotification(`${data.name} declined your invite.`);
                            break;

                        case 'friend-request-received':
                            showNotification(`${data.name} sent you a friend request.`, () => {
                                acceptFriendRequest(data.from);
                            }, false, true);
                            break;

                        case 'duel-result':
                            const showResult = () => {
                                duelResultTitle.set(localStorage.getItem("id") == data?.winnerId ? "Victory!" : "Defeat!");
                                eloChange.set(data?.eloChanges?.[localStorage.getItem("id")]);
                                elo.set(Math.max(0, get(elo) + get(eloChange))); // Prevent elo from becoming negative
                                duelResultPopup.set(true);
                            }

                            // If the duel is still ongoing, leave
                            if (get(multiplayer) && !get(socket)?.getStorage?.gameEnded) {
                                showNotification("Your opponent left.");
                                leaveMultiplayerRound();
                            }

                            // Show result on destroy if still in multiplayer, otherwise, show immediately
                            if (get(multiplayer)) get(socket)?.onEvent("instanceDestroyed", showResult);
                            else showResult();

                            break;

                        case 'duel-registration-error':
                            errorPopup("Duel not registered", "Your opponent failed to register the duel and it won't affect your elo. You can leave penalty-free.", data?.message);
                            break;

                        case 'duel-result-error':
                            errorPopup("Duel submission failed", "Please refer to the error message.", data?.message);
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            // Handle errors
            eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);

                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                } else {
                    // If we've exceeded max attempts, close current connection and try again after a longer delay
                    eventSource.close();
                    console.error('Browser reconnection failed repeatedly. Attempting manual reconnection in about a minute.');
                    setTimeout(() => {
                        reconnectAttempts = 0;
                        connectSSE();
                    }, 60000 + Math.floor(Math.random() * 5000));
                }
            };
        } catch (error) {
            console.error("Error setting up SSE connection:", error);
        }
    }

    connectSSE();
}

// Related functions --------------------------------------------------------------------------------------------------------
function joinRoomFromNotification(roomcode, recipientId) {
    acceptMatchInvite(recipientId); // Informs the host that they accepted
    leaveMultiplayerRound();
    leaveCompetition(false);

    linkJoinPopup.set(true);
    joinRoom(roomcode);
}
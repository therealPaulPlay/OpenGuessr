import { showNotification } from "$lib/utils/notifications";
import { username, elo, duelWinStreak, tokens } from "$lib/stores/accountStore";
import { acceptFriendRequest, declineMatchInvite, acceptMatchInvite } from "$lib/logic/friendAPI";
import { leaveCompetition } from "$lib/logic/competitionLogic";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { leaveMultiplayerRound, joinRoom } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { duelResultPopup } from "$lib/stores/uiStore";
import { duelResultTitle, eloChange, tokenGain } from "$lib/stores/context-specific/duelResultStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { multiplayer } from "$lib/stores/modeStore";
import { roundAmount, socket } from "$lib/stores/context-specific/multiplayerStore";
import { goto } from "$app/navigation";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { page } from "$app/state";
import { fetchTournaments } from "$lib/utils/tournamentUtils";

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
            eventSource = new EventSource(`${get(apiUrl)}/events?userId=${userId}`);

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
                            });
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
                            });
                            break;

                        case 'duel-result':
                            const didWin = localStorage.getItem("id") == data?.winnerId;

                            const showResult = () => {
                                // For visual representation
                                duelResultTitle.set(didWin ? "Victory!" : "Defeat!");
                                eloChange.set(data?.eloChanges?.[localStorage.getItem("id")]);
                                tokenGain.set(didWin ? data.tokenGain : 0);

                                // Update data
                                elo.set(Math.max(0, get(elo) + get(eloChange))); // Prevent elo from becoming negative
                                tokens.set(get(tokens) + get(tokenGain));
                                duelWinStreak.set(didWin ? get(duelWinStreak) + 1 : 0);

                                // Show result popup
                                duelResultPopup.set(true);
                            }

                            // If the duel is still ongoing, leave
                            if (get(multiplayer) && !get(socket)?.getStorage?.gameEnded) {
                                didWin ? showNotification("Your opponent disconnected.") : showNotification("You disconnected.");
                                leaveMultiplayerRound();
                            }

                            // Show result on destroy if still in multiplayer, otherwise, show immediately
                            if (get(multiplayer)) get(socket)?.onEvent("instanceDestroyed", showResult);
                            else showResult();

                            break;

                        case 'tournament-starting':
                            showNotification(`A tournament is starting soon!`, () => {
                                goto("/multiplayer");
                            }, false, true);
                            break;

                        case 'tournament-eliminated':
                            showConfirmPopup("Eliminated!", "You can still stay in the tournament as a spectator.")
                            break;

                        case 'tournament-won':
                            showConfirmPopup("You won!", "Congratulations, you won the tournament! Some prizes may require refreshing the website to be applied.")
                            break;

                        case 'tournament-winner-announced':
                            showConfirmPopup(`${data.winnerName} won!`, "Thank you for participating in the tournament!");
                            break;

                        case 'tournament-updated':
                            if (page.url.pathname == "/multiplayer") fetchTournaments();
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
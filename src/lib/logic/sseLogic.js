import { showNotification } from "$lib/utils/notifications";
import { elo, duelWinStreak, tokens, supporterLevel } from "$lib/stores/accountStore";
import { acceptFriendRequest, declineFriendRequest, declineMatchInvite, acceptMatchInvite } from "$lib/logic/friendAPI";
import { leaveCompetition } from "$lib/logic/competitionLogic";
import { leaveMultiplayer, joinFromAnywhere } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";
import { duelResultPopup } from "$lib/stores/uiStore";
import { duelResultTitle, eloChange, tokenGain } from "$lib/stores/context-specific/duelResultStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { multiplayer } from "$lib/stores/modeStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { goto } from "$app/navigation";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { page } from "$app/state";
import { fetchTournaments } from "$lib/utils/tournamentUtils";
import { showProfile } from "$lib/utils/showProfile";

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
                            showNotification(`Room invite from %s.`, () => {
                                joinRoomFromNotification(data.roomcode, data.from);
                            }, () => {
                                declineMatchInvite(data.from);
                            }, false, data.name, () => showProfile(data.from));
                            break;

                        case 'invite-accepted':
                            showNotification(`%s accepted your invite.`, null, null, false, data.name, () => showProfile(data.from));
                            break;

                        case 'invite-declined':
                            showNotification(`%s declined your invite.`, null, null, false, data.name, () => showProfile(data.from));
                            break;

                        case 'friend-request-received':
                            showNotification(`%s sent you a friend request.`, () => {
                                acceptFriendRequest(data.from);
                            }, () => {
                                declineFriendRequest(data.from);
                            }, false, data.name, () => showProfile(data.from));
                            break;

                        case 'friend-request-accepted':
                            showNotification(`%s accepted your friend request.`, null, null, false, data.name, () => showProfile(data.from));
                            break;

                        case 'friend-request-declined':
                            showNotification(`%s declined your friend request.`, null, null, false, data.name, () => showProfile(data.from));
                            break;

                        case 'duel-result': {
                            const didWin = localStorage.getItem("id") == data?.winnerId;

                            const showResult = () => {
                                // For visual representation
                                duelResultTitle.set(didWin ? "Victory!" : "Defeat!");
                                eloChange.set(data?.eloChanges?.[localStorage.getItem("id")] || 0);
                                tokenGain.set(didWin ? data.tokenGain : 0);

                                // Update data (Only apply updates if values are not null – they can be null for e.g. a draw!)
                                if (get(eloChange)) elo.set(Math.max(0, get(elo) + get(eloChange))); // Prevent elo from becoming negative
                                if (get(tokenGain)) tokens.set(get(tokens) + get(tokenGain));
                                duelWinStreak.set(didWin ? get(duelWinStreak) + 1 : 0);

                                // Show result popup
                                duelResultPopup.set(true);
                            }

                            // If the duel is still ongoing, leave
                            if (get(multiplayer) && !get(socket)?.storage?.gameEnded) {
                                didWin ? showNotification("Your opponent disconnected.") : showNotification("You disconnected.");
                                leaveMultiplayer();
                            }

                            // Show result on destroy if still in multiplayer, otherwise, show immediately
                            if (get(multiplayer)) get(socket)?.onEvent("instanceDestroyed", showResult);
                            else showResult();

                            break;
                        }

                        case 'tournament-starting':
                            // Only show if not already on the page
                            if (page.url.pathname !== "/multiplayer") {
                                showNotification(`A tournament is starting soon.`, () => {
                                    goto("/multiplayer");
                                }, false, true);
                            }
                            break;

                        case 'tournament-eliminated':
                            showConfirmPopup("Eliminated!", "You can still stay in the tournament as a spectator.");
                            break;

                        case 'tournament-won':
                            showConfirmPopup("You won!", "Congratulations, you won the tournament! Enjoy your prize.");
                            if (data.tokenGain) tokens.set(get(tokens) + data.tokenGain);
                            if (data.supporterTier) supporterLevel.set(Math.max(get(supporterLevel), data.supporterTier));
                            break;

                        case 'tournament-winner-announced':
                            showConfirmPopup(`${data.winnerName} won!`, "Thank you for participating in the tournament!");
                            break;

                        case 'tournament-updated':
                            if (page.url.pathname === "/multiplayer") fetchTournaments();
                            break;

                        case 'elo-refunded':
                            elo.set(get(elo) + data.amount);
                            showNotification(`You were refunded ${data.amount} elo.`);
                            break;

                        case 'elo-deducted':
                            elo.set(Math.max(0, get(elo) - data.amount));
                            showNotification(`You were deducted ${data.amount} elo.`);
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
    leaveMultiplayer();
    leaveCompetition(false);
    joinFromAnywhere(roomcode);
}
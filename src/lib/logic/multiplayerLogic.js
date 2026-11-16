import { showErrorPopup, showNotification } from "openguessr-ui";
import { disableResultScreen, enableResultScreen } from "$lib/utils/setResultScreen.js";
import { startTimer } from "$lib/utils/timer.js";
import { isAuthenticated } from "$lib/stores/accountStore.js";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate.js";
import { updateMinimapWithTeamMarkers, updateMinimapWithGuessMarker, resetMap, deferredMapReset } from "$lib/logic/miniMap.js";
import { safeCancel, abandonDivisionDuel } from "$lib/logic/matchmakingLogic.js";
import { playSound } from "$lib/utils/soundManager.js";
import { continueText, resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { mapInteractive, guessLat, guessLon } from "$lib/stores/context-specific/mapStore.js";
import { multiplayer } from "$lib/stores/modeStore";
import { guestNamePickerPopup, linkJoinPopup, mainMenu } from "$lib/stores/uiStore";
import {
    teamAmount, roundAmount, roundLength,
    multiplayerStatus, guestName, chatVisible, timeReducedOverlay, multiplayerOverlay,
    multiplayerOverlayTitle, rematchButtonVisible, leaveMatchButtonVisible, multiplayerGroupedSortedPlayers,
    matchmakingActive, socket,
    roomCode,
    participantCount,
    remainingPlayers,
    overlayShowSubtitle,
    multiplayerStyle,
    guestNamePromise,
    multiplayerRestriction,
    chatMutedPlayers,
    multiplayerSortedPlayers,
    currentRound,
    multiplayerMap,
    mobileChatLastOpenedMsgCount,
    matchmakingHosting,
    matchmakingSubmitted,
    cancellingMatchmaking,
    roomLocked,
    clientToken,
    playAnotherTeamDuelButtonVisible,
    teamMoveClients,
} from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { loadAndProfanityCheckChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { currentLocationLatitude, currentLocationLongitude, defaultBounds, mapBounds } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import PlaySocket from "playsocketjs";
import { getServerTimestamp } from "$lib/utils/timeUtil";
import { websocketUrl } from "$lib/stores/context-specific/apiConfigStore";
import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
import { page } from "$app/state";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
import { checkRejoin } from "$lib/utils/rejoinMultiplayer";

export function getTeamFromClientId(id) {
    const playerArray = get(socket)?.storage?.players?.find(item => item.clientId === id);
    return playerArray?.teamIndex;
}

// Chat UI ----------------------------------------------------------------------------------------------------------------------------------
multiplayer.subscribe((isMultiplayer) => {
    if (isMultiplayer) chatVisible.set(true);
    else chatVisible.set(false);
});

// Create multiplayer instance -----------------------------------------------------------------------------------------------------------------------
export async function createMultiplayerInstance() {
    // If existant, destroy previous instance
    if (get(socket)) {
        try {
            get(socket)?.destroy();
        } catch (error) {
            console.error("Error in createMultiplayerInstance() trying to destroy old instance:", error);
        }
    }

    if (!get(isAuthenticated) && !get(guestNamePromise)) {
        // If linkjoin popup is open, close it and open it again after the guest name popup was dismissed to avoid stacking popups
        let wasLinkJoinOpen = false;
        if (get(linkJoinPopup)) {
            linkJoinPopup.set(false);
            wasLinkJoinOpen = true;
        }
        guestNamePickerPopup.set(true);
        await new Promise((resolve) => guestNamePromise.set(resolve));
        if (wasLinkJoinOpen) linkJoinPopup.set(true); // Now, re-open
    }

    // Create the new instance
    try {
        // Authed users additionally set the bearer, guests their guest name, all clients set the clientToken
        const customData = { clientToken: crypto.randomUUID() };
        if (get(isAuthenticated)) customData.bearer = localStorage.getItem("bearer");
        else customData.guestName = get(guestName) || null;
        clientToken.set(customData.clientToken);

        socket.set(new PlaySocket(null, {
            endpoint: get(websocketUrl),
            customData
        }));

        let gameHasStarted = false;

        // Register event listeners
        get(socket).onEvent('status', status => multiplayerStatus.set(status));
        get(socket).onEvent('status', status => console.log(status));

        // Someone connected...
        get(socket).onEvent('clientJoined', (_id) => {
            participantCount.set(get(socket)?.participantCount);
        });

        // Someone disconnected...
        get(socket).onEvent('clientLeft', (_id) => {
            participantCount.set(get(socket)?.participantCount);

            // For the team duel host (if they queue with a mate)
            if (get(matchmakingActive) && get(matchmakingSubmitted)) {
                showNotification("Teammate left, cancelling the matchmaking.");
                cancellingMatchmaking.set(true);
                safeCancel().finally(() => cancellingMatchmaking.set(false));
            }
        });

        get(socket).onEvent('hostMigrated', async () => {
            // In a non-division room, new host should start when the host (who is the only one with the start button) leaves
            if (!get(socket)?.storage?.gameStarted && !get(socket)?.storage?.matchmakingRoom && get(socket)?.isHost) {
                try {
                    await get(socket)?.sendRequest("startRoom");
                } catch (error) {
                    if (get(multiplayer)) showErrorPopup("Failed to start room", "An error occurred trying to start the room upon host migration.", error.message);
                    console.error("Error starting room upon host migration:", error);
                }
            }
        });

        get(socket).onEvent('moved', (newRoomId) => {
            gameHasStarted = false;
            roomCode.set(newRoomId); // Update roomCode to the new room

            // Refresh overlay if it's shown to reflect the new room (it otherwise only updates if the show state changes)
            if (get(socket)?.storage?.overlay) showMultiplayerOverlay();
        });

        get(socket).onEvent('storageUpdated', (storage) => {
            multiplayer.set(true);

            // Update game info
            if (storage.map) multiplayerMap.set(storage.map);
            if (storage.roundAmount) roundAmount.set(storage.roundAmount);
            if (storage.roundLength) roundLength.set(storage.roundLength);
            if (storage.teamAmount) teamAmount.set(storage.teamAmount);
            if (storage.style) multiplayerStyle.set(storage.style);
            if (storage.restriction) multiplayerRestriction.set(storage.restriction);

            // If game has started, go to game page & disable matchmaking
            if (storage.gameStarted && page.url.pathname !== "/" && !gameHasStarted) {
                gameHasStarted = true;

                // Move home and close main menu (e.g. from host or duel page)
                mainMenu.set(false);
                goto("/");
            }
            if (storage.gameStarted && get(matchmakingActive)) matchmakingActive.set(false);

            if (storage.players) updatePlayerArrays(); // Do this before showing the overlay

            if (storage.overlay != null && storage.overlay != get(multiplayerOverlay)) {
                if (storage.overlay) showMultiplayerOverlay();
                else multiplayerOverlay.set(false);
            }

            // Sync the client's minimap guess marker
            const guess = storage.guesses?.find((g) => g.clientId === get(socket)?.id);
            if (!get(resultScreenEnabled) && ((guess?.lat ?? 0) !== get(guessLat) || (guess?.lon ?? 0) !== get(guessLon))) {
                guessLat.set(guess?.lat ?? 0);
                guessLon.set(guess?.lon ?? 0);
                updateMinimapWithGuessMarker(guess?.lat, guess?.lon);
            }

            if (get(teamAmount) > 1 && storage.guesses && !get(resultScreenEnabled)) updateMinimapWithTeamMarkers(storage?.guesses); // Sync team markers

            // Map is interactive while timer is running and the client's guess isn't confirmed
            // Confirm button is active if there's a guess that hasn't been confirmed (and the result isn't shown - to avoid it animating to inactive on result close)
            if (storage.confirmedGuessClients?.includes(get(socket)?.id)) {
                mapInteractive.set(false);
                confirmButtonActive.set(false);
            } else {
                mapInteractive.set(Boolean(storage.timerStart));
                confirmButtonActive.set(Boolean(guess) && !get(resultScreenEnabled));
            }

            if (storage.chats) loadAndProfanityCheckChat(storage.chats || []);

            if (storage.locked != null) roomLocked.set(storage.locked);

            if (storage.restriction) setRestriction(storage.restriction);

            if (storage.currentRound) currentRound.set(storage.currentRound);

            if (storage.confirmedGuessClients && storage.players) {
                const confirmedIDs = new Set(storage.confirmedGuessClients);
                const truncate = (nameString) => nameString.length > 10 ? `${nameString.slice(0, 7)}...` : nameString;
                const remaining = storage.players
                    .filter((player) => !player.disconnected && !confirmedIDs.has(player.clientId))
                    .map((player) => truncate(player.username));
                remainingPlayers.set(remaining); // Set the remainingPlayers to the usernames
            }

            // Control result screen
            if (storage.showResult != null && storage.showResult !== get(resultScreenEnabled)) {
                if (storage.showResult) {
                    // Wait result screen continue text in lobbies with others
                    const continueTimeout = get(socket)?.storage?.players?.filter((p) => !p.disconnected).length > 1 ? (get(socket)?.storage?.tournamentRoom ? 10_000 : 5_000) : 0;
                    continueText.set(`Wait ${continueTimeout / 1000}s...`);
                    setTimeout(() => continueText.set("Continue"), continueTimeout);

                    // Set location & bounds directly, since players joining during the result screen receive this before the location re-generation
                    currentLocationLatitude.set(storage?.location?.[0]);
                    currentLocationLongitude.set(storage?.location?.[1]);
                    mapBounds.set(storage?.mapBounds || get(defaultBounds));
                    enableResultScreen();

                } else {
                    disableResultScreen();
                    deferredMapReset(); // Clear the result map (multiplayer locations are generated without map reset)
                }
            }

            // Set coordinates (without the map reset, since the guesses and markers are synced from the room storage)
            if (storage.location && (get(currentLocationLatitude) != storage?.location[0] || get(currentLocationLongitude) != storage?.location[1])) checkGenerationTypeAndGenerate(true);

            if (storage.countdownActive) multiplayerOverlayCountdown(); // Display countdown

            if (storage.timerStart && storage.timerStart.length != null && storage.timerStart.length !== Infinity) startMultiplayerTimer(storage.timerStart?.length, storage.timerStart?.timestamp); // Set timer if not running
            if (!storage.timerStart && multiplayerTimer?.isTimerActive()) multiplayerTimer?.stopTimer(); // Stop multiplayer timer

            if (storage.timeReducedOverlay != null && storage.timeReducedOverlay !== get(timeReducedOverlay)) {
                if (storage.timeReducedOverlay && !storage?.confirmedGuessClients?.includes(get(socket)?.id)) showTimeReducedOverlay();
                else timeReducedOverlay.set(false);
            }

            if (storage.teamMoveClients) teamMoveClients.set(storage.teamMoveClients);
        });

        get(socket).onEvent('instanceDestroyed', (reason) => {
            if (get(multiplayer)) {
                if (reason) {
                    // Kicked as reason is expected during matchmaking cancellation, as the server kicks the player
                    const isCancelKick = get(cancellingMatchmaking) && reason?.toLowerCase()?.includes?.("kicked");
                    const isAuthedDisconnect = reason?.toLowerCase()?.includes?.("disconnected") && get(isAuthenticated);
                    if (!isCancelKick && !isAuthedDisconnect) showErrorPopup("Disconnected", "You left multiplayer due to the reason below.", reason);
                    else if (isAuthedDisconnect) checkRejoin(true);
                }
                leaveMultiplayer(false); // If not already left, leave (e.g. on error)
            }
        });

        // Initialize and open connection
        await get(socket).init();
        return get(socket).id;

    } catch (error) {
        console.error("Error creating multiplayer instance:", error);
        throw error;
    }
}

// Joining via Links or from other places ----------------------------------------------------------------------------------------------------------------
// Called in accountLogic after account data was loaded
export function checkLinkJoinAndRejoin() {
    let urlParams = page.url.searchParams;
    const code = urlParams.get("join");

    // Room code from query (prioritize query over rejoin)
    if (code) {
        goto(page.url.pathname, { replaceState: true }); // Remove query (goto instead of SvelteKit's replaceState, which crashes if the root layout isn't assigned yet on page load)
        return joinFromAnywhere(code);
    } else if (get(isAuthenticated)) checkRejoin(false);
}

// Join with a popup, without having to go to the join screen
export async function joinFromAnywhere(roomcode, onSuccess) {
    linkJoinPopup.set(true);
    const success = await joinMultiplayerRoom(roomcode);
    if (success) {
        linkJoinPopup.set(false);
        onSuccess?.();
    }
}

// Game logic -----------------------------------------------------------------------------------------------------------------

// Duel Guess Time Reduce Overlay & reduce remaining time
async function showTimeReducedOverlay() {
    try {
        timeReducedOverlay.set(true);
        playSound("time_reduced");
    } catch (error) { console.warn("Error showing time reduce overlay:", error) }
}

async function closeResultScreenAndResetMap() {
    if (get(resultScreenEnabled)) {
        disableResultScreen();
        await deferredMapReset();
    } else resetMap();
}

export async function createMultiplayerRoom(matchmakingRoom = false) {
    try {
        await closeResultScreenAndResetMap();
        await createMultiplayerInstance();

        const code = await get(socket)?.createRoom({
            roundAmount: get(roundAmount),
            roundLength: get(roundLength),
            teamAmount: get(teamAmount),
            style: get(multiplayerStyle),
            restriction: get(multiplayerRestriction),
            map: get(multiplayerMap),
            matchmakingRoom,
        });
        roomCode.set(code);
        participantCount.set(get(socket)?.participantCount);
        return true; // Success

    } catch (error) {
        matchmakingActive.set(false);
        console.error("Error setting up room:", error);
        showErrorPopup("Error creating room", null, error.message);
        return false; // Error
    }
}

export async function joinMultiplayerRoom(code) {
    try {
        code = code.replaceAll(" ", "").replaceAll("-", "").toUpperCase(); // Remove whitespaces, dashes, and uppercase
        await closeResultScreenAndResetMap();

        // Create instance
        try { await createMultiplayerInstance(); } catch (error) {
            matchmakingActive.set(false); // If the instance creation throws, exit matchmaking - if join fails, keep matchmaking active
            showErrorPopup("Error joining room", null, error.message);
            throw error; // Re-throw
        }

        await get(socket).joinRoom(code);
        roomCode.set(code);
        participantCount.set(get(socket)?.participantCount);

        // Move home and close main menu
        mainMenu.set(false);
        goto("/");

        return true; // Success
    } catch (error) {
        console.error("Error joining room:", error); // Status will be set by playpeerjs / playsocketjs
        return false; // Error
    }
}

// Multiplayer leave ----------------------------------------------------------------------------------
export function leaveMultiplayer(destroy = true) {
    // Save flag to reset UI & regenerate
    const wasMultiplayerEnabled = get(multiplayer);

    // Disable Multiplayer & matchmaking
    multiplayer.set(false);
    matchmakingActive.set(false);
    matchmakingHosting.set(false); // Needed when matchmakingActive was never set to true, but hosting was
    matchmakingSubmitted.set(false);

    if (destroy) {
        // If in a division duel, abandon it immediately (since this is an intentional leave)
        if (get(socket)?.storage?.divisionRoom && get(socket)?.storage?.gameStarted && !get(socket)?.storage?.divisionDuelProcessed) abandonDivisionDuel();

        get(socket)?.destroy(); // Destroy peer
        socket.set(null); // Remove reference
    }

    // Clear running countdown
    multiplayerTimer?.stopTimer();
    multiplayerTimerTimestamp = null;
    clearInterval(countdownInterval);
    countdownInterval = null; // Tell overlay countdown it is not running

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    participantCount.set(0);
    multiplayerStyle.set("standard");
    roomCode.set(null);
    multiplayerStatus.set(); // Undefined -> show default msgs
    continueText.set("Continue");
    multiplayerRestriction.set(Object.keys(get(restrictionNames))?.[0]);
    chatMutedPlayers.set([]);
    roomLocked.set(false);
    currentRound.set(0);
    multiplayerMap.set(get(defaultMap));
    mobileChatLastOpenedMsgCount.set(0);
    teamMoveClients.set({});

    // Hide linkjoin popup if open
    linkJoinPopup.set(false);

    // Regenerate location, reset UI
    if (wasMultiplayerEnabled) {
        multiplayerOverlay.set(false);
        mapInteractive.set(true);
        updatePlayerArrays(); // Reset multiplayer array to avoid brief pop-in of previous players on subsequent room creations
        checkGenerationTypeAndGenerate(); // Generate new location to match the singleplayer settings (selected map, timer etc.)
    }

    // Bring player to main menu
    mainMenu.set(true);
}

// Panorama Overlay UI ------------------------------------------------------------------------------------------------------------------------------------------
function showEndscreenUI(show) {
    if (show) {
        if (!get(socket)?.storage?.tournamentRoom) leaveMatchButtonVisible.set(true); // Show large exit button
        if (!get(socket)?.storage?.matchmakingRoom && !get(socket)?.storage?.tournamentRoom && get(socket)?.isHost) rematchButtonVisible.set(true); // Don't show rematch button in matchmaking games, and only if host
        if (get(socket)?.storage?.matchmakingRoom && get(socket)?.storage?.teamAmount === 2) playAnotherTeamDuelButtonVisible.set(true);
    } else {
        leaveMatchButtonVisible.set(false);
        rematchButtonVisible.set(false);
        playAnotherTeamDuelButtonVisible.set(false);
    }
}

// Overlay, countdown and winner determination -------------------------------------------------------------------------------------------------------------------------
function generateColorForTeam(teamIndex) {
    const baseHues = [200, 0, 120, 60, 300]; // Blue, Yellow, Green, Red, Purple
    const hue = baseHues[(teamIndex) % baseHues.length];
    return `hsla(${hue}, 87.9%, 64.3%, 0.3)`;
}

function getTeamColorName(teamIndex) {
    const colorNames = ["Blue", "Red", "Green", "Yellow", "Purple"];
    return colorNames[(teamIndex) % colorNames.length];
}

function sortPlayersByScore(players = []) {
    return [...players].sort((a, b) => {
        if (a.spectator !== b.spectator) return a.spectator ? 1 : -1; // Move spectators to the bottom
        return b.score - a.score || a.disconnected - b.disconnected; // Ties go to connected players
    });
}

function createTeamData(teamIndex) {
    const color = generateColorForTeam(teamIndex);
    const colorName = getTeamColorName(teamIndex);
    const teamScore = get(socket)?.storage?.teamScores?.[teamIndex]?.score ?? 0;
    return { color, colorName, teamIndex, score: teamScore, players: [] };
}

function updatePlayerArrays() {
    const players = (get(socket)?.storage?.players || []).filter((p) => !p.hidden); // Hidden players left in an earlier match
    const sortedPlayers = sortPlayersByScore(players);
    multiplayerSortedPlayers.set(sortedPlayers);

    if (get(teamAmount) <= 1) {
        multiplayerGroupedSortedPlayers.set(sortedPlayers);
        return;
    }

    // Initialize all teams (including empty ones)
    const groupedTeams = Array.from({ length: get(teamAmount) }, (_, i) => createTeamData(i));

    // Assign players to their teams
    players.forEach(player => {
        groupedTeams[player.teamIndex].players.push(player);
    });

    // Sort players within each team and sort teams by total score
    const sortedTeams = groupedTeams
        .map(team => ({ ...team, players: sortPlayersByScore(team.players) }))
        .sort((a, b) => b.score - a.score);

    multiplayerGroupedSortedPlayers.set(sortedTeams);
}

function showMultiplayerOverlay() {
    multiplayerOverlay.set(true);

    if (!get(socket)?.storage?.firstRoundPlayed) multiplayerOverlayTitle.set("Waiting...");

    if (!get(socket)?.storage?.gameEnded) {
        showEndscreenUI(false); // If not at the end, hide endscreen UI
        if (get(socket)?.storage?.firstRoundPlayed) multiplayerOverlayTitle.set("Results from round " + get(socket)?.storage?.currentRound);
    } else {
        determineWinner(get(multiplayerGroupedSortedPlayers));
        showEndscreenUI(true); // Display "Play again" & "Exit"
    }

    overlayShowSubtitle.set(get(multiplayerStyle) == "duel" && get(socket)?.storage?.currentRound >= 3 && get(socket)?.storage?.currentRound < get(socket)?.storage?.roundAmount);
}

function determineWinner(array) {
    const isTeams = get(teamAmount) > 1;

    if (isTeams) {
        // Skip empty teams, they are hidden in the overlay and shouldn't win
        const playedTeams = array.filter((team) => team.players?.length);
        const winningTeamData = playedTeams[0];
        const followUpTeamData = playedTeams[1] || null;

        if (followUpTeamData && winningTeamData?.score == followUpTeamData?.score) {
            multiplayerOverlayTitle.set("It's a draw!");

        } else {
            let teamColorName = winningTeamData?.colorName;
            multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);
            const yourTeam = (get(socket)?.storage?.players?.find((e) => e.clientId == get(socket)?.id))?.teamIndex;
            yourTeam == winningTeamData?.teamIndex ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);
        }

    } else {
        const winningPlayerData = array[0];
        const followUpPlayerData = array[1] || null;

        if (followUpPlayerData && winningPlayerData?.score == followUpPlayerData?.score && winningPlayerData?.disconnected == followUpPlayerData?.disconnected) {
            multiplayerOverlayTitle.set("It's a draw!");

        } else {
            multiplayerOverlayTitle.set(winningPlayerData?.username + " won!");
            get(socket)?.id == winningPlayerData?.clientId ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);
        }
    }
}

let countdownInterval;

// This starts the round visually with a countdown
async function multiplayerOverlayCountdown() {
    if (countdownInterval) return;
    showEndscreenUI(false); // Hide Leave & End option

    let countdown = 3;

    countdownInterval = setInterval(async function () {
        if (countdown > 0) {
            multiplayerOverlayTitle.set(`Starting... ${countdown}`);
            playSound("match_countdown");
            countdown--;
        } else {
            clearInterval(countdownInterval); // Stop the countdown
            countdownInterval = null;
            playSound("match_countdown_start");
        }
    }, 1000);
}

// Timer -------------------------------------------------------------------------------------------------------------------------------------
let multiplayerTimer;
let multiplayerTimerTimestamp; // timerStart timestamp the timer was started for

async function startMultiplayerTimer(totalDuration, startTimestamp) {
    if (startTimestamp === multiplayerTimerTimestamp) return; // Timer already started for this round
    multiplayerTimerTimestamp = startTimestamp;
    const serverTimestamp = await getServerTimestamp();
    if (!get(socket)?.storage?.timerStart) return; // Round ended while fetching the server time
    const duration = Math.round(Math.max(0, totalDuration - ((serverTimestamp / 1000) - (startTimestamp / 1000))));
    multiplayerTimer = startTimer(duration);
}
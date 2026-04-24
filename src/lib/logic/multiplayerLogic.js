import { errorPopup } from "$lib/utils/errorHandling";
import { disableResultScreen, enableResultScreen } from "$lib/utils/setResultScreen.js";
import { startTimer } from "$lib/utils/timer.js";
import { isAuthenticated } from "$lib/stores/accountStore.js";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate.js";
import { updateMinimapWithTeamMarkers } from "$lib/logic/miniMap.js";
import { playSound } from "$lib/utils/soundManager.js";
import { showConfirmPopup } from "$lib/utils/confirmPopup.js";
import { continueText, resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { mapPinLat, mapPinLng, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { multiplayer } from "$lib/stores/modeStore";
import { navigationMenu, guestNamePickerPopup, linkJoinPopup } from "$lib/stores/uiStore";
import { leaveFunction } from "$lib/stores/modeStore.js";
import {
    teamAmount, roundAmount, roundLength,
    multiplayerStatus, guestName, chatVisible, timeReducedOverlay, multiplayerOverlay,
    multiplayerOverlayTitle, rematchButtonVisible, leaveMatchButtonVisible, multiplayerTableArray,
    matchmakingActive, socket,
    roomCode,
    participantCount,
    remainingPlayers,
    overlayShowSubtitle,
    multiplayerStyle,
    guestNamePromise,
    multiplayerRestriction,
    chatMutedPlayers,
    multiplayerSortedPlayersArray,
    currentRound,
    multiplayerMap,
    mobileChatLastOpenedMsgCount,
    matchmakingHosting,
    cancellingMatchmaking,
} from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { loadAndProfanityCheckChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { changeMap } from "$lib/utils/changeMap";
import { showNotification } from "$lib/utils/notifications";
import PlaySocket from "playsocketjs";
import { getServerTimestamp } from "$lib/utils/timeUtil";
import { websocketUrl } from "$lib/stores/context-specific/apiConfigStore";
import { singleplayerTimer } from "$lib/stores/context-specific/timerCountdownOverlayStore";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
import { page } from "$app/state";

export function getTeamFromClientId(id) {
    const playerArray = get(socket)?.storage?.players?.find(item => item.clientId === id);
    return playerArray?.teamIndex;
}

// Game UI ----------------------------------------------------------------------------------------------------------------------------------
function setMultiplayerUI(enable) {
    if (enable) {
        get(singleplayerTimer)?.stopTimer();
        leaveFunction.set(() => {
            showConfirmPopup("Leave?", "You are about to leave the multiplayer room. Are you sure?", leaveMultiplayer);
            playSound("leave_round");
        });
        chatVisible.set(true);
        navigationMenu.set(false); // Disable navigation screen for seamless game entry
    } else {
        leaveFunction.set(); // Hides leave option too
        chatVisible.set(false);
    }
}

multiplayer.subscribe((isMultiplayer) => {
    setMultiplayerUI(isMultiplayer);
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
        guestNamePickerPopup.set(true);
        await new Promise((resolve) => guestNamePromise.set(resolve));
    }

    // Create the new instance
    try {
        let customData = get(isAuthenticated) ? { bearer: localStorage.getItem("bearer") } : undefined;

        socket.set(new PlaySocket(null, {
            endpoint: get(websocketUrl),
            customData
        }));

        let playerAddRequestSent = false;
        let gameHasStarted = false;

        // Register event listeners
        get(socket).onEvent('status', status => multiplayerStatus.set(status));
        get(socket).onEvent('status', status => console.log(status));
        get(socket).onEvent('error', (error) => {
            if (get(cancellingMatchmaking) && error?.toLowerCase()?.includes?.("kicked")) return; // Expected, cancelling makes the server kick the player
            if (get(multiplayer)) errorPopup("Multiplayer error", "The multiplayer system reports an error.", error);
            else multiplayerStatus.set("An error occured.");
        });

        // Someone connected...
        get(socket).onEvent('clientJoined', (_id) => {
            participantCount.set(get(socket)?.participantCount);
        });

        // Someone disconnected...
        get(socket).onEvent('clientLeft', (_id) => {
            participantCount.set(get(socket)?.participantCount);
        });

        get(socket).onEvent('hostMigrated', () => {
            // In a non-division room, start when the host (who is the only one with the start button) leaves
            if (!get(socket)?.storage?.gameStarted && !get(socket)?.storage?.matchmakingRoom) get(socket)?.sendRequest("startRoom");
        });

        get(socket).onEvent('moved', (newRoomId) => {
            playerAddRequestSent = false; // Reset so addPlayer is sent for the new room
            gameHasStarted = false;
            roomCode.set(newRoomId); // Update roomCode to the new room
        });

        get(socket).onEvent('storageUpdated', (storage) => {
            // Save game info
            if (storage.map && storage.roundAmount && storage.roundLength && storage.teamAmount && storage.style && storage.restriction) {
                multiplayerMap.set(storage.map);
                roundAmount.set(storage.roundAmount);
                roundLength.set(storage.roundLength);
                teamAmount.set(storage.teamAmount);
                multiplayerStyle.set(storage.style);
                multiplayerRestriction.set(storage.restriction);
            }

            // If game has started, go to game page & disable matchmaking
            if (storage.gameStarted && page.url.pathname !== "/" && !gameHasStarted) { 
                gameHasStarted = true;
                goto("/"); // E.g. host or duel page -> game page 
            }
            if (storage.gameStarted && get(matchmakingActive)) matchmakingActive.set(false);

            // If player is not already in the room, add player info
            if (get(socket)?.storage?.players?.findIndex((player) => player.clientId == get(socket)?.id) == -1 && !playerAddRequestSent) {
                playerAddRequestSent = true;
                get(socket).sendRequest("addPlayer", { guestName: get(guestName) || null });
            }

            if (storage.players) updatePlayerArrays(); // Do this before showing the overlay

            if (storage.overlay != null && storage.overlay != get(multiplayerOverlay)) showMultiplayerOverlay(Boolean(storage.overlay));

            if (storage.chats) loadAndProfanityCheckChat(storage.chats || []);

            if (get(teamAmount) > 1 && storage.guessLocationsArray && !get(resultScreenEnabled)) updateMinimapWithTeamMarkers(storage?.guessLocationsArray); // Adjust markers

            if (storage.restriction) setRestriction(storage.restriction);

            if (storage.currentRound) currentRound.set(storage.currentRound);

            if (storage.confirmedArray && storage.players) {
                const confirmedIDs = new Set(storage.confirmedArray); // Convert confirmedArray to a Set for efficient lookups
                const truncate = (nameString) => nameString.length > 10 ? `${nameString.slice(0, 7)}...` : nameString;
                const remaining = storage.players
                    .filter((player) => !confirmedIDs.has(player.clientId))
                    .map((player) => truncate(player.username));
                remainingPlayers.set(remaining); // Set the remainingPlayers to the usernames
            }

            // Control result screen
            if (storage.showResult != null && storage.showResult !== get(resultScreenEnabled)) {
                if (storage.showResult == true) {
                    // Wait result screen continue text in lobbies with others
                    const continueTimeout = get(socket)?.storage?.players?.length > 1 ? (get(socket)?.storage?.tournamentRoom ? 10_000 : 5_000) : 0;
                    continueText.set(`Wait ${continueTimeout / 1000}s...`);
                    setTimeout(() => continueText.set("Continue"), continueTimeout);

                    // Ensure the coords are set, in case user joins during result screen
                    currentLocationLatitude.set(storage?.location?.[0]);
                    currentLocationLongitude.set(storage?.location?.[1]);
                    enableResultScreen(get(mapPinLat), get(mapPinLng));

                } else disableResultScreen();
            }

            // Set coordinates
            if (storage.location && (get(currentLocationLatitude) != storage?.location[0] || get(currentLocationLongitude) != storage?.location[1])) checkGenerationTypeAndGenerate();

            if (storage.countdownActive) multiplayerOverlayCountdown(); // Display countdown

            if (storage.timerStart) startMultiplayerTimer(storage.timerStart?.length, storage.timerStart?.timestamp); // Set timer if not running
            if (!storage.timerStart && multiplayerTimer?.isTimerRunning()) multiplayerTimer?.stopTimer(); // Stop multiplayer timer

            if (storage.timeReducedOverlay != null && storage.timeReducedOverlay !== get(timeReducedOverlay)) {
                if (storage.timeReducedOverlay && !storage?.confirmedArray?.includes(get(socket)?.id)) showTimeReducedOverlay();
                else timeReducedOverlay.set(false);
            }
        });

        get(socket).onEvent('instanceDestroyed', () => {
            if (get(multiplayer)) leaveMultiplayer(false); // If not already left, leave (e.g. on error)
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
export function attemptJoinViaLink() {
    let urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("join");
    if (code) {
        // Use native history API instead of SvelteKit's replaceState, which crashes
        // if the root layout component hasn't been assigned yet (race condition on page load)
        history.replaceState(history.state, "", window.location.pathname);
        return joinFromAnywhere(code);
    }
}

// Join with a popup, without having to go to the join screen
export async function joinFromAnywhere(roomcode) {
    linkJoinPopup.set(true);
    const success = await joinMultiplayerRoom(roomcode);
    if (success) linkJoinPopup.set(false);
}

// Game logic -----------------------------------------------------------------------------------------------------------------

// Duel Guess Time Reduce Overlay & reduce remaining time
async function showTimeReducedOverlay() {
    try {
        timeReducedOverlay.set(true);
        playSound("time_reduced");
    } catch (error) { console.warn("Error showing time reduce overlay:", error) }
}

export async function createMultiplayerRoom(sizeLimit, matchmakingRoom = false, divisionRoom = false) {
    try {
        disableResultScreen(); // Edge case
        await createMultiplayerInstance();

        // Check if map is valid for multiplayer
        if (localStorage.getItem("selectedMap") == "Country Guessr") {
            showNotification("Map not supported in multiplayer.")
            await changeMap(get(defaultMap), true); // Regenerate to update locations array
        }

        const code = await get(socket)?.createRoom({
            roundAmount: get(roundAmount),
            roundLength: get(roundLength),
            teamAmount: get(teamAmount),
            style: get(multiplayerStyle),
            restriction: get(multiplayerRestriction),
            map: get(multiplayerMap),
            matchmakingRoom,
            divisionRoom,
        }, sizeLimit);
        multiplayer.set(true); // Set multiplayer after successful creation
        roomCode.set(code);
        participantCount.set(get(socket)?.participantCount);
        return true; // Success

    } catch (error) {
        matchmakingActive.set(false);
        console.error("Error setting up room:", error);
        errorPopup("Error creating room", null, error.message);
        return false; // Error
    }
}

export async function joinMultiplayerRoom(code) {
    try {
        code = code.replaceAll(" ", "").replaceAll("-", "").toUpperCase(); // Remove whitespaces, dashes, and uppercase
        disableResultScreen(); // Edge case

        // Create instance
        try { await createMultiplayerInstance(); } catch (error) {
            matchmakingActive.set(false); // If the instance creation throws, exit matchmaking - if join fails, keep matchmaking active
            errorPopup("Error joining room", null, error.message);
            throw error; // Re-throw
        }

        await get(socket).joinRoom(code);
        multiplayer.set(true); // Set multiplayer after successful join
        roomCode.set(code);
        participantCount.set(get(socket)?.participantCount);
        goto("/"); // Always move to gameplay scene on join
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

    // Disable Multiplayer & Matchmaking
    multiplayer.set(false);
    matchmakingActive.set(false);
    matchmakingHosting.set(false); // Needed when matchmakingActive was never set to true, but hosting was

    if (destroy) {
        get(socket)?.destroy(); // Destroy peer
        socket.set(null); // Remove reference
    }

    // Clear running countdown
    multiplayerTimer?.stopTimer();
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
    currentRound.set(0);
    multiplayerMap.set(null);
    mobileChatLastOpenedMsgCount.set(0);

    // Regenerate location, reset UI
    if (wasMultiplayerEnabled) {
        showMultiplayerOverlay(false); // Also makes map interactive
        updatePlayerArrays(); // Reset multiplayer array to avoid brief pop-in of previous players on subsequent room creations
        updateMinimapWithTeamMarkers([]); // Clean up multiplayer minimap markers
        checkGenerationTypeAndGenerate(); // Generate new loc (also resets restriction)
    }
}

// Panorama Overlay UI ------------------------------------------------------------------------------------------------------------------------------------------
function showEndscreenUI(show) {
    if (show) {
        if (!get(socket)?.storage?.tournamentRoom) leaveMatchButtonVisible.set(true); // Show large exit button
        if (!get(socket)?.storage?.matchmakingRoom && !get(socket)?.storage?.tournamentRoom && get(socket)?.isHost) rematchButtonVisible.set(true); // Don't show rematch button in matchmaking games, and only if host
    } else {
        rematchButtonVisible.set(false);
        leaveMatchButtonVisible.set(false);
    }
}

// Overlay, Countdown and Winner determination -------------------------------------------------------------------------------------------------------------------------
function generateColorForTeam(teamIndex) {
    const baseHues = [200, 0, 120, 60, 300]; // Blue, Yellow, Green, Red, Purple
    const hue = baseHues[(teamIndex) % baseHues.length];
    return `hsla(${hue}, 87.9%, 64.3%, 0.3)`;
}

function getTeamColorName(teamIndex) {
    const colorNames = ["Blue", "Red", "Green", "Yellow", "Purple"];
    return colorNames[(teamIndex) % colorNames.length];
}

let teams = [];

function sortPlayersByScore(players = []) {
    return [...players].sort((a, b) => {
        if (a.spectator !== b.spectator) return a.spectator ? 1 : -1; // Move spectators to the bottom
        return b.score - a.score;
    });
}

function createTeamData(teamIndex) {
    const color = generateColorForTeam(teamIndex);
    const colorName = getTeamColorName(teamIndex);
    return { color, colorName, teamIndex, players: [] };
}

function getTeamScore(team) {
    return team.players.reduce((total, player) => total + player.score, 0);
}

function updatePlayerArrays() {
    const players = get(socket)?.storage?.players || [];
    const sortedPlayers = sortPlayersByScore(players);
    multiplayerSortedPlayersArray.set(sortedPlayers);

    if (get(teamAmount) <= 1) {
        multiplayerTableArray.set(sortedPlayers);
        return;
    }

    // Initialize all teams (including empty ones)
    const groupedTeams = Array.from({ length: get(teamAmount) }, (_, i) => {
        teams[i] = createTeamData(i);
        return teams[i];
    });

    // Assign players to their teams
    players.forEach(player => {
        groupedTeams[player.teamIndex].players.push(player);
    });

    // Sort players within each team and sort teams by total score
    const sortedTeams = groupedTeams
        .map(team => ({ ...team, players: sortPlayersByScore(team.players) }))
        .sort((a, b) => getTeamScore(b) - getTeamScore(a));

    multiplayerTableArray.set(sortedTeams);
}

function showMultiplayerOverlay(show) {
    multiplayerOverlay.set(show);

    if (show) {
        if (!get(socket)?.storage?.firstRoundPlayed) multiplayerOverlayTitle.set("Waiting...");

        if (!get(socket)?.storage?.gameEnded) {
            showEndscreenUI(false); // If not at the end, hide endscreen UI
            if (get(socket)?.storage?.firstRoundPlayed) multiplayerOverlayTitle.set("Results from round " + get(socket)?.storage?.currentRound);
        } else {
            determineWinner(get(multiplayerTableArray));
            showEndscreenUI(true); // Display "Play again" & "Exit"
        }

        overlayShowSubtitle.set(get(multiplayerStyle) == "duel" && get(socket)?.storage?.currentRound >= 3 && get(socket)?.storage?.currentRound < get(socket)?.storage?.roundAmount);
        confirmButtonActive.set(false); // Set the confirm button to the grey "inactive" state (when on guess was made yet)
        mapInteractive.set(false); // Disable map
    } else mapInteractive.set(true);
}

function determineWinner(array) {
    const isTeams = get(teamAmount) > 1;

    if (isTeams) {
        const winningTeamIndex = array[0]?.teamIndex;
        let teamColorName = teams[winningTeamIndex]?.colorName;
        multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);
        const yourTeam = (get(socket)?.storage?.players?.find((e) => e.clientId == get(socket)?.id))?.teamIndex;
        yourTeam == winningTeamIndex ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

    } else {
        const winningPlayerData = array[0];
        const followUpPlayerData = array[1] || null;

        if (followUpPlayerData && winningPlayerData?.score == followUpPlayerData?.score) {
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

async function startMultiplayerTimer(totalDuration, startTimestamp) {
    const serverTimestamp = await getServerTimestamp();
    const duration = Math.round(Math.max(0, totalDuration - ((serverTimestamp / 1000) - (startTimestamp / 1000))));
    if (Math.abs(multiplayerTimer?.getRemainingTime() - duration) <= 1) return; // If the running timer alr has this duration (with slight tolerance), skip
    multiplayerTimer = startTimer(duration);
}
import { errorPopup } from "$lib/utils/errorHandling";
import { disableResultScreen, enableResultScreen } from "$lib/utils/setResultScreen.js";
import { startTimer } from "$lib/utils/timer.js";
import { isAuthenticated } from "$lib/stores/accountStore.js";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate.js";
import { updateMinimapWithTeamMarkers } from "$lib/logic/miniMap.js";
import { mapSupportsMultiplayer } from "$lib/utils/doesMapSupportMultiplayer.js";
import { playSound } from "$lib/utils/soundManager.js";
import { showConfirmPopup } from "$lib/utils/confirmPopup.js";
import { continueText, resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { mapPinLat, mapPinLng, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { multiplayer } from "$lib/stores/modeStore";
import { guestNamePickerPopup, linkJoinPopup } from "$lib/stores/uiStore";
import { mapModeIndicatorVisible, leaveFunction, mapModeIndicatorText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import {
    teamAmount, roundAmount, roundLength, screenEscapeDisabled,
    duelRetryEnabled, multiplayerStatus, guestName, chatVisible, timeReducedOverlay, multiplayerOverlay,
    multiplayerOverlayTitle, rematchButtonVisible, leaveMatchButtonVisible, multiplayerTableArray,
    matchmakingActive, socket,
    roomcode,
    connectionCount,
    remainingPlayers,
    overlayShowSubtitle,
    skillBasedMatchmaking,
    multiplayerStyle,
    guestNamePromise,
    multiplayerRestriction
} from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { loadChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { attemptDuelJoin, deleteRoomCodeFromMatchmakingServer } from "$lib/logic/matchmakingAPI";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { changeCategory } from "$lib/utils/changeCategory";
import { showNotification } from "$lib/utils/notifications";
import PlaySocket from "playsocketjs";
import { getMapBounds } from "$lib/utils/getMapBounds";
import { getServerTimestamp } from "$lib/utils/timeUtil";
import { signupPrompt } from "$lib/utils/signupPrompt";
import { accountUrl, websocketUrl } from "$lib/stores/context-specific/apiConfigStore";
import { singleplayerTimer } from "$lib/stores/context-specific/timerCountdownOverlayStore";

export function getTeamFromMultiplayerId(id) {
    const playerArray = get(socket)?.getStorage?.players?.find(item => item[0] === id);
    return playerArray?.[4];
}

// Game UI ----------------------------------------------------------------------------------------------------------------------------------
function setMultiplayerUI() {
    if (get(multiplayer)) {
        get(singleplayerTimer)?.stopTimer();
        mapModeIndicatorVisible.set(true);
        leaveFunction.set(() => {
            showConfirmPopup("Leave match?", "You are about to leave the multiplayer room. Are you sure?", leaveMultiplayerRound);
            playSound("leave_round");
        });
        chatVisible.set(true);
        linkJoinPopup.set(false);
    } else {
        mapModeIndicatorVisible.set(false);
        leaveFunction.set(); // Hides leave option too
        chatVisible.set(false);
    }
}

// Create multiplayer instance -----------------------------------------------------------------------------------------------------------------------
export async function createMultiplayerInstance() {
    // If existant, destroy old instance
    if (get(socket)) {
        try {
            get(socket)?.destroy();
        } catch (error) { console.error("Error in createMultiplayerInstance trying to destroy old instance:", error); }
    }

    if (!get(isAuthenticated) && !get(guestNamePromise)) {
        guestNamePickerPopup.set(true);
        await new Promise((resolve) => guestNamePromise.set(resolve));
    }

    return new Promise(async (resolve, reject) => {
        // Create the new instance
        try {
            let customData = get(isAuthenticated) ? { bearer: localStorage.getItem("bearer") } : undefined;
            socket.set(new PlaySocket(null, {
                endpoint: get(websocketUrl),
                customData
            }));

            // Register event listeners
            get(socket).onEvent('status', status => multiplayerStatus.set(status));
            get(socket).onEvent('status', status => console.log(status)); // !TODO remove debug (future)
            get(socket).onEvent('error', (error) => {
                if (get(multiplayer)) errorPopup("Multiplayer error", "The multiplayer system reports an error.", error);
                else multiplayerStatus.set("An error occured.");
            });

            // Initialize and open connection
            await get(socket).init();

            // Someone connected...
            get(socket).onEvent('clientConnected', (id) => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // Delete roomcode from server
                if (get(socket)?.getStorage?.divisionRoom && !get(socket)?.getStorage?.gameStarted) startRoom(); // Immediately start on first connection
                connectionCount.set(get(socket)?.connectionCount);
            });

            // Someone disconnected...
            get(socket).onEvent('clientDisconnected', (id) => {
                connectionCount.set(get(socket)?.connectionCount);
            });

            get(socket).onEvent('hostMigrated', () => {
                if (!get(socket)?.getStorage?.gameStarted && get(multiplayer)) startRoom();
            });

            let startMultiplayerRoundTimeout;
            let playerAddRequestSent = false; // Avoid sending this multiple times

            get(socket).onEvent('storageUpdated', (storage) => {
                // Save game info
                if (storage.roundAmount && storage.roundLength && storage.teamAmount && storage.style && storage.restriction) {
                    roundAmount.set(storage.roundAmount);
                    roundLength.set(storage.roundLength);
                    teamAmount.set(storage.teamAmount);
                    multiplayerStyle.set(storage.style);
                    multiplayerRestriction.set(storage.restriction);
                }

                // If player is not already in the room, add player info
                if (get(socket)?.getStorage?.players?.findIndex((player) => player[0] == get(socket)?.id) == -1 && !playerAddRequestSent) {
                    get(socket).sendRequest("addPlayer", { guestName: get(guestName) || null });
                    playerAddRequestSent = true;
                }

                if (storage.players) updateMultiplayerTableArray(); // Do this before showing the overlay

                if (storage.overlay != null && storage.overlay != get(multiplayerOverlay)) showMultiplayerOverlay(Boolean(storage.overlay));

                if (storage.chats) loadChat(storage.chats || []);

                if (get(teamAmount) > 1 && storage.guessLocationsArray && !get(resultScreenEnabled)) updateMinimapWithTeamMarkers(storage?.guessLocationsArray); // Adjust markers

                if (storage.currentRound && storage.restriction) {
                    mapModeIndicatorText.set(`Multiplayer (Round: ${storage.currentRound}/${get(roundAmount)})` + (storage.restriction !== "standard" ? ` (${storage.restriction})` : ""));
                    setRestriction(storage.restriction);
                }

                if (storage.confirmedArray && storage.players) {
                    const confirmedIDs = new Set(storage.confirmedArray); // Convert confirmedArray to a Set for efficient lookups
                    const truncate = (name) => name.length > 10 ? `${name.slice(0, 7)}...` : name;
                    const remaining = storage.players
                        .filter((player) => !confirmedIDs.has(player[0]))
                        .map((player) => truncate(player[1]));
                    remainingPlayers.set(remaining); // Set the remainingPlayers to the usernames
                }

                // Control result screen
                if (storage.showResult != null && storage.showResult !== get(resultScreenEnabled)) {
                    if (storage.showResult == true) {
                        // Wait result screen continue text in lobbies with others
                        if (get(socket)?.getStorage?.players?.length > 1) {
                            continueText.set("Wait 5s...");
                            setTimeout(() => continueText.set("Continue"), 5000);
                        } else continueText.set("Continue");

                        // Ensure the coords are set, in case user joins during result screen
                        currentLocationLatitude.set(storage?.location[0]);
                        currentLocationLongitude.set(storage?.location[1]);
                        enableResultScreen(get(mapPinLat), get(mapPinLng));

                    } else {
                        disableResultScreen();
                        if (storage.currentRound < get(roundAmount)) {
                            clearTimeout(startMultiplayerRoundTimeout); // Prevent multiple calls
                            startMultiplayerRoundTimeout = setTimeout(startMultiplayerRound, 1500); // Start new round
                        }
                    }
                }

                // Set coordinates
                if (storage.location && storage.currentRound >= 1 && (get(currentLocationLatitude) != storage?.location[0] || get(currentLocationLongitude) != storage?.location[1]) && !get(socket)?.isHost) checkGenerationTypeAndGenerate();

                if (storage.countdownActive) multiplayerOverlayCountdown(); // Display countdown

                if (storage.timerStart) startMultiplayerTimer(storage.timerStart?.length, storage.timerStart?.timestamp); // Set timer if not running
                if (!storage.timerStart && multiplayerTimer?.isTimerRunning()) multiplayerTimer?.stopTimer(); // Stop multiplayer timer

                if (storage.timeReducedOverlay != null && storage.timeReducedOverlay !== get(timeReducedOverlay)) {
                    if (storage.timeReducedOverlay && !storage?.confirmedArray?.includes(get(socket)?.id)) showTimeReducedOverlay();
                    else timeReducedOverlay.set(false);
                }
            });

            get(socket).onEvent('instanceDestroyed', () => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // If error...
                if (get(multiplayer)) leaveMultiplayerRound(false); // If not already left, leave
            });

            resolve(get(socket).id);
        } catch (error) {
            console.error("Error creating multiplayer instance:", error);
            reject(new Error("Failed to create multiplayer instance: " + error.message));
        }
    });
}

// Joining via Links ----------------------------------------------------------------------------------------------------------------
// Called in accountLogic after account data was loaded
export function attemptJoinViaLink() {
    let urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("join");
    if (roomCode) joinFromLink(roomCode);
}

export function joinFromLink(roomcode) {
    linkJoinPopup.set(true);
    joinRoom(roomcode);
}

// Find Duel Logic -------------------------------------------------------------------------------------------------------------------------
let roomIndex = 0;

// This initiates the find duel system
export async function findDuel() {
    if (!get(isAuthenticated)) return signupPrompt();
    goto("/multiplayer/duel"); // Visit duel load page
    roomIndex = 0; // Reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive.set(true);
    attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
}

// This occurs when the multiplayer system's connect/join returns an error
function findNextDuel() {
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
    } else {
        matchmakingActive.set(false);
        multiplayerStatus.set("Couldn't connect to any room.");
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

export async function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds, sizeLimit, divisionRoom = false) {
    try {
        disableResultScreen(); // Edge case
        await createMultiplayerInstance(); // Get new multiplayer instance

        // Check if map is valid for multiplayer
        if (!mapSupportsMultiplayer(localStorage.getItem("selectedCategory") || "standard")) {
            showNotification("Map not supported in multiplayer.")
            await changeCategory("standard", true); // Regenerate to update locations array
        }

        // If it's a divison game, ensure standard is selected
        if (divisionRoom && localStorage.getItem("selectedCategory") && localStorage.getItem("selectedCategory") !== "standard") {
            showNotification("Map changed to standard for duel.")
            await changeCategory("standard", true);
        }

        // Set round and length parameters
        roundAmount.set(AmountOfRounds);
        roundLength.set(LengthOfRounds);
        const mapBounds = getMapBounds(); // Get bounds BEFORE setting multiplayer to true

        multiplayer.set(true); // Set multiplayer

        const code = await get(socket)?.createRoom({
            roundAmount: get(roundAmount),
            roundLength: get(roundLength),
            teamAmount: get(teamAmount),
            style: get(multiplayerStyle),
            restriction: get(multiplayerRestriction) || "standard",
            category: localStorage.getItem("selectedCategory") || "standard",
            mapBounds,
            divisionRoom,
        }, sizeLimit);

        roomcode.set(code);
        if (get(matchmakingActive)) multiplayerStatus.set("Waiting for opponent..."); // Wait status

    } catch (error) {
        matchmakingActive.set(false);
        console.error("Error setting up room:", error);
        errorPopup("Error creating room", null, error.message);
    }
}

// Start room (HOST function)
export function startRoom() {
    setMultiplayerUI();
    matchmakingActive.set(false);
    goto("/"); // Creation page -> home
    startMultiplayerRound();
}

async function startMultiplayerRound() {
    if (!get(socket)?.isHost) return;
    await checkGenerationTypeAndGenerate();
    get(socket)?.sendRequest("startRound", { lat: get(currentLocationLatitude), lon: get(currentLocationLongitude) });
}

export async function joinRoom(code) {
    try {
        code = code.replaceAll(" ", "").replaceAll("-", "").toUpperCase(); // Remove whitespaces, dashes, and uppercase
        disableResultScreen(); // Edge case
        try { await createMultiplayerInstance(); } catch (error) {
            matchmakingActive.set(false);
            errorPopup("Error joining room", null, error.message);
            throw new Error(error);
        }
        multiplayer.set(true);
        mapModeIndicatorText.set("Multiplayer (...)");
        await get(socket).joinRoom(code);
        matchmakingActive.set(false);
        setMultiplayerUI();
        goto("/");
    } catch (error) {
        multiplayer.set(false);
        console.error("Error joining room:", error); // Status will be set by playpeerjs / playsocketjs
        if (get(matchmakingActive)) findNextDuel();
    }
}

// Multiplayer leave ----------------------------------------------------------------------------------
export function leaveMultiplayerRound(destroy = true) {
    // Disable Multiplayer & Matchmaking
    const wasMultiplayerEnabled = get(multiplayer);
    multiplayer.set(false);
    matchmakingActive.set(false);

    if (destroy) {
        get(socket)?.destroy(); // Destroy peer
        socket.set(null); // Remove reference
    }

    // Clear running intervals
    multiplayerTimer?.stopTimer();
    clearInterval(countdownInterval);
    countdownInterval = undefined; // Tell overlay countdown it is not running

    screenEscapeDisabled.set(false); // Make Back and Close visible
    duelRetryEnabled.set(false); // Make Duel retry button disabled (Standard)

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    connectionCount.set(0);
    multiplayerStyle.set("standard");
    roomcode.set("......");
    multiplayerStatus.set(); // Undefined -> show default msgs
    continueText.set("Continue");
    multiplayerRestriction.set("standard");

    // Regenerate location, reset UI
    if (wasMultiplayerEnabled) {
        showMultiplayerOverlay(false); // Also makes map interactive
        updateMinimapWithTeamMarkers([]); // Clean up multiplayer minimap markers
        setMultiplayerUI();
        setRestriction("standard");
        checkGenerationTypeAndGenerate();
    }
}

// Panorama Overlay UI ------------------------------------------------------------------------------------------------------------------------------------------
function showEndscreenUI(show) {
    if (show) {
        leaveMatchButtonVisible.set(true); // show leave / end button
        if (!get(socket)?.getStorage?.divisionRoom && get(socket)?.isHost) rematchButtonVisible.set(true); // Don't show rematch button in non-friend duels & only if host
    } else {
        rematchButtonVisible.set(false);
        leaveMatchButtonVisible.set(false);
    }
}

// Overlay, Countdown and Winner determination -------------------------------------------------------------------------------------------------------------------------
function generateColorForTeam(teamIndex) {
    const baseHues = [200, 0, 120, 60, 300]; // Blue, Yellow, Green, Red, Purple
    const hue = baseHues[(teamIndex - 1) % baseHues.length];
    return `hsla(${hue}, 87.9%, 64.3%, 0.3)`;
}

function getTeamColorName(teamIndex) {
    const colorNames = ["Blue", "Red", "Green", "Yellow", "Purple"];
    return colorNames[(teamIndex - 1) % colorNames.length];
}

let teams = [];

// Sort teams
function updateMultiplayerTableArray() {
    const players = get(socket)?.getStorage?.players;

    if (get(teamAmount) <= 1) {
        multiplayerTableArray.set([...players].sort((a, b) => b[3] - a[3]));
    } else {
        // Group players by team
        const groupedTeams = players.reduce((acc, player) => {
            const teamIndex = player[4];
            if (!acc[teamIndex]) {
                teams[teamIndex] = { color: generateColorForTeam(teamIndex), colorName: getTeamColorName(teamIndex) };
                acc[teamIndex] = { ...teams[teamIndex], teamIndex, players: [] };
            }
            acc[teamIndex].players.push(player);
            return acc;
        }, {});

        // Ensure all team numbers from 1 to teamAmount exist (even empty teams)
        const totalTeamAmount = get(teamAmount);
        for (let i = 1; i <= totalTeamAmount; i++) {
            if (!groupedTeams[i]) {
                teams[i] = { color: generateColorForTeam(i), colorName: getTeamColorName(i) };
                groupedTeams[i] = { ...teams[i], teamIndex: i, players: [] };
            }
        }

        // Sort & set
        multiplayerTableArray.set(
            Object.values(groupedTeams)
                .map(team => ({
                    ...team,
                    players: team.players.sort((a, b) => b[3] - a[3])
                }))
                .sort((a, b) =>
                    b.players.reduce((s, p) => s + p[3], 0) -
                    a.players.reduce((s, p) => s + p[3], 0)
                )
        );
    }
}

function showMultiplayerOverlay(show) {
    multiplayerOverlay.set(show);

    if (show) {
        if (!get(socket)?.getStorage?.firstRoundPlayed) {
            multiplayerOverlayTitle.set("Waiting...");
            mapModeIndicatorText.set("Multiplayer (" + (get(socket)?.getStorage?.category)?.replace("community_", "") + ")")
        }

        if (!get(socket)?.getStorage?.gameEnded) {
            showEndscreenUI(false); // If not at the end, hide endscreen UI
            if (get(socket)?.getStorage?.firstRoundPlayed) multiplayerOverlayTitle.set("Results from round " + get(socket)?.getStorage?.currentRound);
        } else {
            determineWinner(get(multiplayerTableArray));
            showEndscreenUI(true); // Display "Play again" & "Exit"
        }

        overlayShowSubtitle.set(get(multiplayerStyle) == "duel" && get(socket)?.getStorage?.currentRound >= 3 && get(socket)?.getStorage?.currentRound < get(socket)?.getStorage?.roundAmount);
        confirmButtonActive.set(false); // Set the confirm button to the grey "inactive" state (when on guess was made yet)
        mapInteractive.set(false); // Disable map
    } else {
        mapInteractive.set(true);
    }
}

function determineWinner(array) {
    const isTeams = get(teamAmount) > 1;

    if (isTeams) {
        const winningTeamIndex = array[0]?.teamIndex;
        let teamColorName = teams[winningTeamIndex]?.colorName;
        multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);
        const yourTeam = (get(socket)?.getStorage?.players?.find((e) => e[0] == get(socket)?.id))[4];
        yourTeam == winningTeamIndex ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

    } else {
        const winningPlayerData = array[0];
        const followUpPlayerData = array[1] || null;

        if (followUpPlayerData && winningPlayerData?.[3] == followUpPlayerData?.[3]) {
            multiplayerOverlayTitle.set("It's a draw!");

        } else {
            multiplayerOverlayTitle.set(winningPlayerData?.[1] + " won!");
            get(socket)?.id == winningPlayerData?.[0] ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);
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
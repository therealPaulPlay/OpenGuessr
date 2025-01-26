import { loadAndInitializeLibrary } from "$lib/utils/scriptLoader";
import { errorPopup } from "$lib/utils/errorHandling";
import { disableResultScreen, enableResultScreen } from "$lib/utils/setResultScreen.js";
import { startTimer } from "$lib/utils/timer.js";
import { checkedForBan, isAuthenticated, isBanned, banReportEntryData } from "$lib/stores/accountStore";
import { selectedBadge, selectedPinIndex, supporterLevel, username, elo } from "$lib/stores/accountStore.js";
import { transitionToStart } from "$lib/utils/transitionToStart";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation.js";
import { updateMinimapWithTeamMarkers } from "$lib/logic/miniMap.js";
import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
import { mapSupportsMultiplayer } from "$lib/utils/doesMapSupportMultiplayer.js";
import { playSound } from "$lib/utils/soundManager.js";
import { addDuelPlayed, addDuelWon } from "$lib/utils/updateProfileData.js";
import { showConfirmPopup } from "$lib/utils/confirmPopup.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore.js";
import { mapPinLat, mapPinLng, mapVisible } from "$lib/stores/context-specific/mapStore.js";
import { multiplayer } from "$lib/stores/modeStore";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { mapModeIndicatorVisible, leaveFunction, modeText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import {
    teamAmount, roundAmount, roundLength, screenEscapeDisabled,
    duelRetryEnabled, multiplayerStatus, restrictionButtonText, savedGuestName, chatVisible, timeReducedOverlay, timeReducedOverlayText, multiplayerOverlay,
    multiplayerOverlayTitle, rematchButtonVisible, leaveMatchButtonVisible, multiplayerTableArray,
    matchmakingActive, peer,
    multiplayerGuessesLocationsArray,
    roomcode,
    connectionCount
} from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { loadChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { attemptDuelJoin, deleteRoomCodeFromMatchmakingServer } from "$lib/logic/roomAPI";
import { generateDuelUUID, sendDuelDivisionResult, checkRankedLeavePenalty, removeRankedLeavePenalty } from "$lib/utils/duelDivisionFunctions";
import { currentLocationLatitude, currentLocationLongitude, currentlyLoadedLocationsArray } from "$lib/stores/locationStore";
import { generateFunnyGuestName, generateRandomCode } from "$lib/utils/codeGenerationUtil";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { changeCategory } from "$lib/utils/changeCategory";
import { showNotification } from "$lib/utils/notifications";
import PlayPeer from "playpeerjs";
import { buildTeamDisplayText } from "$lib/utils/buildTeamDisplayText";

// Team display on Host Page  -----------------------------------------------------------------------------------------------------------------------
function updateTeamIndexes() {
    buildTeamDisplayText(get(peer)?.getStorage?.players);
    if (get(teamAmount) <= 1) return;

    const amountOfTeams = get(teamAmount);
    const teams = {};

    for (let i = 1; i <= amountOfTeams; i++) {
        teams[i] = []; // Add empty array for each team
    }

    let index = 1;
    const newArray = get(peer)?.getStorage?.players;
    newArray.forEach((element) => {
        // Distribute players in teams starting from team 1
        const teamIndex = index;
        teams[teamIndex].push(element[1]);
        element[4] = teamIndex; // Update the team index on the player data
        index = (index % amountOfTeams) + 1; // Increment index circularly from 1 to amountOfTeams
    });

    get(peer)?.updateStorage("players", newArray); // !TODO move into separate array to avoid sync overwriting, also, this would lead to endless loop!
}

export function getTeamFromPeerId(id) {
    const playerArray = get(peer)?.getStorage?.players.find(item => item[0] === id);
    return playerArray[4];
}

// Restriction Toggle -------------------------------------------------------------------------------------------------------------------------------
let multiplayerRestriction = "standard";
let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
let restrictionsText = ["Standard", "NMPZ", "Grayscale", "Invert Colors", "Hue Shift", "Blink (Fade)"];
let currentRestrictionIndex = 0;

export function toggleMultiplayerRestriction() {
    if (get(restrictionButtonText) == "Standard") currentRestrictionIndex = 0; // Start from the beginning if text reset
    currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
    multiplayerRestriction = restrictions[currentRestrictionIndex];
    restrictionButtonText.set(restrictionsText[currentRestrictionIndex]);
}

// Game UI ----------------------------------------------------------------------------------------------------------------------------------
function setMultiplayerUI() {
    if (get(multiplayer)) {
        mapModeIndicatorVisible.set(true);
        leaveFunction.set(() => {
            showConfirmPopup("Leave match?", "You are about to leave the multiplayer room. Are you sure?", leaveMultiplayerRound);
            playSound("leave_round");
        });

        modeText.set("Multiplayer (Awaiting info..)");
        chatVisible.set(true);
        disableResultScreen(); // disable result screen if it is open (edge case)
    } else {
        mapModeIndicatorVisible.set(false);
        leaveFunction.set();
        chatVisible.set(false);
    }
}

// End round ---------------------------------------------------------------------------------------------------------------------------------
function multiplayerTimerExpired() {
    confirmButtonClicks(); // Only do this if the player actually hasnt guessed yet...
    endMultiplayerRound();
}

function endMultiplayerRound() {
    const skipTimeout = 5000;
    continueText.set("Wait " + (skipTimeout / 1000) + "s..."); // Wait text will auto disable the button

    // After 5 seconds, allow the skip functionality for all players
    setTimeout(function () {
        continueText.set("Continue");
    }, skipTimeout);

    enableResultScreen(get(mapPinLat), get(mapPinLng));
    try { multiplayerTimer.stopTimer(); } catch { }; // Stop multiplayer timer
}

export function multiplayerStateToGuessed() {
    addMultiplayerGuessMarker();
    get(peer)?.updateStorage("currentGuessAmount", get(peer)?.getStorage?.currentGuessAmount + 1);
    if (playingDuels) get(peer)?.updateStorage("timeReduceOverlay", true); // Reduce time in duels
}

export function addMultiplayerGuessMarker() {
    // Remove previous guess entry (if exists)
    const yourElement = get(peer)?.getStorage?.players?.find((element) => element.id == get(peer).id);
    if (yourElement) get(peer)?.updateStorageArray("guessLocationsArray", "remove-matching", yourElement);
    get(peer)?.updateStorageArray("guessLocationsArray", "add", { id: get(peer)?.id, lat: get(mapPinLat), long: get(mapPinLng), pin: get(selectedPinIndex), username: get(username) || get(savedGuestName), team: getTeamFromPeerId(get(peer)?.id) });
}

export function updatePeerScore(addScore) {
    const peerIndex = get(peer)?.getStorage?.players.findIndex(findPeer => findPeer[0] === get(peer)?.id);
    if (peerIndex !== -1) {
        const thisPlayer = get(peer)?.getStorage?.players[peerIndex];
        let newPlayer = [...thisPlayer];
        newPlayer[3] = newPlayer[3] + addScore;
        get(peer)?.updateStorageArray("players", "update-matching", thisPlayer, newPlayer);
    }
}

// Load PlayPeerJS -----------------------------------------------------------------------------------------------------------------------
export async function createPeerInstance() {
    // Generate a unique user ID
    let uniqueUserID;

    if (localStorage.getItem("id")) {
        uniqueUserID = "openguessr_" + Number(localStorage.getItem("id")).toString(16) + generateRandomCode(2);
    } else {
        uniqueUserID = "openguessr_" + "g" + generateRandomCode(7);
        generateFunnyGuestName();
    }

    return new Promise(async (resolve) => {
        // Create the new Peer instance
        try {
            peer.set(new PlayPeer(uniqueUserID, {
                config: {
                    'iceServers': [
                        { urls: "stun:fastturn.pro:5349", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "turns:fastturn.pro:5349", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                        { urls: "turn:fastturn.pro:3478", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                    ]
                }
            }));

            // Initialize and open peer
            await get(peer).init();

            // Register event listeners
            get(peer).onEvent('status', status => multiplayerStatus.set(status));
            get(peer).onEvent('status', status => console.log(status)); // !TODO remove debug
            get(peer).onEvent('error', (error) => {
                if (get(multiplayer)) errorPopup("Multiplayer error", "The multiplayer system (PlayPeerJS) reports an error.", error);
            });

            // Joined room successfully...
            get(peer).onEvent('outgoingPeerConnected', () => {
                multiplayer.set(true);
                linkJoinPopup.set(false);
                matchmakingActive.set(false);
                setMultiplayerUI();
                goto("/");
                get(peer)?.updateStorageArray("chats", "add", `System: ${get(username) || get(savedGuestName)} joined.`);
                get(peer)?.updateStorageArray("players", "add", [get(peer)?.id, get(username) || get(savedGuestName), get(elo), 0, 1, localStorage.getItem("id"), get(selectedBadge)]);
                if (get(peer)?.getStorage?.highestSupporterLevel < (get(supporterLevel) || 0)) get(peer)?.updateStorage("highestSupporterLevel", get(supporterLevel));
            });

            // New peer connected to host...
            get(peer).onEvent('incomingPeerConnected', (id) => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // Delete roomcode from server
                if (friendDuel || get(matchmakingActive)) startRoom(); // Immediately start on first connection
                connectionCount.set(get(peer)?.connectionCount);
            });

            // Peer disconnected from host...
            get(peer).onEvent('incomingPeerDisconnected', (id) => {
                const disconnectedPlayer = get(peer)?.getStorage?.players?.find((item) => item[0] == id);
                const disconnectedPlayerName = disconnectedPlayer[1] || "Unknown";
                removeConnectedPeerById(id);
                get(peer)?.updateStorageArray("chats", "add", `System: ${disconnectedPlayerName} left.`);
                connectionCount.set(get(peer)?.connectionCount);
            });

            get(peer).onEvent('storageUpdate', (storage) => {
                console.log("Storage updated:", get(peer)?.getStorage); // !TODO remove debug

                if (storage.overlay) storage.overlay ? showMultiplayerOverlay(true) : showMultiplayerOverlay(false);

                if (storage.chats) loadChat(storage.chats || []);

                if (storage.guessLocationsArray) multiplayerGuessesLocationsArray.set(storage.guessLocationsArray); // Make reactive
                if (get(teamAmount) > 1 && storage.guessLocationsArray) updateMinimapWithTeamMarkers(storage?.guessLocationsArray); // Adjust markers

                if (typeof storage.timeReduceOverlay !== "undefined" && storage.timeReduceOverlay !== get(timeReducedOverlay)) {
                    if (!storage.timeReduceOverlay) showTimeReduceOverlay(0, false);
                    if (storage.timeReduceOverlay) showTimeReduceOverlay(15, get(mapVisible));
                }

                // Set multiplayer category
                if (storage.category && localStorage.getItem("selectedCategory") !== storage.category) {
                    changeCategory(storage?.category);
                    showNotification("Map changed to " + storage?.category?.replaceAll("community_", "") + ".");
                }

                // Sync game info
                if (storage.roundAmount && storage.roundLength && storage.teamAmount && storage.restriction && storage.mapLocationsArray) {
                    roundAmount.set(storage?.roundAmount);
                    roundLength.set(storage?.roundLength);
                    teamAmount.set(storage?.teamAmount);
                    multiplayerRestriction = storage?.restriction;
                    currentlyLoadedLocationsArray.set(storage?.mapLocationsArray);
                }

                if (storage.players) {
                    updateTeamIndexes();
                }

                // Check if all guesses are in, and if so, end round
                if (storage.currentGuessAmount && storage.currentGuessAmount >= storage?.players?.length) endMultiplayerRound();

                // Control result screen
                if (storage.showResult) storage.showResult ? enableResultScreen() : disableResultScreen();

                // Set coordinates
                if (storage.location && storage.currentRound && (get(currentLocationLatitude) !== storage?.location[0] || get(currentLocationLongitude) !== storage?.location[1])) {
                    // The host generates the location, so don't execute this again for them
                    if (get(multiplayer) && storage.currentRound > 0) {
                        if (!get(peer)?.isHost) checkGenerationTypeAndGenerate();
                        multiplayerOverlayCountdown();
                    }
                }
            });

            get(peer).onEvent('destroy', () => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer();
                if (!get(multiplayer)) return; // If already left, do not make further changes

                // If destroyed by system (e.g error)...
                removeRankedLeavePenalty();
                leaveMultiplayerRound(false);
            });

            resolve(get(peer).id);
        } catch (error) {
            console.error("Error creating peer instance:", error);
            reject(new Error("Failed to create peer instance."))
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
let playingDuels = false;
let friendDuel = false;

let duelUUID = null; // Used for duel validation and identification, created by host

export function setPlayingDuels(state) {
    playingDuels = state;
}

export function setFriendDuel(state) {
    friendDuel = state;
}

// This initiates the find duel system
export async function findDuel() {
    if (!get(checkedForBan)) await new Promise(resolve => setTimeout(resolve, 1000));
    if (get(isBanned)) {
        errorPopup(
            "You are banned",
            `Unfortunately, you are banned from playing duels for "${get(banReportEntryData)?.reason}" until ${get(banReportEntryData).expires_at ? new Date(get(banReportEntryData).expires_at)?.toLocaleDateString() : "forever"}. 
            Please contact the moderators on Discord if you think this was a mistake.`,
            "Blacklisted."
        );

        multiplayerStatus.set("Aborted due to ban.");
        return;
    }

    roomIndex = 0; // Reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive.set(true);
    playingDuels = true;
    multiplayerStatus.set("Starting...");
    attemptDuelJoin(roomIndex);
}

// This occurs when the peer connect returns an error like peer_unavailable (means = doesn't exist)
export function findNextDuel() {
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex);
    } else {
        matchmakingActive.set(false);
        multiplayerStatus.set("Couldn't connect to any room.");
    }
}

// Duel Guess Time Reduce Overlay & reduce remaining time
function showTimeReduceOverlay(time, hide) {
    if (!hide) {
        try {
            if (multiplayerTimer.isTimerRunning() && multiplayerTimer.getRemainingTime() > 3) { // Only show overlay if it the remaining time is above 3s
                timeReducedOverlay.set(true);
                playSound("time_reduced");

                setTimeout(() => {
                    timeReducedOverlay.set(false);
                    get(peer)?.updateStorage("timeReducedOverlay", false);
                }, 3000)
            }
        } catch (error) { console.warn("Error showing time reduce overlay: " + error) }
    } else {
        timeReducedOverlay.set(false);
        get(peer)?.updateStorage("timeReducedOverlay", false);
    }

    if (time) {
        if (multiplayerTimer?.isTimerRunning() && multiplayerTimer?.getRemainingTime() > time) {
            multiplayerTimer?.stopTimer();
            multiplayerTimer = startTimer(time, multiplayerTimerExpired); // Start the timer with new time
            timeReducedOverlayText.set(`Time reduced to ${time}s.`);
        } else {
            timeReducedOverlayText.set("Time remains unaffected.");
        }
    }
}

// Host Logic ----------------------------------------------------------------------------------------------
function removeConnectedPeerById(peerId) {
    const array = get(peer)?.getStorage?.players;
    const index = array.findIndex(entry => entry[0] === peerId);
    const contentToRemove = array[index];
    get(peer)?.updateStorageArray("players", "remove-matching", contentToRemove);
}

export async function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds) {
    try {
        await createPeerInstance(); // Get new peer instance
        multiplayerStatus.set("Room created. Please wait <10s");

        // Check if map is valid for multiplayer
        if (!mapSupportsMultiplayer(localStorage.getItem("selectedCategory") || "standard")) {
            showNotification("Unsupported map changed to Standard.")
            changeCategory("standard", true); // Regenerate to update locations array
        }

        // set round and length parameters
        roundAmount.set(AmountOfRounds);
        roundLength.set(LengthOfRounds);

        // Generate random duel UUID (only used in duels)
        duelUUID = generateDuelUUID();

        roomcode.set(await get(peer)?.createRoom({
            players: [[get(peer)?.id, get(username) || get(savedGuestName), get(elo), 0, 1, localStorage.getItem("id"), get(selectedBadge)]],
            roundAmount: get(roundAmount),
            currentRound: 0,
            roundLength: get(roundLength),
            teamAmount: get(teamAmount),
            highestSupporterLevel: get(supporterLevel) || 0,
            restriction: multiplayerRestriction,
            category: localStorage.getItem("selectedCategory") || "standard",
            mapLocationsArray: get(currentlyLoadedLocationsArray), // Map location data to calculate boundaries
            location: [35.7072457, 139.863412], // Default panorama to prevent blackscreen
            guessLocationsArray: [], // Guesses from players
            uuid: duelUUID,
            firstRoundPlayed: false,
            chats: [],
            overlay: true,
            timeReduceOverlay: false,
            showResult: false,
            overlayTitle: "Waiting...",
        }));

        showMultiplayerOverlay(true);
    } catch (error) {
        console.error("Error setting up room:", error);
        errorPopup("Error creating room", "Error occured trying to set up PlayPeerJS room.", error);
    }
}

// Start room (HOST function)
export function startRoom() {
    multiplayerStatus.set("Starting! Loading location...");
    multiplayer.set(true);
    setMultiplayerUI();
    get(peer)?.updateStorage("overlay", true);
    get(peer)?.updateStorage("overlayTitle", "Ready");
    checkGenerationTypeAndGenerate(); // Load map and set map text
    matchmakingActive.set(false);
}

export function multiplayerRematch() {
    get(peer)?.updateStorage("firstRoundPlayed", false);
    get(peer).updateStorage("currentRound", 0);

    // Reset player scores
    const playersArray = get(peer)?.getStorage?.players;
    playersArray.forEach((element) => {
        element[3] = 0;
    });
    get(peer)?.updateStorage("players", playersArray);

    startRoom();
}

// Start the first / next round
export async function startMultiplayerRound(latitude, longitude) {
    get(peer)?.updateStorage("guessLocationsArray", []); // Reset

    // If this is not the last round, wait to show the results properly
    if (get(peer)?.getStorage?.firstRoundPlayed) {
        await new Promise(resolve => { setTimeout(resolve, 1500); });
    }

    // If this is the first round...
    if (!get(peer)?.getStorage?.firstRoundPlayed) {
        goto("/"); // Go to home if starting from different page
        get(peer)?.updateStorage("firstRoundPlayed", true);
    }

    get(peer)?.updateStorage("currentRound", get(peer)?.getStorage?.currentRound + 1); // Add 1 to currentRound
    if (get(peer)?.getStorage?.currentRound > get(roundAmount)) return; // If this was the last round, do not start a new one

    get(peer)?.updateStorageArray("chats", "add", `System: Starting round ${get(peer)?.getStorage?.currentRound}.`);
    get(peer)?.updateStorage("location", [latitude, longitude]);
}

// Peer Logic -----------------------------------------------------------------------------------------------------------------
export async function joinRoom(code) {
    try {
        code = "openguessr_" + code.replaceAll(" ", "").toLowerCase(); // Remove whitespaces and lowercase
        await createPeerInstance();
        await get(peer).joinRoom(code);
    } catch (error) {
        console.error("Error occured joining room:", error); // Status will be set too
    }
}

// Multiplayer leave ----------------------------------------------------------------------------------

export function leaveMultiplayerRound(destroy = true) {

    // Disable Multiplayer
    const wasMultiplayerEnabled = get(multiplayer);
    multiplayer.set(false);

    // Destroy peer
    get(peer)?.destroy();

    // Result screen timer (sometimes not set, therefore catch)
    try { multiplayerTimer.stopTimer() } catch { };

    // Clear running intervals
    clearInterval(countdownInterval);

    screenEscapeDisabled.set(false); // Make Back and Close visible
    duelRetryEnabled.set(false); // Make Duel retry button disabled (Standard)

    // Apply leave penalty if in division game
    checkRankedLeavePenalty();

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    roomcode.set("loading...");
    connectionCount.set(0);

    // General UI resets
    continueText.set("Continue");
    multiplayerStatus.set(); // Undefined -> show default msgs

    // Reset restriction
    restrictionButtonText.set("Standard");
    multiplayerRestriction = "standard";
    setRestriction("standard");

    // UI functions
    setMultiplayerUI();
    showMultiplayerOverlay(false);

    updateMinimapWithTeamMarkers([]); // clean up multiplayer minimap markers
    matchmakingActive.set(false);
    playingDuels = false;
    friendDuel = false;
    if (localStorage.getItem("selectedMap") !== "country guesser") mapVisible.set(true);

    if (wasMultiplayerEnabled) checkGenerationTypeAndGenerate(); // Regenerate
}

// Panorama Overlay UI ------------------------------------------------------------------------------------------------------------------------------------------
function showEndscreenUI(show) {
    if (show) {
        leaveMatchButtonVisible.set(true); // show leave / end button
        if (playingDuels && !friendDuel) return; // Do not rematch option in ranked duel

        rematchButtonVisible.set(true);
    } else {
        rematchButtonVisible.set(false);
        leaveMatchButtonVisible.set(false);
    }
}

// Overlay, Countdown and Winner determination -------------------------------------------------------------------------------------------------------------------------
const baseHues = [200, 0, 120, 60, 300]; // Blue, Yellow, Green, Red, Purple

function generateColorForTeam(teamIndex) {
    const hue = baseHues[(teamIndex - 1) % baseHues.length];
    return `hsla(${hue}, 87.9%, 64.3%, 0.3)`;
}

function getTeamColorName(teamIndex) {
    const colorNames = ["Blue", "Red", "Green", "Yellow", "Purple"];
    return colorNames[(teamIndex - 1) % colorNames.length];
}

function showMultiplayerOverlay(show) {
    multiplayerOverlay.set(show);
    multiplayerOverlayTitle.set(get(peer)?.getStorage?.overlayTitle);

    if (show) {
        showEndscreenUI(false); // Default to no endscreen UI
        let array = get(peer)?.getStorage?.players; // Get up-to-date player array
        if (!get(peer)?.getStorage?.firstRoundPlayed) modeText.set("Multiplayer (" + (localStorage.getItem("selectedCategory") || "standard").replace("community_", "") + ")");

        if (get(teamAmount) > 1) {
            let teams = {};

            // "array" in this case is always connected peers (see passed property)
            array.forEach(playerInfo => {
                const teamIndex = playerInfo[4]; // team id 
                if (!teams[teamIndex]) {
                    teams[teamIndex] = {
                        color: generateColorForTeam(teamIndex),
                        colorName: getTeamColorName(teamIndex),
                        players: []
                    };
                }
                teams[teamIndex].players.push(playerInfo);
            });

            // Sort the teams based on total XP and transform into an array
            array = Object.keys(teams)
                .sort((a, b) => {
                    const totalExperienceA = teams[a].players.reduce((sum, player) => sum + player[3], 0);
                    const totalExperienceB = teams[b].players.reduce((sum, player) => sum + player[3], 0);
                    return totalExperienceB - totalExperienceA; // Sort descending
                })
                .map((teamIndex) => {
                    // Sort players within each team by XP
                    teams[teamIndex].players.sort((a, b) => b[3] - a[3]);
                    return {
                        teamIndex: parseInt(teamIndex), // Ensure the team index is numeric
                        ...teams[teamIndex], // Spread the team properties (color, colorName, players)
                    };
                });

            determineWinner(array, true, teams);
            multiplayerTableArray.set(array); // Reactive update for table array
        } else {
            array.sort((a, b) => b[3] - a[3]);
            determineWinner(array, false);
            multiplayerTableArray.set(array); // Reactive update for table array
        }

        confirmButtonActive.set(false); // Set the confirm button to the grey "inactive" state (when on guess was made yet)
        mapVisible.set(false); // Hide map

    } else {
        if (get(multiplayer) || localStorage.getItem("selectedCategory") !== "country guesser") {
            mapVisible.set(true);
        }
    }
}

function determineWinner(array, teams, teamsObject) {
    if (get(peer)?.getStorage?.currentRound >= get(roundAmount)) {

        if (teams) {
            const winningTeamIndex = array[0]?.teamIndex;
            let teamColorName = teamsObject[winningTeamIndex].colorName;
            multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);

        } else {
            const winningPlayerData = array[0];
            const followUpPlayerData = array[1] || undefined;

            removeRankedLeavePenalty(); // Remove leave penalty notice

            if (followUpPlayerData && winningPlayerData[3] == followUpPlayerData[3]) {
                // Draw
                multiplayerOverlayTitle.set("It's a draw!");
                if (playingDuels && get(isAuthenticated) && !friendDuel) addDuelPlayed();

            } else {
                // Clear Winner
                multiplayerOverlayTitle.set(winningPlayerData[1] + " won!");
                localStorage.getItem("id") == winningPlayerData[5] ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

                // Check if you won in duels or just played
                if (playingDuels && !friendDuel) {
                    const won = winningPlayerData[5] == localStorage.getItem("id");
                    won ? addDuelWon() : addDuelPlayed();
                    sendDuelDivisionResult(won, get(peer)?.getStorage?.uuid);
                }
            }
        }

        // Display UI for playing again or exiting
        showEndscreenUI(true);
    }
}

let multiplayerTimer;
let countdownInterval;

// This starts the round visually with a countdown
function multiplayerOverlayCountdown() {
    if (playingDuels && !friendDuel) localStorage.setItem("activeDuel", "active"); // Save for leave penalty

    let countdown = 3;

    clearInterval(countdownInterval); // Clear
    countdownInterval = setInterval(function () {
        if (countdown > 0) {
            multiplayerOverlayTitle.set(`Starting... ${countdown}`);
            countdown--;
            playSound("match_countdown");
        } else {
            clearInterval(countdownInterval); // Stop the countdown

            if (get(multiplayer)) {
                showMultiplayerOverlay(false); // Hide the overlay --> round starts
                try { multiplayerTimer.stopTimer(); } catch { }; // Stop multiplayer timer (redudancy)
                multiplayerTimer = startTimer(get(roundLength), multiplayerTimerExpired); // Start the timer

                modeText.set("Multiplayer (Round: " + get(peer)?.getStorage?.currentRound + "/" + get(roundAmount) + ")");

                // Append restriction text
                if (multiplayerRestriction !== "standard" && multiplayerRestriction) {
                    modeText.set(get(modeText) + " (" + multiplayerRestriction + ")");
                }

                setRestriction(multiplayerRestriction);
                playSound("match_countdown_start");
            }
        }
    }, 1000);
}
import { loadAndInitializeLibrary } from "$lib/utils/scriptLoader";
import { errorPopup } from "$lib/utils/errorHandling";
import { disableResultScreen, enableResultScreen } from "$lib/utils/setResultScreen.js";
import { startTimer } from "$lib/utils/timer.js";
import { checkedForBan, isAuthenticated, isBanned, banReportEntryData } from "$lib/stores/accountStore";
import { selectedBadge, selectedPinIndex, supporterLevel, username, elo } from "$lib/stores/accountStore.js";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation.js";
import { updateMinimapWithTeamMarkers } from "$lib/logic/miniMap.js";
import { mapSupportsMultiplayer } from "$lib/utils/doesMapSupportMultiplayer.js";
import { playSound } from "$lib/utils/soundManager.js";
import { addDuelPlayed, addDuelWon } from "$lib/utils/updateProfileData.js";
import { showConfirmPopup } from "$lib/utils/confirmPopup.js";
import { continueText, resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { mapPinLat, mapPinLng, mapVisible } from "$lib/stores/context-specific/mapStore.js";
import { multiplayer } from "$lib/stores/modeStore";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { mapModeIndicatorVisible, leaveFunction, modeText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import {
    teamAmount, roundAmount, roundLength, screenEscapeDisabled,
    duelRetryEnabled, multiplayerStatus, restrictionButtonText, savedGuestName, chatVisible, timeReducedOverlay, multiplayerOverlay,
    multiplayerOverlayTitle, rematchButtonVisible, leaveMatchButtonVisible, multiplayerTableArray,
    matchmakingActive, peer,
    roomcode,
    connectionCount,
    remainingPlayers,
    overlayShowSubtitle
} from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { loadChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { attemptDuelJoin, deleteRoomCodeFromMatchmakingServer } from "$lib/logic/roomAPI";
import { generateDuelUUID, registerDivisionDuel, sendDuelDivisionResult } from "$lib/utils/duelDivisionFunctions";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { generateFunnyGuestName, generateRandomCode } from "$lib/utils/codeGenerationUtil";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { changeCategory } from "$lib/utils/changeCategory";
import { showNotification } from "$lib/utils/notifications";
import PlayPeer from "playpeerjs";
import { buildTeamDisplayText } from "$lib/utils/buildTeamDisplayText";
import { getMapBounds } from "$lib/utils/getMapBounds";
import { getServerTimestamp } from "$lib/utils/timeUtil";
import { signupPrompt } from "$lib/utils/signupPrompt";
import { fetchBlacklistStatus } from "$lib/utils/checkBanStatus";

export function getTeamFromPeerId(id) {
    const playerArray = get(peer)?.getStorage?.players?.find(item => item[0] === id);
    return playerArray?.[4];
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
        linkJoinPopup.set(false);
    } else {
        mapModeIndicatorVisible.set(false);
        leaveFunction.set(); // Hides leave option too
        chatVisible.set(false);
    }
}

// End round ---------------------------------------------------------------------------------------------------------------------------------
function endMultiplayerRound() {
    // After 5 seconds, allow the skip functionality for all players
    continueText.set("Wait 5s..."); // Wait text will auto-disable the button
    setTimeout(() => continueText.set("Continue"), 5000);
    enableResultScreen(get(mapPinLat), get(mapPinLng));

    // Storage events after enabling result! (otherwise, result might trigger multiple times)
    get(peer)?.updateStorage("timerStart", false);
    get(peer)?.updateStorage("confirmedArray", []); // Reset confirmed guesses to prevent double-end
    startedRound = false;
}

export function multiplayerStateToGuessed() {
    get(peer)?.updateStorageArray("confirmedArray", "add", get(peer)?.id);
    if (playingDuels) get(peer)?.updateStorage("timeReducedOverlay", true); // Reduce time in duels
}

export function addMultiplayerGuessMarker() {
    // Remove previous guess entry (if exists)
    const yourElement = get(peer)?.getStorage?.guessLocationsArray?.find((element) => element.id == get(peer)?.id);
    if (yourElement) get(peer)?.updateStorageArray("guessLocationsArray", "remove-matching", yourElement);
    get(peer)?.updateStorageArray("guessLocationsArray", "add", { id: get(peer)?.id, lat: get(mapPinLat), long: get(mapPinLng), pin: get(selectedPinIndex), username: get(username) || get(savedGuestName), team: getTeamFromPeerId(get(peer)?.id) });
}

export function updatePeerScore(addScore) {
    const peerIndex = get(peer)?.getStorage?.players?.findIndex(findPeer => findPeer[0] === get(peer)?.id);
    if (peerIndex !== -1) {
        const thisPlayer = get(peer)?.getStorage?.players[peerIndex];
        let newPlayer = [...thisPlayer];
        if (playingDuels && get(peer)?.getStorage?.currentRound > 3) addScore = Math.round(addScore * 1.5); // Duel Multiplayer for round 4 + 5
        newPlayer[3] = newPlayer[3] + addScore;
        get(peer)?.updateStorageArray("players", "update-matching", thisPlayer, newPlayer);
    }
}

// Load PlayPeerJS -----------------------------------------------------------------------------------------------------------------------
export async function createPeerInstance() {
    let uniqueUserID;

    if (localStorage.getItem("id")) {
        uniqueUserID = "openguessr_" + Number(localStorage.getItem("id")).toString(16) + generateRandomCode(2);
    } else {
        uniqueUserID = "openguessr_" + "g" + generateRandomCode(7);
        generateFunnyGuestName();
    }

    return new Promise(async (resolve, reject) => {
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

            // Register event listeners
            get(peer).onEvent('status', status => multiplayerStatus.set(status));
            get(peer).onEvent('status', status => console.log(status)); // !TODO remove debug (future)
            get(peer).onEvent('error', (error) => {
                if (get(multiplayer)) errorPopup("Multiplayer error", "The multiplayer system (PlayPeerJS) reports an error.", error);
            });

            // Initialize and open peer
            await get(peer).init();

            // New peer connected to host...
            get(peer).onEvent('incomingPeerConnected', (id) => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // Delete roomcode from server
                if (playingDuels && !get(peer)?.getStorage?.gameOngoing) startRoom(); // Immediately start on first connection
                connectionCount.set(get(peer)?.connectionCount);
            });

            // Peer disconnected from host...
            get(peer).onEvent('incomingPeerDisconnected', (id) => {
                const name = get(peer)?.getStorage?.players?.find((p) => p[0] == id)?.[1] || "Unknown";
                get(peer)?.updateStorageArray("chats", "add", `System: ${name} left.`);
                removeConnectedPeerById(id);
                connectionCount.set(get(peer)?.connectionCount);
            });

            // Host disconnected from peer...
            get(peer).onEvent('outgoingPeerDisconnected', (id) => {
                const name = get(peer)?.getStorage?.players?.find((p) => p[0] == id)?.[1] || "Unknown";
                get(peer)?.updateStorageArray("chats", "add", `System: ${name} left - changing host.`);
                removeConnectedPeerById(id);
                connectionCount.set(get(peer)?.connectionCount);
                if (!get(peer)?.getStorage?.gameOngoing && get(multiplayer)) startRoom(); // If the host leaves and the game is still in the hosting phase, start
            });

            let playerAdded;

            get(peer).onEvent('storageUpdated', (storage) => {
                // Sync game info
                if (storage.roundAmount && storage.roundLength && storage.teamAmount && storage.restriction) {
                    roundAmount.set(storage?.roundAmount);
                    roundLength.set(storage?.roundLength);
                    teamAmount.set(storage?.teamAmount);
                }

                // If player is not already in the room, add player info
                if (!playerAdded && get(peer)?.getStorage?.players?.findIndex((player) => player[0] == get(peer)?.id) == -1) {
                    playerAdded = true;

                    // Calculate the team
                    const playerCount = get(peer)?.getStorage?.players.length;
                    const teamNumber = get(teamAmount) <= 1 ? 1 : ((playerCount % get(teamAmount)) + 1);

                    get(peer)?.updateStorageArray("players", "add-unique", [get(peer)?.id, get(username) || get(savedGuestName), get(elo), 0, teamNumber, localStorage.getItem("id"), get(selectedBadge)]);
                    if (get(peer)?.getStorage?.highestSupporterLevel < (get(supporterLevel) || 0)) get(peer)?.updateStorage("highestSupporterLevel", get(supporterLevel));
                }

                if (typeof storage.overlay !== "undefined" && storage.overlay != get(multiplayerOverlay)) storage.overlay ? showMultiplayerOverlay(true) : showMultiplayerOverlay(false);

                if (storage.players) updateMultiplayerTableArray();

                if (storage.chats) loadChat(storage.chats || []);

                if (get(teamAmount) > 1 && storage.guessLocationsArray && !get(resultScreenEnabled)) updateMinimapWithTeamMarkers(storage?.guessLocationsArray); // Adjust markers

                // Set multiplayer category
                if (storage.category && localStorage.getItem("selectedCategory") !== storage.category) {
                    if (localStorage.getItem("selectedCategory")) showNotification("Map changed to " + storage?.category?.replaceAll("community_", "") + ".");
                    changeCategory(storage?.category);
                }

                if (storage.currentRound && storage.restriction) {
                    modeText.set("Multiplayer (Round: " + get(peer)?.getStorage?.currentRound + "/" + get(roundAmount) + ")");
                    setRestriction(storage.restriction);
                    if (storage.restriction !== "standard" && storage.restriction) modeText.set(get(modeText) + " (" + storage.restriction + ")");
                }

                if (storage.players) buildTeamDisplayText(get(peer)?.getStorage?.players);

                if (storage.confirmedArray && storage.players) {
                    const confirmedIDs = new Set(storage.confirmedArray); // Convert confirmedArray to a Set for efficient lookups
                    const truncate = (name) => name.length > 10 ? `${name.slice(0, 7)}...` : name;
                    const remaining = storage.players
                        .filter((player) => !confirmedIDs.has(player[0]))
                        .map((player) => truncate(player[1]));
                    remainingPlayers.set(remaining); // Set the remainingPlayers to the usernames
                }

                // Control result screen
                if (storage.showResult !== undefined && storage.showResult !== get(resultScreenEnabled)) {
                    if (storage.showResult == true) {
                        // Ensure the coords are set, in case they join during result screen
                        currentLocationLatitude.set(storage?.location[0]);
                        currentLocationLongitude.set(storage?.location[1]);
                        endMultiplayerRound();
                    } else {
                        disableResultScreen();
                        get(peer)?.updateStorage("overlay", true);
                    }
                }

                // Check if all guesses are in, and if so, end round
                if (storage.confirmedArray?.length >= storage.players?.length && get(resultScreenEnabled) == false && !storage?.showResult) {
                    get(peer)?.updateStorage("showResult", true);
                }

                // Set coordinates
                if (storage.location && storage.currentRound >= 1 && (get(currentLocationLatitude) != storage?.location[0] || get(currentLocationLongitude) != storage?.location[1]) && get(multiplayer)) {
                    checkGenerationTypeAndGenerate();
                }

                if (storage.countdownActive) multiplayerOverlayCountdown(); // Activate countdown

                if (storage.timerStart) startMultiplayerTimer(storage.timerStart?.length, storage.timerStart?.timestamp); // Set timer if not running
                if (!storage.timerStart && multiplayerTimer?.isTimerRunning()) try { multiplayerTimer?.stopTimer(); } catch { }; // Stop multiplayer timer

                if (storage.timeReducedOverlay && storage.timeReducedOverlay !== get(timeReducedOverlay) && storage?.confirmedArray?.length === 1) {
                    showTimeReducedOverlay(15, !storage?.confirmedArray?.includes(get(peer)?.id));
                }

                if (storage.rematch && get(peer)?.isHost) multiplayerPerformRematch();

                if (storage.startRound && get(peer)?.isHost) {
                    setTimeout(startMultiplayerRound, storage?.firstRoundPlayed ? 1500 : 0);
                }
            });

            get(peer).onEvent('hostMigrated', () => {
                // Check if round should be started, as previous host might not have
                if (get(peer)?.getStorage?.startRound && get(peer)?.isHost) setTimeout(startMultiplayerRound, 1500);
            });

            get(peer).onEvent('instanceDestroyed', () => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // If error...
                if (!get(multiplayer)) return; // If already left, do not make further changes
                leaveMultiplayerRound(false);
            });

            resolve(get(peer).id);
        } catch (error) {
            console.error("Error creating peer instance:", error);
            reject(new Error("Failed to create peer instance."));
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

export function setPlayingDuels(state) {
    playingDuels = state;
}

export function setFriendDuel(state) {
    friendDuel = state;
}

// This initiates the find duel system
export async function findDuel() {
    if (!get(isAuthenticated)) return signupPrompt();
    if (!get(checkedForBan)) await fetchBlacklistStatus();
    if (!get(checkedForBan)) return multiplayerStatus.set("Failed to fetch blacklist status.");
    if (get(isBanned)) {
        return errorPopup(
            "You are banned",
            `Unfortunately, you are banned from playing duels for "${get(banReportEntryData)?.reason}" until ${get(banReportEntryData)?.expires_at ? new Date(get(banReportEntryData)?.expires_at)?.toLocaleDateString() : "forever"}. 
            Please contact the moderators on Discord if you think this was a mistake.`
        );
    }

    goto("/multiplayer/duel"); // Visit duel load page
    roomIndex = 0; // Reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    playingDuels = true;
    matchmakingActive.set(true);
    attemptDuelJoin(roomIndex);
}

// This occurs when the peer connect returns an error like peer_unavailable (means = doesn't exist)
function findNextDuel() {
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex);
    } else {
        matchmakingActive.set(false);
        multiplayerStatus.set("Couldn't connect to any room.");
    }
}

// Duel Guess Time Reduce Overlay & reduce remaining time
async function showTimeReducedOverlay(time, show) {
    if (time && multiplayerTimer?.getRemainingTime() > 15) {
        const serverTime = await getServerTimestamp();
        get(peer)?.updateStorage("timerStart", { timestamp: serverTime, length: time }); // Start timer with new time
    }
    if (show && !get(timeReducedOverlay)) {
        try {
            timeReducedOverlay.set(true);
            playSound("time_reduced");

            setTimeout(() => {
                timeReducedOverlay.set(false);
                get(peer)?.updateStorage("timeReducedOverlay", false);
            }, 3000)
        } catch (error) { console.warn("Error showing time reduce overlay:", error) }
    }
}

// Host Logic ----------------------------------------------------------------------------------------------
function removeConnectedPeerById(peerId) {
    const index = get(peer)?.getStorage?.players?.findIndex(entry => entry[0] === peerId);
    if (index >= 0) {
        const contentToRemove = get(peer)?.getStorage?.players[index];
        get(peer)?.updateStorageArray("players", "remove-matching", contentToRemove);
    }
}

export async function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds, sizeLimit) {
    try {
        disableResultScreen(); // Edge case
        await createPeerInstance(); // Get new peer instance

        // Check if map is valid for multiplayer
        if (!mapSupportsMultiplayer(localStorage.getItem("selectedCategory") || "standard")) {
            showNotification("Unsupported map changed to Standard.")
            await changeCategory("standard", true); // Regenerate to update locations array
        }

        // set round and length parameters
        roundAmount.set(AmountOfRounds);
        roundLength.set(LengthOfRounds);

        roomcode.set(await get(peer)?.createRoom({
            players: [],
            roundAmount: get(roundAmount),
            currentRound: 0,
            roundLength: get(roundLength),
            teamAmount: get(teamAmount),
            highestSupporterLevel: get(supporterLevel) || 0,
            restriction: multiplayerRestriction,
            category: localStorage.getItem("selectedCategory") || "standard",
            mapBounds: getMapBounds(),
            location: [35.7072457, 139.863412], // Default panorama to prevent blackscreen
            guessLocationsArray: [], // Guesses from players (with location data)
            confirmedArray: [], // Player ids that have confirmed their guess
            uuid: generateDuelUUID(),
            firstRoundPlayed: false,
            chats: [],
            overlay: true,
            timeReducedOverlay: false,
            showResult: false,
            startRound: false,
            gameOngoing: false, // True after the room was started once and is not in creation phase
            countdownActive: false,
            timerStart: false
        }, sizeLimit));
        if (get(matchmakingActive)) multiplayerStatus.set("Room created. Please wait <10s"); // Wait status

    } catch (error) {
        console.error("Error setting up room:", error);
        matchmakingActive.set(false);
        errorPopup("Error creating room", "Error occured trying to set up PlayPeerJS room.", error);
    }
}

// Start room (HOST function)
export function startRoom() {
    multiplayer.set(true);
    setMultiplayerUI();
    matchmakingActive.set(false);
    if (!get(peer)?.getStorage?.firstRoundPlayed) goto("/"); // Creation page -> home
    get(peer)?.updateStorage("gameOngoing", true);
    get(peer).updateStorage("startRound", true);
}

function multiplayerPerformRematch() {
    get(peer)?.updateStorage("rematch", false);
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

// Start the first / next round (HOST only)
let startedRound = false;

async function startMultiplayerRound() {
    // If round is already started, exit
    if (startedRound) return;
    startedRound = true;

    await checkGenerationTypeAndGenerate();
    get(peer)?.updateStorage("location", [get(currentLocationLatitude), get(currentLocationLongitude)]); // Set coordinates
    get(peer)?.updateStorage("guessLocationsArray", []); // Reset guesses
    get(peer)?.updateStorage("timeReducedOverlay", false); // Ensure no reduced timer from before interferes

    // Countdown
    get(peer)?.updateStorage("countdownActive", true);
    get(peer)?.updateStorage("currentRound", get(peer)?.getStorage?.currentRound + 1);
    get(peer)?.updateStorageArray("chats", "add", `System: Starting round ${get(peer)?.getStorage?.currentRound}.`);
    get(peer).updateStorage("startRound", false); // Round started successfully
}

// Peer Logic -----------------------------------------------------------------------------------------------------------------
export async function joinRoom(code) {
    try {
        code = "openguessr_" + code.replaceAll(" ", "").toLowerCase(); // Remove whitespaces and lowercase
        disableResultScreen(); // Edge case
        try { await createPeerInstance(); } catch (error) {
            matchmakingActive.set(false);
            throw new Error(error);
        }
        await get(peer).joinRoom(code);
        multiplayer.set(true);
        matchmakingActive.set(false);
        setMultiplayerUI();
        goto("/");
        get(peer)?.updateStorageArray("chats", "add", `System: ${get(username) || get(savedGuestName)} joined.`);
    } catch (error) {
        console.error("Error occured joining room:", error); // Status will be set by playpeerjs
        if (get(matchmakingActive)) findNextDuel();
    }
}

// Multiplayer leave ----------------------------------------------------------------------------------

export function leaveMultiplayerRound(destroy = true) {
    // Disable Multiplayer
    const wasMultiplayerEnabled = get(multiplayer);
    multiplayer.set(false);

    get(peer)?.destroy(); // Destroy peer

    // Result screen timer (sometimes not set, therefore catch)
    try { multiplayerTimer?.stopTimer() } catch { };

    // Clear running intervals
    clearInterval(countdownInterval);
    countdownInterval = undefined; // Tell overlay countdown it is not running

    screenEscapeDisabled.set(false); // Make Back and Close visible
    duelRetryEnabled.set(false); // Make Duel retry button disabled (Standard)

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    roomcode.set("loading...");
    connectionCount.set(0);
    multiplayerRestriction = "standard";
    startedRound = false;
    playingDuels = false;
    friendDuel = false;
    matchmakingActive.set(false);

    // General UI resets
    continueText.set("Continue");
    multiplayerStatus.set(); // Undefined -> show default msgs

    // Reset restriction
    restrictionButtonText.set("Standard");
    setRestriction("standard");

    // UI functions
    setMultiplayerUI();
    showMultiplayerOverlay(false);
    updateMinimapWithTeamMarkers([]); // clean up multiplayer minimap markers
    if (localStorage.getItem("selectedMap") !== "country guessr") mapVisible.set(true);

    if (wasMultiplayerEnabled) checkGenerationTypeAndGenerate(); // Regenerate location
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

let teams = [];

function updateMultiplayerTableArray() {
    const players = get(peer)?.getStorage?.players;

    if (get(teamAmount) <= 1) {
        multiplayerTableArray.set([...players].sort((a, b) => b[3] - a[3]));
        return;
    }

    const groupedTeams = players.reduce((acc, player) => {
        const teamIndex = player[4];
        if (!acc[teamIndex]) {
            teams[teamIndex] = { color: generateColorForTeam(teamIndex), colorName: getTeamColorName(teamIndex) };
            acc[teamIndex] = { ...teams[teamIndex], teamIndex, players: [] };
        }
        acc[teamIndex].players.push(player);
        return acc;
    }, {});

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

function showMultiplayerOverlay(show) {
    multiplayerOverlay.set(show);

    if (show) {
        if (get(peer)?.getStorage?.firstRoundPlayed) multiplayerOverlayTitle.set("Results from round " + get(peer)?.getStorage?.currentRound);
        if (!get(peer)?.getStorage?.firstRoundPlayed) multiplayerOverlayTitle.set("Waiting...");
        if (!get(peer)?.getStorage?.firstRoundPlayed) modeText.set("Multiplayer (" + (get(peer)?.getStorage?.category)?.replace("community_", "") + ")");
        overlayShowSubtitle.set(playingDuels && get(peer)?.getStorage?.currentRound >= 3 && get(peer)?.getStorage?.currentRound < 5);

        showEndscreenUI(false); // Default to no endscreen UI

        const isTeams = get(teamAmount) > 1;

        confirmButtonActive.set(false); // Set the confirm button to the grey "inactive" state (when on guess was made yet)
        mapVisible.set(false); // Hide map
        if (get(peer)?.getStorage?.currentRound >= get(roundAmount)) determineWinner(get(multiplayerTableArray), isTeams, isTeams ? teams : undefined); // Win / Lose

    } else {
        if (get(multiplayer) || localStorage.getItem("selectedCategory") !== "country guessr") {
            mapVisible.set(true);
        }
    }
}

function determineWinner(array, teams, teamsObject) {
    if (teams) {
        const winningTeamIndex = array[0]?.teamIndex;
        let teamColorName = teamsObject[winningTeamIndex]?.colorName;
        multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);
        const yourTeam = (get(peer)?.getStorage?.players?.find((e) => e[0] == get(peer)?.id))[4];
        yourTeam == winningTeamIndex ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

    } else {
        const winningPlayerData = array[0];
        const followUpPlayerData = array[1] || undefined;

        if (followUpPlayerData && winningPlayerData[3] == followUpPlayerData[3]) {
            // Draw
            multiplayerOverlayTitle.set("It's a draw!");
            if (playingDuels && get(isAuthenticated) && !friendDuel) addDuelPlayed();

        } else {
            // Clear Winner
            multiplayerOverlayTitle.set(winningPlayerData[1] + " won!");
            get(peer)?.id == winningPlayerData[0] ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

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

let countdownInterval;

// This starts the round visually with a countdown
async function multiplayerOverlayCountdown() {
    if (countdownInterval) return;
    showEndscreenUI(false); // Hide Leave & End option

    let countdown = 3;

    // If this is the first countodwn to occur, register the duel
    if (playingDuels && !friendDuel && !get(peer)?.getStorage?.firstRoundPlayed) {
        registerDivisionDuel(get(peer)?.getStorage?.uuid);
    }

    countdownInterval = setInterval(async function () {
        if (countdown > 0) {
            multiplayerOverlayTitle.set(`Starting... ${countdown}`);
            get(peer)?.updateStorage("countdownActive", false);
            countdown--;
            playSound("match_countdown");
        } else {
            clearInterval(countdownInterval); // Stop the countdown
            countdownInterval = undefined;

            get(peer)?.updateStorage("overlay", false); // Hide overlay (round starts)
            get(peer)?.updateStorage("firstRoundPlayed", true);
            playSound("match_countdown_start");

            // Timer
            const serverTime = await getServerTimestamp();
            get(peer)?.updateStorage("timerStart", { timestamp: serverTime, length: get(roundLength) });
        }
    }, 1000);
}

// Timer -------------------------------------------------------------------------------------------------------------------------------------
let multiplayerTimer;
let remainingTime;

async function startMultiplayerTimer(totalDuration, startTimestamp) {
    const serverTimestamp = await getServerTimestamp();
    const duration = Math.max(0, totalDuration - (serverTimestamp - startTimestamp));
    if (Math.abs(multiplayerTimer?.getRemainingTime() - duration) <= 1) return; // If the running timer alr has this duration (with slight tolerance), skip
    multiplayerTimer = startTimer(duration, multiplayerTimerExpired);
}

function multiplayerTimerExpired() {
    const hasSubmittedMarker = get(peer)?.getStorage?.guessLocationsArray?.find((element) => element.id == get(peer)?.id);
    if (!hasSubmittedMarker) addMultiplayerGuessMarker(); // Only add default / previous marker if the player actually hasnt guessed yet...
    setTimeout(() => {
        get(peer)?.updateStorage("showResult", true);
    }, 1000); // Wait for guesses to arrive
}
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
    duelRetryEnabled, multiplayerStatus, savedGuestName, chatVisible, timeReducedOverlay, multiplayerOverlay,
    multiplayerOverlayTitle, rematchButtonVisible, leaveMatchButtonVisible, multiplayerTableArray,
    matchmakingActive, socket,
    roomcode,
    connectionCount,
    remainingPlayers,
    overlayShowSubtitle,
    skillBasedMatchmaking
} from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { loadChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { attemptDuelJoin, deleteRoomCodeFromMatchmakingServer } from "$lib/logic/matchmakingAPI";
import { generateDuelUUID, registerDivisionDuel, sendDuelDivisionResult } from "$lib/utils/duelDivisionFunctions";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { generateFunnyGuestName, generateRandomCode } from "$lib/utils/codeGenerationUtil";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { changeCategory } from "$lib/utils/changeCategory";
import { showNotification } from "$lib/utils/notifications";
import PlaySocket from "playsocketjs";
import { getMapBounds } from "$lib/utils/getMapBounds";
import { getServerTimestamp } from "$lib/utils/timeUtil";
import { signupPrompt } from "$lib/utils/signupPrompt";
import { fetchBlacklistStatus } from "$lib/utils/checkBanStatus";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";

export function getTeamFromPeerId(id) {
    const playerArray = get(socket)?.getStorage?.players?.find(item => item[0] === id);
    return playerArray?.[4];
}

// Game UI ----------------------------------------------------------------------------------------------------------------------------------
function setMultiplayerUI() {
    if (get(multiplayer)) {
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

// End round ---------------------------------------------------------------------------------------------------------------------------------
function endMultiplayerRound() {
    // Minimum result screen text in lobbies with others
    if (get(socket)?.getStorage?.players?.length > 1) {
        continueText.set("Wait 5s...");
        setTimeout(() => continueText.set("Continue"), 5000);
    } else {
        continueText.set("Continue");
    }
    enableResultScreen(get(mapPinLat), get(mapPinLng));
    get(socket)?.updateStorage("timerStart", false);
    get(socket)?.updateStorage("confirmedArray", []); // Reset confirmed guesses AFTER result to prevent multiple triggers
}

// Utility -----------------------------------------------------------------------------------------------------------------------------------
export function multiplayerStateToGuessed() {
    get(socket)?.updateStorageArray("confirmedArray", "add", get(socket)?.id);
    if (playingDuels) get(socket)?.updateStorage("timeReducedOverlay", true); // Reduce time in duels
}

export function addMultiplayerGuessMarker() {
    // Remove previous guess entry (if exists)
    const yourElement = get(socket)?.getStorage?.guessLocationsArray?.find((element) => element.id == get(socket)?.id);
    if (yourElement) get(socket)?.updateStorageArray("guessLocationsArray", "remove-matching", yourElement);
    get(socket)?.updateStorageArray("guessLocationsArray", "add", { id: get(socket)?.id, lat: get(mapPinLat), long: get(mapPinLng), pin: get(selectedPinIndex), username: get(username) || get(savedGuestName), team: getTeamFromPeerId(get(socket)?.id) });
}

export function updatePeerScore(addScore) {
    const peerIndex = get(socket)?.getStorage?.players?.findIndex(findPeer => findPeer[0] === get(socket)?.id);
    if (peerIndex !== -1) {
        const thisPlayer = get(socket)?.getStorage?.players[peerIndex];
        let newPlayer = [...thisPlayer];
        if (playingDuels && get(socket)?.getStorage?.currentRound > 3) addScore = Math.round(addScore * 1.5); // Duel Multiplayer for round 4 + 5
        newPlayer[3] = newPlayer[3] + addScore;
        get(socket)?.updateStorageArray("players", "update-matching", thisPlayer, newPlayer);
    }
}

// Create multiplayer instance -----------------------------------------------------------------------------------------------------------------------
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
            socket.set(new PlaySocket(uniqueUserID, {
                endpoint: `${get(accountUrl)}/socket`
            }));

            // Register event listeners
            get(socket).onEvent('status', status => multiplayerStatus.set(status));
            get(socket).onEvent('status', status => console.log(status)); // !TODO remove debug (future)
            get(socket).onEvent('error', (error) => {
                if (get(multiplayer)) errorPopup("Multiplayer error", "The multiplayer system reports an error.", error);
            });

            // Initialize and open connection
            await get(socket).init();

            // Someone connected...
            get(socket).onEvent('clientConnected', (id) => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // Delete roomcode from server
                if (playingDuels && !get(socket)?.getStorage?.gameOngoing) startRoom(); // Immediately start on first connection
                connectionCount.set(get(socket)?.connectionCount);
            });

            // Someone disconnected...
            get(socket).onEvent('clientDisconnected', (id) => {
                const name = get(socket)?.getStorage?.players?.find((p) => p[0] == id)?.[1] || "Unknown";
                if (get(socket)?.isHost) get(socket)?.updateStorageArray("chats", "add", `System: ${name} left.`);
                removePlayerById(id);
                connectionCount.set(get(socket)?.connectionCount);
            });

            get(socket).onEvent('hostMigrated', () => {
                if (!get(socket)?.getStorage?.gameOngoing && get(multiplayer) && get(socket)?.isHost) startRoom();
            });

            let playerAdded;
            let startMultiplayerRoundTimeout;

            get(socket).onEvent('storageUpdated', (storage) => {
                storage = JSON.parse(JSON.stringify(storage));
                console.log(storage);
                // Sync game info
                if (storage.roundAmount && storage.roundLength && storage.teamAmount && storage.restriction) {
                    roundAmount.set(storage?.roundAmount);
                    roundLength.set(storage?.roundLength);
                    teamAmount.set(storage?.teamAmount);
                }

                // If player is not already in the room, add player info
                if (!playerAdded && get(socket)?.getStorage?.players?.findIndex((player) => player[0] == get(socket)?.id) == -1) {
                    playerAdded = true;

                    // Calculate the team
                    const playerCount = get(socket)?.getStorage?.players.length;
                    const teamNumber = get(teamAmount) <= 1 ? 1 : ((playerCount % get(teamAmount)) + 1);

                    get(socket)?.updateStorageArray("players", "add-unique", [get(socket)?.id, get(username) || get(savedGuestName), get(elo), 0, teamNumber, localStorage.getItem("id"), get(selectedBadge)]);
                    if (get(socket)?.getStorage?.highestSupporterLevel < (get(supporterLevel) || 0)) get(socket)?.updateStorage("highestSupporterLevel", get(supporterLevel));
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
                    modeText.set("Multiplayer (Round: " + get(socket)?.getStorage?.currentRound + "/" + get(roundAmount) + ")");
                    setRestriction(storage.restriction);
                    if (storage.restriction !== "standard" && storage.restriction) modeText.set(get(modeText) + " (" + storage.restriction + ")");
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
                if (storage.showResult !== undefined && storage.showResult !== get(resultScreenEnabled)) {
                    if (storage.showResult == true) {
                        // Ensure the coords are set, in case they join during result screen
                        currentLocationLatitude.set(storage?.location[0]);
                        currentLocationLongitude.set(storage?.location[1]);
                        endMultiplayerRound();
                    } else {
                        disableResultScreen();
                        get(socket)?.updateStorage("overlay", true);

                        // Start new round
                        if (storage.currentRound < get(roundAmount)) {
                            clearTimeout(startMultiplayerRoundTimeout); // Prevent multiple calls
                            startMultiplayerRoundTimeout = setTimeout(startMultiplayerRound, 1500);
                        }
                    }
                }

                // Check if all guesses are in, and if so, end round
                if (storage.players?.length && storage.confirmedArray?.length >= storage.players?.length && get(resultScreenEnabled) == false && !storage?.showResult) {
                    get(socket)?.updateStorage("showResult", true);
                }

                // Set coordinates
                if (storage.location && storage.currentRound >= 1 && (get(currentLocationLatitude) != storage?.location[0] || get(currentLocationLongitude) != storage?.location[1]) && !get(socket)?.isHost) {
                    console.log("Generating to adjust coords");
                    checkGenerationTypeAndGenerate();
                }

                if (storage.countdownActive) multiplayerOverlayCountdown(); // Activate countdown

                if (storage.timerStart) startMultiplayerTimer(storage.timerStart?.length, storage.timerStart?.timestamp); // Set timer if not running
                if (!storage.timerStart && multiplayerTimer?.isTimerRunning()) try { multiplayerTimer?.stopTimer(); } catch { }; // Stop multiplayer timer

                if (storage.timeReducedOverlay && storage.timeReducedOverlay !== get(timeReducedOverlay) && storage?.confirmedArray?.length === 1) {
                    showTimeReducedOverlay(15, !storage?.confirmedArray?.includes(get(socket)?.id));
                }

                if (storage.rematch && get(socket)?.isHost) multiplayerPerformRematch();
            });

            get(socket).onEvent('instanceDestroyed', () => {
                if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer(); // If error...
                if (!get(multiplayer)) return; // If already left, do not make further changes
                leaveMultiplayerRound(false);
            });

            resolve(get(socket).id);
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
    attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
}

// This occurs when the peer connect returns an error like peer_unavailable (means = doesn't exist)
function findNextDuel() {
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex, get(skillBasedMatchmaking));
    } else {
        matchmakingActive.set(false);
        multiplayerStatus.set("Couldn't connect to any room.");
    }
}

// Duel Guess Time Reduce Overlay & reduce remaining time
async function showTimeReducedOverlay(time, show) {
    if (time && multiplayerTimer?.getRemainingTime() > 15) {
        const serverTime = await getServerTimestamp();
        get(socket)?.updateStorage("timerStart", { timestamp: serverTime, length: time }); // Start timer with new time
    }
    if (show && !get(timeReducedOverlay)) {
        try {
            timeReducedOverlay.set(true);
            playSound("time_reduced");
            setTimeout(() => {
                timeReducedOverlay.set(false);
                get(socket)?.updateStorage("timeReducedOverlay", false);
            }, 3000)
        } catch (error) { console.warn("Error showing time reduce overlay:", error) }
    }
}

// Host Logic ----------------------------------------------------------------------------------------------
function removePlayerById(id) {
    const index = get(socket)?.getStorage?.players?.findIndex(entry => entry[0] === id);
    if (index >= 0) {
        const contentToRemove = get(socket)?.getStorage?.players[index];
        get(socket)?.updateStorageArray("players", "remove-matching", contentToRemove);
    }
}

export async function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds, sizeLimit, restriction) {
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

        const code = await get(socket)?.createRoom({
            players: [],
            roundAmount: get(roundAmount),
            currentRound: 0,
            roundLength: get(roundLength),
            teamAmount: get(teamAmount),
            highestSupporterLevel: get(supporterLevel) || 0,
            restriction: restriction || "standard",
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
            gameOngoing: false, // True after the room was started once and is not in creation phase
            countdownActive: false,
            timerStart: false
        }, sizeLimit);

        roomcode.set(code);
        if (get(matchmakingActive)) multiplayerStatus.set("Waiting for opponent..."); // Wait status

    } catch (error) {
        matchmakingActive.set(false);
        console.error("Error setting up room:", error);
        errorPopup("Error creating room", "Error occured trying to set up room.", error);
    }
}

// Start room (HOST function)
export function startRoom() {
    multiplayer.set(true);
    setMultiplayerUI();
    matchmakingActive.set(false);
    goto("/"); // Creation page -> home
    get(socket)?.updateStorage("gameOngoing", true);
    startMultiplayerRound();
}

function multiplayerPerformRematch() {
    console.log("Rematching");
    get(socket)?.updateStorage("rematch", false);
    get(socket)?.updateStorage("firstRoundPlayed", false);
    get(socket).updateStorage("currentRound", 0);

    // Reset player scores
    const playersArray = get(socket)?.getStorage?.players;
    playersArray.forEach((element) => {
        element[3] = 0;
    });
    get(socket)?.updateStorage("players", playersArray);
    startRoom();
}

async function startMultiplayerRound() {
    if (!get(socket)?.isHost) return;
    await checkGenerationTypeAndGenerate();
    get(socket)?.updateStorage("location", [get(currentLocationLatitude), get(currentLocationLongitude)]); // Set coordinates
    get(socket)?.updateStorage("guessLocationsArray", []); // Reset guesses
    get(socket)?.updateStorage("timeReducedOverlay", false); // Ensure no reduced timer from before interferes

    // Countdown
    get(socket)?.updateStorage("countdownActive", true);
    get(socket)?.updateStorage("currentRound", get(socket)?.getStorage?.currentRound + 1);
    get(socket)?.updateStorageArray("chats", "add", `System: Starting round ${get(socket)?.getStorage?.currentRound}.`);
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
        modeText.set("Multiplayer (...)");
        multiplayer.set(true);
        await get(socket).joinRoom(code);
        matchmakingActive.set(false);
        setMultiplayerUI();
        goto("/");
        get(socket)?.updateStorageArray("chats", "add", `System: ${get(username) || get(savedGuestName)} joined.`);
    } catch (error) {
        multiplayer.set(false);
        console.error("Error occured joining room:", error); // Status will be set by playpeerjs / playsocketjs
        if (get(matchmakingActive)) findNextDuel();
    }
}

// Multiplayer leave ----------------------------------------------------------------------------------
export function leaveMultiplayerRound(destroy = true) {
    // Disable Multiplayer & Matchmaking
    const wasMultiplayerEnabled = get(multiplayer);
    multiplayer.set(false);
    matchmakingActive.set(false);

    if (destroy) get(socket)?.destroy(); // Destroy peer
    try { multiplayerTimer?.stopTimer() } catch { }; // Result screen timer (sometimes not set, therefore catch)

    // Clear running intervals
    clearInterval(countdownInterval);
    countdownInterval = undefined; // Tell overlay countdown it is not running

    screenEscapeDisabled.set(false); // Make Back and Close visible
    duelRetryEnabled.set(false); // Make Duel retry button disabled (Standard)

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    connectionCount.set(0);
    playingDuels = false;
    friendDuel = false;
    roomcode.set("loading...");

    // General UI resets
    continueText.set("Continue");
    multiplayerStatus.set(); // Undefined -> show default msgs

    // UI functions
    setMultiplayerUI();
    showMultiplayerOverlay(false);
    updateMinimapWithTeamMarkers([]); // clean up multiplayer minimap markers
    if (localStorage.getItem("selectedMap") !== "country guessr") mapVisible.set(true);

    if (wasMultiplayerEnabled) {
        setRestriction("standard");
        checkGenerationTypeAndGenerate();
    } // Regenerate location
}

// Panorama Overlay UI ------------------------------------------------------------------------------------------------------------------------------------------
function showEndscreenUI(show) {
    if (show) {
        leaveMatchButtonVisible.set(true); // show leave / end button
        if (!playingDuels || friendDuel) rematchButtonVisible.set(true); // Don't show rematch button in non-friend duels
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
        if (get(socket)?.getStorage?.firstRoundPlayed) multiplayerOverlayTitle.set("Results from round " + get(socket)?.getStorage?.currentRound);
        if (!get(socket)?.getStorage?.firstRoundPlayed) multiplayerOverlayTitle.set("Waiting...");
        if (!get(socket)?.getStorage?.firstRoundPlayed) modeText.set("Multiplayer (" + (get(socket)?.getStorage?.category)?.replace("community_", "") + ")");
        overlayShowSubtitle.set(playingDuels && get(socket)?.getStorage?.currentRound >= 3 && get(socket)?.getStorage?.currentRound < 5);

        showEndscreenUI(false); // Default to no endscreen UI

        const isTeams = get(teamAmount) > 1;

        confirmButtonActive.set(false); // Set the confirm button to the grey "inactive" state (when on guess was made yet)
        mapVisible.set(false); // Hide map
        if (get(socket)?.getStorage?.currentRound >= get(roundAmount)) determineWinner(get(multiplayerTableArray), isTeams, isTeams ? teams : undefined); // Win / Lose

    } else {
        if (get(multiplayer) || localStorage.getItem("selectedCategory") !== "country guessr") mapVisible.set(true);
    }
}

function determineWinner(array, teams, teamsObject) {
    if (teams) {
        const winningTeamIndex = array[0]?.teamIndex;
        let teamColorName = teamsObject[winningTeamIndex]?.colorName;
        multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);
        const yourTeam = (get(socket)?.getStorage?.players?.find((e) => e[0] == get(socket)?.id))[4];
        yourTeam == winningTeamIndex ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

    } else {
        const winningPlayerData = array[0];
        const followUpPlayerData = array[1] || null;

        if (followUpPlayerData && winningPlayerData?.[3] == followUpPlayerData?.[3]) {
            // Draw
            multiplayerOverlayTitle.set("It's a draw!");
            if (playingDuels && get(isAuthenticated) && !friendDuel) addDuelPlayed();

        } else {
            // Clear Winner
            multiplayerOverlayTitle.set(winningPlayerData?.[1] + " won!");
            get(socket)?.id == winningPlayerData?.[0] ? setTimeout(() => { playSound("win_sound") }, 1000) : setTimeout(() => { playSound("lose_sound") }, 1000);

            // Check if you won in duels or just played
            if (playingDuels && !friendDuel) {
                const won = winningPlayerData?.[5] == localStorage.getItem("id");
                won ? addDuelWon() : addDuelPlayed();
                sendDuelDivisionResult(won, get(socket)?.getStorage?.uuid);
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
    if (playingDuels && !friendDuel && !get(socket)?.getStorage?.firstRoundPlayed) {
        registerDivisionDuel(get(socket)?.getStorage?.uuid);
    }

    countdownInterval = setInterval(async function () {
        if (countdown > 0) {
            multiplayerOverlayTitle.set(`Starting... ${countdown}`);
            get(socket)?.updateStorage("countdownActive", false);
            countdown--;
            playSound("match_countdown");
        } else {
            clearInterval(countdownInterval); // Stop the countdown
            countdownInterval = null;

            get(socket)?.updateStorage("overlay", false); // Hide overlay (round starts)
            get(socket)?.updateStorage("firstRoundPlayed", true);
            playSound("match_countdown_start");

            // Timer
            const serverTime = await getServerTimestamp();
            get(socket)?.updateStorage("timerStart", { timestamp: serverTime, length: get(roundLength) });
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
    const hasSubmittedMarker = get(socket)?.getStorage?.guessLocationsArray?.find((element) => element.id == get(socket)?.id);
    if (!hasSubmittedMarker) addMultiplayerGuessMarker(); // Only add default / previous marker if the player actually hasnt guessed yet...
    setTimeout(() => {
        get(socket)?.updateStorage("showResult", true);
    }, 1000); // Wait for guesses to arrive
}
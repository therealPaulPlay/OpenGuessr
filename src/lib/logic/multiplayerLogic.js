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
import { highestMultiplayerSupporterLevel, peerId, isHost, connectedPlayers, coordsFromHost, teamAmount, roundAmount, roundLength, screenEscapeDisabled, duelRetryEnabled, multiplayerStatus, restrictionButtonText, savedGuestName, chatVisible, timeReducedOverlay, timeReducedOverlayText, multiplayerOverlay, multiplayerOverlayTitle, rematchButtonEnabled, rematchButtonVisible, leaveMatchButtonVisible, multiplayerTableArray, yourTeam, multiplayerGuessesLocationsArray, roomLocked, matchmakingActive } from "$lib/stores/context-specific/multiplayerStore";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
import { resetChat, addToChat } from "$lib/utils/chatFunctions.js";
import { setRestriction } from "$lib/utils/setRestriction";
import { attemptDuelJoin, deleteRoomCodeFromMatchmakingServer } from "$lib/logic/roomAPI";
import { generateDuelUUID, sendDuelDivisionResult, checkRankedLeavePenalty, removeRankedLeavePenalty } from "$lib/utils/duelDivisionFunctions";
import { currentlyLoadedLocationsArray } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { changeCategory } from "$lib/utils/changeCategory";
import { showNotification } from "$lib/utils/notifications";

// Team display on Host Page  ------------------------------------------------------------------------------------------------
function updateTeamIndexes() {
    const amountOfTeams = get(teamAmount);
    let index = 1;
    let teams = {};
    let noTeamPlayers = [];

    // Initialize teams array if amountOfTeams is more than 1
    if (amountOfTeams > 1) {
        for (let i = 1; i <= amountOfTeams; i++) {
            teams[i] = [];
        }
    }

    // Update team index for connected peers
    connectedPlayers.update((array) => {
        const newArray = [...array]; // Create a new array to update the store
        newArray.forEach((element) => {
            if (amountOfTeams === 1) {
                // Collect all players for "No team"
                noTeamPlayers.push(element[1]);
            } else {
                // Distribute players in teams starting from team 1
                const teamIndex = index;
                teams[teamIndex].push(element[1]);
                element[4] = teamIndex; // Update the team index on the player data
                index = (index % amountOfTeams) + 1; // Increment index circularly from 1 to amountOfTeams
            }
        });
        return newArray;
    });
}

// Get Team from Peer ---------------------------------------------------------------------------------------------------------------------------------
function getTeamFromPeerId(id) {
    const playerArray = get(connectedPlayers).find(item => item[0] === id);
    return playerArray[4];
}

// Restriction Toggle -------------------------------------------------------------------------------------------------------------------------------
let multiplayerRestriction = "standard";
let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
let restrictionsText = ["Standard", "NMPZ", "Grayscale", "Invert Colors", "Hue Shift", "Blink (Fade)"];
let currentRestrictionIndex = 0;

export function toggleMultiplayerRestriction() {
    if (get(restrictionButtonText) == "Standard") {
        currentRestrictionIndex = 1; // Start from the first restriction after standard
    } else {
        currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
    }

    multiplayerRestriction = restrictions[currentRestrictionIndex];
    restrictionButtonText.set(restrictionsText[currentRestrictionIndex]);
}

// Game UI ----------------------------------------------------------------------------------------------------------------------------------
function setMultiplayerUI() {
    if (get(multiplayer)) {
        mapModeIndicatorVisible.set(true);
        leaveFunction.set(() => {
            showConfirmPopup("Leave match?", "You are about to leave the multiplayer room. Are you sure?", leaveMultiplayerRound, false);
            playSound("leave_round");
        });

        modeText.set("Multiplayer (Awaiting info..)");
        chatVisible.set(true);

        // disable result screen if it is open (edge case)
        disableResultScreen();
    } else {
        mapModeIndicatorVisible.set(false);
        leaveFunction.set();
        chatVisible.set(false);
    }
}

// if the timer expires for peers or host
let endMultiplayerRoundIfGuessMissing;

export function multiplayerTimerExpired() {
    confirmButtonClicks(); //only do this if the player actually hasnt guessed yet...

    // when the timer expires, but a peer doesn't respond by executing confirmButtonCliks --> still end the round after 2000ms
    if (get(isHost)) {
        endMultiplayerRoundIfGuessMissing = setTimeout(function () {
            endMultiplayerRound();
        }, 2000);
    }
}

let roundEnded = false; // for host only! Used to prevent ending the round from the host's side multiple times (error prevention)
let lateJoinedWaiting = false; // For a peer that late joins and then shouldn't see the result of where he didnt participate.

let autoSkipResult;

export function clearAutoSkipTimeout() {
    clearTimeout(autoSkipResult);
}

function endMultiplayerRound() {
    if (!roundEnded) {
        if (get(isHost)) {
            clearTimeout(endMultiplayerRoundIfGuessMissing);
            sendMessageToAll("roundOver");
            // Continue button will be disabled, whenever the text contains the word "Wait" - no pointer events none necessary here
            let skipTimeout = playingDuels ? 5000 : 2000;
            continueText.set("Wait " + (skipTimeout / 1000) + "s...");

            // After 2 seconds (or 5 for duels), enable the skip functionality
            setTimeout(function () {
                continueText.set("Continue");
            }, skipTimeout)

            // After 10 seconds, skip automatically to not let peers wait too long in Duels
            if (playingDuels) {
                autoSkipResult = setTimeout(() => { transitionToStart() }, 10000);
            }

        } else {
            continueText.set("Waiting..."); // Also disables the continue button (if "wait" is included in text)
        }

        if (!lateJoinedWaiting) enableResultScreen(get(mapPinLat), get(mapPinLng));
        try { multiplayerTimer.stopTimer(); } catch { }; // stop multiplayer timer
        roundEnded = true;
    } else {
        console.warn("Multiplayer round already ended!");
    }
}

let multiplayerHasAlreadyGuessed = false;

export function multiplayerStateToGuessed() {
    if (!multiplayerHasAlreadyGuessed) {
        distributeChat("System: " + (get(username) || get(savedGuestName)) + " guessed.");
    }

    if (get(isHost)) {
        if (!multiplayerHasAlreadyGuessed) {
            multiplayerGuessesLocationsArray.update((array) => {
                return [...array, [get(mapPinLat), get(mapPinLng), get(selectedPinIndex), get(username) || get(savedGuestName), get(peerId)]];
            });
            multiplayerHasGuessed(); // this substracts one from the total requried guesses (and maybe ends the round)
        }

    } else {
        if (!multiplayerHasAlreadyGuessed) {
            peerSendsHost("guessed", {
                lat: get(mapPinLat),
                long: get(mapPinLng),
                style: get(selectedPinIndex),
                name: get(username) || get(savedGuestName)
            });
        }
    }

    multiplayerHasAlreadyGuessed = true;

    // Reduce time for the opponent in duels (after setting ..hasGuessed!)
    if (playingDuels) {
        if (get(isHost)) {
            sendMessageToAll("timeReduce", 15); // 15 seconds
            showTimeReduceOverlay(15, true); // reduce time for the host too
        } else {
            peerSendsHost("timeReduce", 15); // 15 seconds, the host will respond with a time reduce for everyone
        }
    }
}

let totalRequiredGuesses = 0;

export function multiplayerHasGuessed() {
    if (get(multiplayer)) {
        sendMessageToAll("guessesArray", get(multiplayerGuessesLocationsArray));
        totalRequiredGuesses--;
        if (totalRequiredGuesses <= 0) endMultiplayerRound();
    }
}

export function showMultiplayerRoundResults() {
    sendMessageToAll("showPlayersArrayAfterRound", get(connectedPlayers));
    showMultiplayerOverlay(true, "Results from round " + roundIndex); //also load the results on the host's side
}

export function updatePeerDataScore(peerId, addScore) {
    const peerIndex = get(connectedPlayers).findIndex(peer => peer[0] === peerId);

    if (peerIndex != -1) {
        const currentScore = get(connectedPlayers)[peerIndex][3];
        const newScore = currentScore + addScore;

        connectedPlayers.update((array) => {
            array[peerIndex][3] = newScore;
            return array;
        });
    }
}

// Assign Name or Alias  ---------------------------------------------------------------------------------------------------------------------------
let roundIndex = 1; //the index of the current round, starts with the first round

function generateRandomCode(length) {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}

function generateFunnyGuestName() {
    let animals = ["Giraffe", "Ape", "Sloth", "Penguin", "Kangaroo", "Panda", "Zebra", "Llama", "Hippo", "Parrot", "Cat", "Dog", "Slug", "Crow", "Elephant"];
    let randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    savedGuestName.set("Guest" + randomAnimal);
}

// Load PeerJS -----------------------------------------------------------------------------------------------------------------------
let peer;

export async function getPeer() {
    try {
        // Destroy existing Peer instance if it exists
        if (peer) peer.destroy();
        peerId.set("loading...");
        multiplayerStatus.set("Initializing new PeerJS instance...");

        // Generate a unique user ID
        let uniqueUserID;
        if (localStorage.getItem("id")) {
            uniqueUserID = "openguessr_" + Number(localStorage.getItem("id")).toString(16) + generateRandomCode(2);
        } else {
            uniqueUserID = "openguessr_" + "g" + generateRandomCode(7);
            generateFunnyGuestName();
        }

        // Load the PeerJS library and create a new instance
        const Peer = await loadAndInitializeLibrary(
            'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
            'Peer',
            (Peer) => Peer
        );

        return new Promise((resolve) => {
            // Create the new Peer instance
            peer = new Peer(uniqueUserID, {
                config: {
                    'iceServers': [
                        { urls: "stun:fastturn.pro:5349", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "turns:fastturn.pro:5349", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                        { urls: "turn:fastturn.pro:3478", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                    ]
                }
            });

            // Attach event listeners
            attachErrorEvents();
            attachHostLogic();

            // Resolve once the peer is open
            peer.on('open', (id) => {
                peerId.set(id); // Store the peer ID
                resolve(peer); // Resolve the promise with the peer instance
            });
        });
    } catch (error) {
        console.error("Error getting peer:", error);
    }
}

// Joining via Links (also as a guest!) -------------------------------------------------------------------------------------

// Called in accountLogic after signin status was set
export function attemptJoinViaLink() {
    let urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("join");
    if (roomCode) joinFromLink(roomCode);
}

export function joinFromLink(roomcode) {
    console.log("Attempting join via Room Code Link:", roomcode);
    linkJoinPopup.set(true);
    joinRoom(roomcode);
}

// Chat -----------------------------------------------------------------------------------------------------

// For peers and hosts, this is how you send messages
export function distributeChat(text) {
    try {
        if (get(isHost)) {
            addToChat(text);
            sendMessageToAll("chat", text);
        } else {
            peerSendsHost("chat", text); //don't add it to the chat yet - the msg will be sent to the host, the host will then send it to all peers which will add it to chat
        }
    } catch (error) {
        console.error("Error sending multiplayer message: " + error);
    }
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

// this initiates the find duel system
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

    roomIndex = 0; // reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
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
    time = Number(time);
    let timeReduceOverlayTimer;
    clearTimeout(timeReduceOverlayTimer);

    if (!hide) {
        try {
            if (multiplayerTimer.isTimerRunning() && multiplayerTimer.getRemainingTime() > 3) { // only show overlay if it the remaining time is above 3s
                timeReducedOverlay.set(true);
                playSound("time_reduced");

                timeReduceOverlayTimer = setTimeout(() => {
                    timeReducedOverlay.set(false);
                }, 3000)
            }
        } catch { console.warn("Error showing time reduce overlay: " + error) }

    } else {
        timeReducedOverlay.set(false);
    }

    if (time != 0) {
        try {
            if (multiplayerTimer.isTimerRunning() && multiplayerTimer.getRemainingTime() > time) {
                multiplayerTimer.stopTimer();
                multiplayerTimer = startTimer(time, multiplayerTimerExpired); // Start the timer with new time
                timeReducedOverlayText.set(`Time reduced to ${time}s.`);
            } else {
                timeReducedOverlayText.set("Time remains unaffected.");
            }
        } catch (error) {
            timeReducedOverlayText.set("Time error occured.");
            console.warn("Could not set new timer for duels in showTimerReduceOverlay" + error);
        }
    }
}

// Host Logic ----------------------------------------------------------------------------------------------
let multiplayerFirstRoundPlayed = false; // for host and peers! peers use this to see whether they should incrase the round index

function removeConnectedPeerById(peerId) {
    const index = get(connectedPlayers).findIndex(entry => entry[0] === peerId);

    if (index !== -1) {
        connectedPlayers.update((array) => {
            array.splice(index, 1); // Splice itself returns the removed element, so don't return that!
            return array;
        }); // splice: startindex, deletecount (here 1)
    }
}

function attachHostLogic() {
    peer.on('open', function (id) {

        // Set up event listener for incoming connections (HOST LOGIC)
        peer.on('connection', function (incomingConn) {
            if (!get(roomLocked)) {

                // instantly lock the room on the first connection
                if (get(matchmakingActive) || friendDuel) roomLocked.set(true);

                let brokenConnectionTimeout = setTimeout(() => {
                    // Unlock the room & disconnect non-working peer if connection fails to open within 2 seconds
                    if (!incomingConn.open) {
                        roomLocked.set(false);
                        incomingConn.close();
                        distributeChat("System: " + incomingConn.metadata.username + " kicked (no response from peer).");
                    }
                }, 2000);

                // Event listener for when the connection is open
                incomingConn.on('open', function () {
                    connectedPlayers.update((array) => {
                        array.push([incomingConn.peer, incomingConn.metadata.username, incomingConn.metadata.elo, incomingConn.metadata.score, 1, incomingConn.metadata.id, incomingConn.metadata.badge]);
                        return array;
                    });

                    if (incomingConn.metadata.supporterLevel > get(highestMultiplayerSupporterLevel)) {
                        highestMultiplayerSupporterLevel.set(incomingConn.metadata.supporterLevel);
                    }

                    updateTeamIndexes();
                    clearTimeout(brokenConnectionTimeout); // stop the broken-connection kick timer

                    const initialMessage = {
                        type: "initialize",
                        content: {
                            roundAmount: get(roundAmount),
                            currentRound: roundIndex,
                            roundLength: get(roundLength),
                            teamAmount: get(teamAmount),
                            team: getTeamFromPeerId(incomingConn.peer),
                            multiplayerRestriction: multiplayerRestriction,
                            category: localStorage.getItem("selectedCategory") || "standard",
                            mapLocationsArray: get(currentlyLoadedLocationsArray),
                            uuid: duelUUID // Used for duel validation
                        }
                    }

                    // Send messages
                    incomingConn.send(initialMessage);
                    distributeChat("System: " + incomingConn.metadata.username + " joined.");

                    // whether the first round has been played & the starting screen should be shown
                    if (!multiplayerFirstRoundPlayed) {
                        sendMessageToAll("showPlayersArray", get(connectedPlayers)); // send it to peer
                        showMultiplayerOverlay(true, "Waiting..."); // also show it for host
                    } else {
                        const waitingMessage = {
                            type: "lateJoin",
                            content: get(connectedPlayers)
                        }
                        incomingConn.send(waitingMessage);
                    }

                    // If duels matchmaking is active, immediately start the round on the first OPEN connection
                    if (get(matchmakingActive)) {
                        deleteRoomCodeFromMatchmakingServer(); // Delete roomcode from server
                        startRoom(); // This also locks the room
                    }

                    if (friendDuel) {
                        startRoom(); // This also locks the room
                    }
                });

                // Receive messages
                incomingConn.on('data', function (data) {
                    if (data.type == "guessed") {
                        multiplayerGuessesLocationsArray.update((array) => {
                            return [...array, [data.content.lat, data.content.long, data.content.style, data.content.name, incomingConn.peer]];
                        });

                        // This updates the array for all peers too
                        multiplayerHasGuessed();
                    }

                    if (data.type == "score") {
                        updatePeerDataScore(incomingConn.peer, data.content);
                    }

                    if (data.type == "chat") {
                        distributeChat(data.content);
                    }

                    if (data.type == "teamMarkers") {
                        addReplaceTeamMarkers(data.content.id, data.content.lat, data.content.long, data.content.pin, data.content.team);
                        sendMessageToAll("teamMarkers", teamMarkerArray);
                        if (get(teamAmount) > 1) { updateMinimapWithTeamMarkers(teamMarkerArray) };
                    }

                    if (data.type == "timeReduce") {
                        sendMessageToAll("timeReduce", data.content); // send time reduce to everyone if one peer has guessed

                        if (!multiplayerHasAlreadyGuessed) {
                            showTimeReduceOverlay(data.content, false);
                        } else {
                            showTimeReduceOverlay(data.content, true); // only show the warning overlay if player has not already guessed
                        }
                    }
                });

                function handlePeerDisconnect() {
                    removeConnectedPeerById(incomingConn.peer);
                    updateTeamIndexes();
                    distributeChat("System: " + incomingConn.metadata.username + " left.");

                    // if peer disconnects pre-game, update the waiting screen
                    if (!multiplayerFirstRoundPlayed) {
                        sendMessageToAll("showPlayersArray", get(connectedPlayers));
                        showMultiplayerOverlay(true, "Waiting...");
                    } else {
                        // if already in round, count it as a guess & update players data
                        multiplayerHasGuessed();
                        sendMessageToAll("updateConnectedPlayers", get(connectedPlayers));
                    }
                }

                // Peer close (disconnect event would be from signalling server - not from host)
                incomingConn.on('close', handlePeerDisconnect);
            } else {
                setTimeout(() => {
                    incomingConn.close(); // Close the connection if room is locked (= the round has alr started)
                }, 1000);
            }
        });
    });
}

export async function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds) {
    await getPeer(); // Get new peer instance

    multiplayerStatus.set("Room created. Please wait <10s");
    isHost.set(true);
    multiplayerFirstRoundPlayed = false;

    // Add yourself (host) to the overview
    connectedPlayers.update((array) => {
        array.push([get(peerId), get(username) || get(savedGuestName), get(elo), 0, 1, localStorage.getItem("id"), get(selectedBadge)]);
        return array;
    });

    // Check if map is valid for multiplayer
    if (!mapSupportsMultiplayer(localStorage.getItem("selectedCategory") || "standard")) {
        showNotification("Unsupported map changed to Standard.")
        changeCategory("standard", true); // Regenerate to update locations array
    }

    yourTeam.set(1);
    showMultiplayerOverlay(true, "Waiting...");
    updateTeamIndexes();

    // set round and length parameters
    roundAmount.set(AmountOfRounds);
    roundLength.set(LengthOfRounds);

    // set supporter level to own supporter level as baseline
    highestMultiplayerSupporterLevel.set(get(supporterLevel) || 0);

    // Generate random duel UUID (only used in duels)
    duelUUID = generateDuelUUID();

    // unlock room
    roomLocked.set(false);
}

// Start room (HOST function)
export function startRoom() {
    multiplayerStatus.set("Starting! Loading location...");
    multiplayer.set(true);
    setMultiplayerUI();
    showMultiplayerOverlay(true, "Ready..."); //only for host, also to set the map category in mode text
    sendMessageToAll("showPlayersArray", get(connectedPlayers)); //this is for the peers (the same thing as showMultiplayerOverlay for host)
    checkGenerationTypeAndGenerate();
    if (playingDuels) roomLocked.set(true);
    matchmakingActive.set(false);
}

export function multiplayerRematch() {
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;
    multiplayerFirstRoundPlayed = false;
    roundIndex = 1;

    connectedPlayers.update((array) => {
        const newArray = [...array];
        newArray.forEach((element) => {
            element[3] = 0; // Reset scores
        });
        return newArray;
    });

    sendMessageToAll("rematch");
    startRoom();

    // Disable the rematch button to avoid multiple clicks + give feedback
    rematchButtonEnabled.set(false);
}

// Start the first / next round (HOST)
export async function startMultiplayerRound(latitude, longitude) {
    multiplayerGuessesLocationsArray.set([]);
    teamMarkerArray = [];
    totalRequiredGuesses = get(connectedPlayers).length; // this is being set here as well as after the countdown (in case sb latejoins)

    if (!multiplayerFirstRoundPlayed) {
        goto("/"); // Go to home if starting from different page
        multiplayerFirstRoundPlayed = true;
    } else {
        roundIndex++
        if (roundIndex > get(roundAmount)) {
            return;
        } else {
            // if it is not the first round, wait to show the results properly
            await new Promise(resolve => { setTimeout(resolve, 1500); });
        }
    }

    sendMessageToAll("start", { coordinates: [latitude, longitude], highestSupporterLevel: get(highestMultiplayerSupporterLevel) });
    distributeChat("System: Starting Round " + roundIndex);
    multiplayerOverlayCountdown(); // For Host
}

// Function to send a message from host to all peers
export function sendMessageToAll(type, message) {
    try {
        get(connectedPlayers).forEach((peerInfo) => {
            const peerId = peerInfo[0]; // Peer ID is the first element in each peerInfo array
            if (peerId) { // Ensure peerId is defined

                const connections = peer.connections[peerId];

                if (connections && connections.length > 0) {
                    connections.forEach(function (conn) {
                        try {
                            conn.send({
                                type: type,
                                content: message
                            });
                        } catch (e) {
                            console.error("Failed to send message to peer:", e);
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error sending host message to all peers:", error);
    }
}

// Function to disconnect all peers and close the room
function disconnectAllPeersAndCloseRoom() {
    if (get(isHost)) {
        if (peer && get(connectedPlayers).length > 1) {
            try {
                for (let peerId in peer.connections) {
                    peer.connections[peerId].forEach(function (connection) {
                        connection.close();
                    });
                }
            } catch (error) {
                console.error("Error disconnecting all peers in multiplayer js: " + error);
            }
        }
    }

    connectedPlayers.set([]);
    updateTeamIndexes();
}

let teamMarkerArray = [];

export function sendTeamMarkers(lat, long) {
    if (get(multiplayer)) {
        if (get(isHost)) {
            addReplaceTeamMarkers(get(peerId), lat, long, get(selectedPinIndex), get(yourTeam));
            sendMessageToAll("teamMarkers", teamMarkerArray);
        } else {
            peerSendsHost("teamMarkers", { id: get(peerId), lat: lat, long: long, pin: get(selectedPinIndex), team: get(yourTeam) });
        }
    }
}

function addReplaceTeamMarkers(id, lat, long, pinIndex, team) {
    const index = teamMarkerArray.findIndex(entry => entry[0] == id);
    if (index !== -1) {
        teamMarkerArray.splice(index, 1);
    }

    teamMarkerArray.push([id, lat, long, pinIndex, team]);
}

// Peer Logic -----------------------------------------------------------------------------------------------------------------
let conn; // the connection data

export async function joinRoom(code) {
    await getPeer();

    code = code.replaceAll(" ", ""); // Remove whitespaces
    code = code.toLowerCase(); // Ensure lowercase
    
    isHost.set(false);
    multiplayerFirstRoundPlayed = false;
    multiplayerStatus.set("Attempting join...");

    const options = {
        metadata: {
            username: get(username) || get(savedGuestName),
            elo: get(elo),
            score: 0,
            id: localStorage.getItem("id"),
            badge: get(selectedBadge),
            supporterLevel: get(supporterLevel)
        },
        reliable: true // WebRTC ordered mode
    };

    conn = peer.connect("openguessr_" + code, options);

    // Event listener for when the connection is opened
    conn.on('open', () => multiplayerStatus.set("Connection opened..."));

    // Receive messages
    conn.on('data', function (data) {

        if (data.type === "initialize") {
            multiplayerStatus.set("Joined!");
            multiplayer.set(true);

            setMultiplayerUI();
            goto("/");
            linkJoinPopup.set(false);
            matchmakingActive.set(false);
            roundAmount.set(data.content.roundAmount);
            roundLength.set(data.content.roundLength);
            teamAmount.set(data.content.teamAmount);
            multiplayerRestriction = data.content.multiplayerRestriction;
            const hostMapCategory = data.content.category;
            currentlyLoadedLocationsArray.set(data.content.mapLocationsArray); // For score and map zoom
            yourTeam.set(data.content.team);
            roundIndex = data.content.currentRound;
            duelUUID = data.content.uuid;

            // Change own map to multiplayer map to adjust map + score
            changeCategory(hostMapCategory);
            showNotification("Map changed to " + hostMapCategory.replaceAll("community_", "") + ".");
        }

        if (data.type === "showPlayersArray") {
            connectedPlayers.set(data.content);
            showMultiplayerOverlay(true, "Starting soon...");
        }

        if (data.type === "lateJoin") {
            multiplayerFirstRoundPlayed = true;
            lateJoinedWaiting = true;

            connectedPlayers.set(data.content);
            showMultiplayerOverlay(true, "Wait for next round...", true);
        }

        if (data.type === "showPlayersArrayAfterRound") {
            connectedPlayers.set(data.content);
            showMultiplayerOverlay(true, "Results from round " + roundIndex);
        }

        if (data.type === "updateConnectedPlayers") {
            connectedPlayers.set(data.content);
        }

        if (data.type === "start") {
            coordsFromHost.set(data.content.coordinates);
            highestMultiplayerSupporterLevel.set(data.content.highestSupporterLevel);
            if (multiplayerFirstRoundPlayed) roundIndex++;

            multiplayerFirstRoundPlayed = true;
            teamMarkerArray = [];
            lateJoinedWaiting = false;
            checkGenerationTypeAndGenerate();
            multiplayerOverlayCountdown();
        }

        if (data.type === "roundOver") {
            endMultiplayerRound();
        }

        if (data.type === "guessesArray") {
            multiplayerGuessesLocationsArray.set(data.content);
        }

        if (data.type === "chat") {
            addToChat(data.content);
        }

        if (data.type === "teamMarkers") {
            teamMarkerArray = data.content;
            if (get(teamAmount) > 1) { updateMinimapWithTeamMarkers(teamMarkerArray) };
        }

        if (data.type === "closeResultScreen") {
            transitionToStart();
        }

        if (data.type === "rematch") {
            roundEnded = false;
            multiplayerHasAlreadyGuessed = false;
            multiplayerFirstRoundPlayed = false;
            roundIndex = 1;
        }

        if (data.type === "timeReduce") {
            showTimeReduceOverlay(data.content, multiplayerHasAlreadyGuessed); // only show the warning overlay if player has not already guessed
        }
    });

    // Event listener for Connection closed
    conn.on('close', function () {
        if (get(multiplayer)) {
            removeRankedLeavePenalty(); // Remove leave penalty (not at fault here)
            leaveMultiplayerRound();
            errorPopup("Disconnected from room", "The connection to the host was closed.", "", false, true);
        }

        // if you try to join a room that is locked
        if (!get(multiplayer)) {
            multiplayerStatus.set("Room locked.");
            if (get(matchmakingActive)) findNextDuel();
        }
    });

    // Event listener for Connection experiences an error
    conn.on('error', function (error) {
        if (get(multiplayer)) {
            removeRankedLeavePenalty(); // Remove leave penalty (not at fault here)
            leaveMultiplayerRound();
            errorPopup("WebRTC DataChannel error", "An error occured in the data channel. You are not the host.", error.type, false, true);
        }
    });
}

export function peerSendsHost(type, message) {
    try {
        conn.send({
            type: type,
            content: message
        });

    } catch (error) {
        if (get(multiplayer)) errorPopup("Error sending peer2peer message", "Couldn't send message to host.", "Host unreachable");
        console.error("Error messaging host: " + error);
    }
}

// Error states (disconnected, closed etc.) --------------------------------------------------------------------------------------------------
function attachErrorEvents() {
    peer.on('disconnected', function () {
        if (!peer.destroyed) {
            peer.reconnect();
            console.log("Disconnected from signalling server. Attempting to reconnect...");
        }
    });

    peer.on('error', function (err) {
        console.error("PeerJS: " + err);

        if (get(multiplayer)) {
            if (err.type != "network") {
                errorPopup("Multiplayer error", "Fatal multiplayer error. Please reload if you want to use multiplayer.", err.type, true);
            } else {
                errorPopup("Disconnected from round", "You have left the multiplayer round due to network issues. Check your connection.", err.type, false);
            }

            leaveMultiplayerRound();
        } else {
            multiplayerStatus.set("Failed to join.");
        }

        if (get(matchmakingActive)) {
            if (err.type == "peer-unavailable" && !get(isHost)) {
                findNextDuel();
            } else {
                multiplayerStatus.set("Please try again. Error: " + err.type);
                matchmakingActive.set(false);
            }

            if (get(isHost)) deleteRoomCodeFromMatchmakingServer(); // the retry button will also appear as seen above
        }
    });

    peer.on('close', function () {
        if (get(multiplayer)) {
            errorPopup("Multiplayer connection closed", "Your multiplayer connection was permanently closed.", "Error: Connection Closed", false);
            leaveMultiplayerRound();
        }

        if (get(isHost) && get(matchmakingActive)) {
            deleteRoomCodeFromMatchmakingServer(); // this happens when you close the tab / leave or refresh the page
        }
    });
}

// Multiplayer leave ----------------------------------------------------------------------------------

export function leaveMultiplayerRound() {
    let wasMultiplayerEnabled = false;

    // Disable Multiplayer
    if (get(multiplayer)) {
        multiplayer.set(false);
        wasMultiplayerEnabled = true;
    }

    // Disconnect all clients or Close the connection to the host
    if (get(isHost)) {
        disconnectAllPeersAndCloseRoom(); // only executes if clients connected
        if (get(matchmakingActive)) deleteRoomCodeFromMatchmakingServer();

    } else {
        if (conn) {
            conn.close();
        }
    }

    if (peer) peer.destroy(); // Destroy Peer to ensure everything cleans up

    // Stop Timer to prevent result screen
    try { multiplayerTimer.stopTimer() } catch { }; // has to be in try catch

    // Clear running intervals
    clearInterval(countdownInterval);
    clearTimeout(endMultiplayerRoundIfGuessMissing);

    screenEscapeDisabled.set(false); // Make Back and Close visible
    duelRetryEnabled.set(false); // Make Duel retry button disabled (Standard)

    // Apply leave penalty if in division game
    checkRankedLeavePenalty();

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    isHost.set(false);
    roundIndex = 1;
    yourTeam.set(1);

    // General UI resets
    continueText.set("Continue");
    multiplayerStatus.set();

    // Reset restriction
    restrictionButtonText.set("Standard");
    multiplayerRestriction = "standard";

    // UI functions
    setMultiplayerUI();
    showMultiplayerOverlay(false);
    showTimeReduceOverlay(0, true);
    resetChat();

    connectedPlayers.set([]);
    multiplayerFirstRoundPlayed = false;
    roomLocked.set(true);
    multiplayerGuessesLocationsArray.set([]);
    teamMarkerArray = [];
    updateMinimapWithTeamMarkers(teamMarkerArray); // clean up multiplayer minimap markers
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;
    matchmakingActive.set(false);
    playingDuels = false;
    lateJoinedWaiting = false;
    highestMultiplayerSupporterLevel.set(0);
    friendDuel = false;

    if (localStorage.getItem("selectedMap") !== "country guesser") mapVisible.set(true);
    leaveMatchButtonVisible.set(false);
    rematchButtonVisible.set(false);
    rematchButtonEnabled.set(true);
    setRestriction("standard");

    if (wasMultiplayerEnabled) checkGenerationTypeAndGenerate();
}

// Panorama Overlay UI -------------------------------------------------------------------------------------------------------------------

const baseHues = [200, 0, 120, 60, 300]; // Blue, Yellow, Green, Red, Purple

function generateColorForTeam(teamIndex) {
    const hue = baseHues[(teamIndex - 1) % baseHues.length];
    return `hsla(${hue}, 87.9%, 64.3%, 0.3)`;
}

function getTeamColorName(teamIndex) {
    const colorNames = ["Blue", "Red", "Green", "Yellow", "Purple"];
    return colorNames[(teamIndex - 1) % colorNames.length];
}

function showEndscreenUI(show) {
    if (show) {
        leaveMatchButtonVisible.set(true); // show leave / end button

        if (get(isHost)) {
            if (!playingDuels || friendDuel) {
                rematchButtonEnabled.set(true);
                rematchButtonVisible.set(true);
            }
        }
    } else {
        rematchButtonVisible.set(false);
        leaveMatchButtonVisible.set(false);
    }
}

// Win / Lose animations
function animateMultiplayerWin() {
    setTimeout(() => {
        playSound("win_sound");
    }, 1000);
}

function animateMultiplayerLose() {
    setTimeout(() => {
        playSound("lose_sound");
    }, 1000);
}

function showMultiplayerOverlay(show, title, lateJoin) {
    if (show) {
        multiplayerOverlay.set(true); // Show the overlay
        multiplayerOverlayTitle.set(title);
        showEndscreenUI(false); // Default to no endscreen UI
        let array = get(connectedPlayers);
        if (!multiplayerFirstRoundPlayed) modeText.set("Multiplayer (" + (localStorage.getItem("selectedCategory") || "standard").replace("community_", "") + ")");

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

            // Assign to table array (loaded in Overlay Component)
            multiplayerTableArray.set(array);
        } else {
            array.sort((a, b) => b[3] - a[3]);
            determineWinner(array, false);

            // Assign to table array (the sorted version!) (loaded in Overlay Component)
            multiplayerTableArray.set(array);
        }

        confirmButtonActive.set(false); // Set the confirm button to the grey "inactive" state (when on guess was made yet)
        mapVisible.set(false); // Hide map
        showTimeReduceOverlay(0, true); // hide = true (in case it somehow overlaps if the result screen is being skipped quickly)

    } else {
        multiplayerOverlay.set(false);
        if (get(multiplayer) || localStorage.getItem("selectedCategory") !== "country guesser") {
            mapVisible.set(true);
        }
    }
}

function determineWinner(array, teams, teamsObject) {
    if (roundIndex >= get(roundAmount)) {

        if (teams) {
            // Teams
            const winningTeamIndex = array[0]?.teamIndex;
            let teamColorName = teamsObject[winningTeamIndex].colorName;
            multiplayerOverlayTitle.set(`Team ${teamColorName} won!`);

        } else {
            // No Teams
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
                localStorage.getItem("id") == winningPlayerData[5] ? animateMultiplayerWin() : animateMultiplayerLose();

                // Check if you won in duels or just played
                if (playingDuels && !friendDuel) {
                    const won = winningPlayerData[5] == localStorage.getItem("id");
                    won ? addDuelWon() : addDuelPlayed();
                    sendDuelDivisionResult(won, duelUUID);
                }
            }
        }

        showEndscreenUI(true);
    }
}

let multiplayerTimer;
let countdownInterval;

// this starts the round visually and code-wise for all peers (also host, but host also starts with startMultiplayerRound() )
function multiplayerOverlayCountdown() {
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;

    if (playingDuels && !friendDuel) localStorage.setItem("activeDuel", "active"); // Save for leave penalty

    let countdown = 3;

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

                modeText.set("Multiplayer (Round: " + roundIndex + "/" + get(roundAmount) + ")");

                // Append restriction text
                if (multiplayerRestriction !== "standard" && multiplayerRestriction) {
                    modeText.set(get(modeText) + " (" + multiplayerRestriction + ")");
                }

                totalRequiredGuesses = get(connectedPlayers).length;
                setRestriction(multiplayerRestriction);
                playSound("match_countdown_start");
            }
        }
    }, 1000);
}
import { loadAndInitializeLibrary } from "$lib/utils/scriptLoader";
import { errorPopup } from "$lib/utils/errorHandling";
import { disableResultScreen, enableResultScreen } from "$lib/utils/setResultScreen.js";
import { supporterWindowIfAuthenticated } from "$lib/utils/showSupporterPopup.js";
import { startTimer } from "$lib/utils/timer.js";
import { isAuthenticated } from "$lib/stores/accountStore";
import { selectedBadge, selectedPinIndex, supporterLevel, username } from "$lib/stores/accountStore.js";
import { mapCategory, transitionToStart } from "../../../JS/categoryMenu.js"; // !TODO !CHANGE update imports
import { changeCategory } from "$lib/utils/changeCategory.js";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation.js";
import { confirmButtonClicks, setConfirmButtonState, updateMinimapWithTeamMarkers } from "$lib/logic/miniMap.js";
import { mapSupportsMultiplayer } from "$lib/utils/doesMapSupportMultiplayer.js";
import { playSound } from "$lib/utils/soundManager.js";
import { addDuelPlayed, addDuelWon } from "$lib/utils/updateProfileData.js";
import { loadProfileFromId } from "$lib/utils/loadProfile.js";
import { showConfirmPopup } from "$lib/utils/confirmPopup.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore.js";
import { mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore.js";
import { multiplayer } from "$lib/stores/modeStore";
import { linkJoinPopup } from "$lib/stores/uiStore";
import { mapModeIndicatorVisible, leaveFunction } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { multiplayerCategory, highestMultiplayerSupporterLevel, peerId, isHost, coordsFromHost, teamAmount, roundAmount, roundLength, screenEscapeDisabled, multiplayerCategory, duelRetryEnabled, hostStage, connectedClientsCount, multiplayerStatus, restrictionButtonText } from "$lib/stores/context-specific/multiplayerStore.js";
import { getLevel } from "$lib/utils/experienceCalculations.js";
import { get } from "svelte/store";

let uniqueUserID = 0; // used in setup for peerJS as peer id

// Host page ------------------------------------------------------------------------------------------------

function updateTeamDisplay() {
    const amountOfTeams = get(teamAmount);
    let index = 1; // Start index at 1 to ensure teams start from 1
    let teams = {};
    let noTeamPlayers = [];

    // Initialize teams array if amountOfTeams is more than 1
    if (amountOfTeams > 1) {
        for (let i = 1; i <= amountOfTeams; i++) {
            teams[i] = [];
        }
    }

    // Update team index for connected peers
    connectedPeers.forEach((element) => {
        if (amountOfTeams === 1) {
            // Collect all players for "No team"
            noTeamPlayers.push(element[1]);
        } else {
            // Distribute players in teams starting from team 1
            const teamIndex = index;
            teams[teamIndex].push(element[1]);
            element[4] = teamIndex; // Assuming element[4] is the team index storage
            index = (index % amountOfTeams) + 1; // Increment index circularly from 1 to amountOfTeams
        }
    });

    if (amountOfTeams === 1) {
        document.getElementById("teamsDisplayText").textContent = "No team: " + noTeamPlayers.join(", ");
    } else {
        let teamText = "";
        for (let i = 1; i <= amountOfTeams; i++) {
            if (teams[i].length > 0) { // Only display non-empty teams
                teamText += `Team ${i}: ${teams[i].join(", ")}\n`;
            }
        }
        // Update the innerText property instead of textContent to preserve line breaks
        document.getElementById("teamsDisplayText").innerText = teamText.trim(); // remove the trailing newline
    }
}

function getTeamFromPeerId(id) {
    const playerArray = connectedPeers.find(item => item[0] === id);
    return playerArray[4];
}

// Restriction Toggle -------------------------------------------------------------------------------------------------------------------------------
let multiplayerRestriction = "standard";
let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
let currentRestrictionIndex = 0;

export function toggleMultiplayerRestriction() {
    if (get(restrictionButtonText) == "Standard") {
        currentRestrictionIndex = 1; // start from the first restriction after standard
    } else {
        currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
    }
    multiplayerRestriction = restrictions[currentRestrictionIndex];

    // Update the button text
    switch (multiplayerRestriction) {
        case "nmpz":
            restrictionButtonText.set("No move (NMPZ)");
            break;
        case "grayscale":
            restrictionButtonText.set("Grayscale");
            break;
        case "invert":
            restrictionButtonText.set("Invert Colors");
            break;
        case "hue":
            restrictionButtonText.set("Hue Shift");
            break;
        case "fade":
            restrictionButtonText.set("Blink (Fade)");
            break;
        case "standard":
        default:
            restrictionButtonText.set("Standard");
            break;
    }

    setRestriction(multiplayerRestriction);
}

// Game Ui ----------------------------------------------------------------------------------------------------------------------------------
function setMultiplayerUI() {
    if (get(multiplayer)) {
        mapModeIndicatorVisible.set(true);
        leaveFunction.set(promptLeaveButton);

        document.getElementById("multiplayerChat").style.display = "flex";
        document.getElementById("mapModeText").textContent = "Multiplayer (Awaiting info..)";

        // disable result screen if it is open (edge case)
        disableResultScreen();

    } else {
        mapModeIndicatorVisible.set(false);
        document.getElementById("multiplayerChat").style.display = "none";
        leaveFunction.set();
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

export let autoSkipResult;

function endMultiplayerRound() {
    if (!roundEnded) {
        if (get(isHost)) {
            clearTimeout(endMultiplayerRoundIfGuessMissing);
            sendMessageToAll("roundOver", multiplayerGuessesLocationsArray);
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            // After 2 seconds (or 5 for duels), enable the skip functionality
            let skipTimeout = playingDuels ? 5000 : 2000;
            continueText.set("Wait " + (skipTimeout / 1000) + "s...");

            setTimeout(function () {
                continueText.set("Continue");
            }, skipTimeout)

            // After 10 seconds, skip automatically to not let peers wait too long in Duels
            if (playingDuels) {
                autoSkipResult = setTimeout(() => { transitionToStart() }, 10000);
            }

        } else {
            // If i'ts not the host, hide the next round button!
            continueText.set("Waiting...");
        }

        if (!lateJoinedWaiting) {
            enableResultScreen(get(mapPinLat), get(mapPinLng));
        }

        try { multiplayerTimer.stopTimer(); } catch { }; //stop multiplayer timer
        roundEnded = true;
    } else {
        console.warn("Multiplayer round already ended!");
    }
}

let multiplayerHasAlreadyGuessed = false;

export function multiplayerStateToGuessed() {
    if (!multiplayerHasAlreadyGuessed) {
        if (get(username) != null) {
            distributeChat("System: " + get(username) + " guessed.");
        } else {
            distributeChat("System: " + savedGuestName + " guessed.");
        }
    }

    if (get(isHost)) {
        if (!multiplayerHasAlreadyGuessed) {
            multiplayerGuessesLocationsArray.push([get(mapPinLat), get(mapPinLng), get(selectedPinIndex), get(username) != null ? get(username) : savedGuestName]); //add the hosts guess to the guesses
            multiplayerHasGuessed(); // this substracts one from the total requried guesses (and maybe ends the round)
        }

    } else {
        if (!multiplayerHasAlreadyGuessed) {
            peerSendsHost("guessed", {
                lat: get(mapPinLat),
                long: get(mapPinLng),
                style: get(selectedPinIndex),
                name: get(username) != null ? get(username) : savedGuestName
            });
        }
    }

    multiplayerHasAlreadyGuessed = true;

    // Reduce time for the opponent in duels (after setting ..hasGuessed!!)
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
        totalRequiredGuesses--;

        if (totalRequiredGuesses <= 0) {
            endMultiplayerRound();
        }
    }
}

export function showMultiplayerRoundResults() {
    sendMessageToAll("showPlayersArrayAfterRound", connectedPeers);
    showMultiplayerOverlay(true, "Results from round " + roundIndex, connectedPeers); //also load the results on the host's side
}

export function updatePeerDataScore(peerId, addScore) {
    const peerIndex = connectedPeers.findIndex(peer => peer[0] === peerId);

    if (peerIndex != -1) {
        const currentScore = connectedPeers[peerIndex][3];
        const newScore = currentScore + addScore;

        connectedPeers[peerIndex][3] = newScore;
    }
}

// Multiplayer Setup (IF player has an id! ) ---------------------------------------------------------------------------------------
let peer;
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

let savedGuestName = "none set";

function generateFunnyGuestName() {
    let animals = ["Giraffe", "Ape", "Sloth", "Penguin", "Kangaroo", "Panda", "Zebra", "Llama", "Hippo", "Parrot", "Cat", "Dog", "Slug", "Crow", "Elephant"];
    let randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    savedGuestName = "Guest" + randomAnimal;
}

if (localStorage.getItem("id") != null) {
    uniqueUserID = "openguessr_" + localStorage.getItem("id") + generateRandomCode(2);
} else {
    uniqueUserID = "openguessr_" + "g" + generateRandomCode(7);
    generateFunnyGuestName();
}

// load PeerJS + set up the connection
async function getPeer() {
    peer = await loadAndInitializeLibrary(
        'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
        'Peer',
        (Peer) => new Peer(uniqueUserID, {
            config: {
                'iceServers': [
                    { urls: "stun:fastturn.pro:5349", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "turns:fastturn.pro:5349", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                    { urls: "turn:fastturn.pro:3478", username: "paulplaystudio", credential: "GTFS-GTKU-TRES" },
                ]
            }
        })
    );

    return peer;
}

try {
    await getPeer();
} catch (error) {
    console.error("Could not inizialize PeerJS: " + error);
}

// Joining via Links (also as a guest!) -------------------------------------------------------------------------------------

let urlParams = new URLSearchParams(window.location.search);
let joinOnLoadViaLink = false;
let roomCode = urlParams.get("join");

if (roomCode) {
    console.log("Attempting join via Room Code Link:", roomCode);
    joinOnLoadViaLink = true;
}

// called in accountLogic after signin status was set
export function attemptJoinViaLink() {
    if (joinOnLoadViaLink) {
        if (peer) {
            try {
                linkJoinPopup.set(false);
                joinRoom(roomCode);

            } catch (err) {
                console.error("Tried to join via link with initizalized peer, but there was an exception when joining.");
            }
        } else {
            console.error("Tried to join round via link, but peerjs was not initialized yet.");
        }

        joinOnLoadViaLink = false;
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
}

let copyRoomcodeLinkButton = document.getElementById("roomcodeLink");

copyRoomcodeLinkButton.addEventListener("click", () => {
    copyRoomcodeLink();
    playSound("basic_button");
});

function copyRoomcodeLink() {
    if (supporterLevel > 0) {
        navigator.clipboard.writeText(window.location.origin + "/?join=" + get(peerId).replace("openguessr_", ""))
            .then(function () {
                document.getElementById("linkIcon").src = "/img/link_success_icon.png";
                setTimeout(() => {
                    document.getElementById("linkIcon").src = "/img/link_icon.png";
                }, 700);
            })
            .catch(function (error) {
                document.getElementById("linkIcon").src = "/img/link_error_icon.png";
                console.error("Copy error: " + error);
                setTimeout(() => {
                    document.getElementById("linkIcon").src = "/img/link_icon.png";
                }, 700);
            });
    } else {
        showConfirmPopup("Supporter tier required", "Sharing invite links is a supporter-exclusive feature as it leads to higher API usage. Please join using the room code or the friend invite system instead if you do not wish to purchase a supporter tier.", () => { supporterWindowIfAuthenticated(); }, false, false, false, "Support", "#588e6b");
    }
}

// Vars ------------------------------------------------------------------------------------------------
let conn; // the connection data
export let connectedPeers = [];

// Chat -----------------------------------------------------------------------------------------------------
let chatBox = document.getElementById("multiplayerMessageBox");

function resetChat() {
    chatBox.textContent = "";
}

// mainly for peers if they receive a message
async function addToChat(text) {
    const profanityList = [
        "hate ", "idiot", "fuck", "asshole", "suck ass", "nigg", "pussy", "kill y", "cock", "bastard", "suck"
    ];

    function containsProfanity(text) {
        const lowerCaseText = text.toLowerCase();
        return profanityList.some(word => lowerCaseText.includes(word));
    }

    if (containsProfanity(text)) {
        addTextToChat("System: Censored Profanity");
    } else {
        addTextToChat(text);
    }
}

//this is only used in the above function
function addTextToChat(text) {
    const sanitizedText = sanitizeHTML(text); // Call a function to sanitize HTML
    chatBox.innerHTML += "<br>";
    if (sanitizedText.startsWith("System:")) {
        chatBox.innerHTML += `<span style="color: #c1c1c1;">${sanitizedText}</span>`;
    } else {
        chatBox.innerHTML += sanitizedText;
    }
    document.getElementById("multiplayerChatMessages").scrollTop = document.getElementById("multiplayerChatMessages").scrollHeight;
}

function sanitizeHTML(text) {
    return text.replace(/<[^>]*>?/gm, ''); //strip it of any malicious html (security)
}

//for peers and hosts, this is how you send messages
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

let chatInput = document.getElementById("multiplayerMessageInput");
let chatSendButton = document.getElementById("multiplayerSendButton");

chatSendButton.addEventListener("click", () => {
    manuallySendChat();
    playSound("basic_button");
});

chatInput.addEventListener("keydown", function (event) {
    if (document.activeElement === chatInput && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        manuallySendChat();
    }
});

chatInput.addEventListener('keydown', (event) => {
    if (event.key === " ") {
        event.stopPropagation();
    }
});

function manuallySendChat() {
    if (chatInput.value != "") {
        if (get(username) != null) {
            distributeChat(get(username) + ": " + chatInput.value);
        } else {
            distributeChat(savedGuestName + ": " + chatInput.value);
        }
        chatInput.value = "";
    }
}

// Find Duel Logic -------------------------------------------------------------------------------------------------------------------------

let roomIndex = 0;
let matchmakingActive = false;
let playingDuels = false;

let friendDuel = false;

export function setPlayingDuels(state) {
    playingDuels = state;
}

export function setFriendDuel(state) {
    friendDuel = state;
}

// this initiates the find duel system
export async function findDuel() {
    roomIndex = 0; //reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive = true;
    playingDuels = true;
    setRetryButtonState();
    multiplayerStatus.set("Starting...");
    attemptDuelJoin(roomIndex);
}

// This function attempts to get a room code from the server and to join the room
async function attemptDuelJoin(index) {
    if (index == 0) {
        multiplayerStatus.set("Requesting roomcode...");
    } else {
        multiplayerStatus.set("Requesting new roomcode...");
    }
    let receivedRoomCode = "default";

    // Get Roomcode from server
    try {
        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/" + index, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            receivedRoomCode = await response.json();
            receivedRoomCode = receivedRoomCode.code;
        } else {
            console.error('Error fetching room code:', response.status);
            multiplayerStatus.set("Bad Get Request response: " + response.status);
            findNextDuel(); //as this could be a temporary thing, try again
        }

    } catch (error) {
        console.error('Error occurred when trying to fetch room code: ', error);
        multiplayerStatus.set("Couldn't send get request");
        matchmakingActive = false; //if there is no sever response, stop the matchmaking process
        setRetryButtonState();
    }

    // Attempt to join if there is a code, otherwise create room
    if (receivedRoomCode != null && receivedRoomCode != "default") {
        joinRoom(receivedRoomCode); //duel find status will be set in this function as well
    } else if (receivedRoomCode == null) {
        // Create room & hide close + back button for the time
        screenEscapeDisabled.set(true);

        try {
            changeCategory("standard", false); //this will only change the category and not generate! (to prevent skip of first round)
        } catch (e) {
            console.error("Error changing category to standard for multiplayer duels. Error: " + e);
        }
        setupMultiplayerRoom(5, 60); //+ auto skip for result screen
        sendRoomCodeToMatchmakingServer();
    }
}

// This occurs when the peer connect returns an error like peer_unavailable (means = doesn't exist)
function findNextDuel() {
    if (roomIndex < 10) {
        roomIndex++;
        attemptDuelJoin(roomIndex);
    } else {
        matchmakingActive = false;
        setRetryButtonState();
    }
}

async function sendRoomCodeToMatchmakingServer() {
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        }

        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/host/" + get(peerId).replace("openguessr_", ""), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            setTimeout(() => {
                if (matchmakingActive) {
                    multiplayerStatus.set("No match found. Please retry");
                    matchmakingActive = false;
                    setRetryButtonState();
                    leaveMultiplayerRound();
                    deleteRoomCodeFromMatchmakingServer();
                }
            }, 10000); // After 10 seconds, as the room code is now expired, leave the multiplayer round and show the retry button

        } else {
            console.error("Failed sending the Room Code to the server: " + response.status);
            multiplayerStatus.set("Error sending roomcode to server: " + response.status);
            matchmakingActive = false;
            setRetryButtonState();
        }

    } catch (error) {
        console.error('Failed making a post request to the server: ', error);
        multiplayerStatus.set("Error making a request to server: " + error);
        matchmakingActive = false;
        setRetryButtonState();
    }
}

async function deleteRoomCodeFromMatchmakingServer() {
    try {
        const requestBody = {
            id: localStorage.getItem("id")
        }

        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/delete/" + get(peerId).replace("openguessr_", ""), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.warn("Failed deleting the Room Code from the server: " + response.status);
            multiplayerStatus.set("Error deleting roomcode from server: " + response.status);
        }

    } catch (error) {
        console.error('Failed making a delete request to the server: ', error);
        multiplayerStatus.set("Error making a request to server: " + error);
    }
}

// enable / disable the retry button depending on whether it is currently trying to join/host or not
function setRetryButtonState() {
    if (matchmakingActive) {
        duelRetryEnabled.set(false);
    } else {
        duelRetryEnabled.set(true);
        screenEscapeDisabled.set(false);
    }
}

// Duel Guess Time Reduce Overlay & reduce remaining time
function showTimeReduceOverlay(time, hide) {
    time = Number(time);

    let timeReduceOverlayTimer;
    let disableBlurTimeout;

    clearTimeout(timeReduceOverlayTimer);
    clearTimeout(disableBlurTimeout);

    if (!hide) {
        try {
            if (multiplayerTimer.isTimerRunning() && multiplayerTimer.getRemainingTime() > 3) { // only show overlay if it the remaining time is above 3s
                document.getElementById("duelsOverlay").style.opacity = "1";
                document.getElementById("duelsOverlay").style.transform = "scale(1.03)";
                document.getElementById("duelsOverlay").style.filter = "none";
                playSound("time_reduced");

                timeReduceOverlayTimer = setTimeout(() => {
                    document.getElementById("duelsOverlay").style.opacity = "0";
                    document.getElementById("duelsOverlay").style.transform = "scale(1.0)";
                    document.getElementById("duelsOverlay").style.filter = "blur(5px)";
                }, 2000);

                disableBlurTimeout = setTimeout(() => {
                    document.getElementById("duelsOverlay").style.filter = "none";
                }, 3000)
            }
        } catch { console.warn("Error showing time reduce overlay: " + error) }

    } else {
        document.getElementById("duelsOverlay").style.opacity = "0";
    }

    if (time != 0) {
        try {
            if (multiplayerTimer.isTimerRunning() && multiplayerTimer.getRemainingTime() > time) {
                multiplayerTimer.stopTimer();
                multiplayerTimer = startTimer(time, multiplayerTimerExpired); //Start the timer with new time
                document.getElementById("duelsOverlaySubtitle").textContent = `Time reduced to ${time}s.`;
            } else {
                document.getElementById("duelsOverlaySubtitle").textContent = "Time remains unaffected.";
            }
        } catch (error) {
            document.getElementById("duelsOverlaySubtitle").textContent = "Time error occured.";
            console.warn("Could not set new timer for duels in showTimerReduceOverlay" + error);
        }
    }
}

// Universal peer connection open (also attempt linkjoin) -----------------------------------------------------------------

let peerOpen = false;

if (peer) {
    peer.on('open', function (id) {
        peerId.set(id); // this also triggers for peers, as their connection opens
        peerOpen = true;
    });
}

// Host Logic ----------------------------------------------------------------------------------------------
export let multiplayerGuessesLocationsArray = [];
let multiplayerFirstRoundPlayed = false; // for host and peers! peers use this to see whether they should incrase the round index
export let yourTeam = 1;

function removeConnectedPeerById(peerId) {
    const index = connectedPeers.findIndex(entry => entry[0] === peerId);

    if (index !== -1) {
        connectedPeers.splice(index, 1); // splice: startindex, deletecount (here 1)
    }
}

if (peer) {
    peer.on('open', function (id) {

        // Set up event listener for incoming connections (HOST LOGIC)
        peer.on('connection', function (incomingConn) {
            if (!roomLocked) {

                //instantly lock the room on the first connection
                if (matchmakingActive || friendDuel) {
                    roomLocked = true;
                }

                let brokenConnectionTimeout = setTimeout(() => {
                    // Unlock the room & disconnect non-working peer if connection fails to open within 2 seconds
                    if (!incomingConn.open) {
                        roomLocked = false;
                        incomingConn.close();
                        distributeChat("System: " + incomingConn.metadata.username + " kicked (no response from peer).");
                    }
                }, 2000);

                // Event listener for when the connection is open
                incomingConn.on('open', function () {
                    const index = connectedPeers.findIndex(entry => entry[0] == incomingConn.peer);
                    // If the entry doesn't already exist (prevent duplicates), only then push new user
                    if (index == -1) {
                        connectedPeers.push([incomingConn.peer, incomingConn.metadata.username, incomingConn.metadata.level, incomingConn.metadata.score, 1, incomingConn.metadata.id, incomingConn.metadata.badge]);

                        if (incomingConn.metadata.supporterLevel > get(highestMultiplayerSupporterLevel)) {
                            highestMultiplayerSupporterLevel.set(incomingConn.supporterLevel);
                        }

                    } else {
                        setTimeout(() => {
                            incomingConn.close();
                            distributeChat("System: " + incomingConn.metadata.username + " kicked (duplicate).");
                        }, 500);
                    }

                    connectedClientsCount.set(get(connectedClientsCount) + 1);
                    updateTeamDisplay();
                    clearTimeout(brokenConnectionTimeout); //stop the broken-connection kick timer

                    const initialMessage = {
                        type: "initialize",
                        content: {
                            roundAmount: get(roundAmount),
                            currentRound: roundIndex,
                            roundLength: get(roundLength),
                            teamAmount: get(teamAmount),
                            team: getTeamFromPeerId(incomingConn.peer),
                            multiplayerRestriction: multiplayerRestriction,
                            category: get(multiplayerCategory)
                        }
                    }
                    // Send messages
                    incomingConn.send(initialMessage);
                    distributeChat("System: " + incomingConn.metadata.username + " joined.");

                    // whether the first round has been played & the starting screen should be shown
                    if (!multiplayerFirstRoundPlayed) {
                        sendMessageToAll("showPlayersArray", connectedPeers); //send it to peer
                        showMultiplayerOverlay(true, "Waiting...", connectedPeers); //also show it for host
                    } else {
                        const waitingMessage = {
                            type: "lateJoin",
                            content: connectedPeers
                        }
                        incomingConn.send(waitingMessage);
                    }

                    //if duels matchmaking is active, immediately start the round on the first OPEN connection
                    if (matchmakingActive) {
                        deleteRoomCodeFromMatchmakingServer(); //delete roomcode from server
                        StartRoom(); //this also locks the room
                    }

                    if (friendDuel) {
                        StartRoom(); //this also locks the room
                    }
                });


                // Receive messages
                incomingConn.on('data', function (data) {
                    if (data.type == "guessed") {
                        multiplayerGuessesLocationsArray.push([data.content.lat, data.content.long, data.content.style, data.content.name]);
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

                //Peer disconnects
                incomingConn.on('close', function () {
                    connectedClientsCount.set(get(connectedClientsCount) - 1);
                    removeConnectedPeerById(incomingConn.peer);
                    updateTeamDisplay();
                    distributeChat("System: " + incomingConn.metadata.username + " left.");

                    //if peer disconnects pre-game, update the waiting screen
                    if (!multiplayerFirstRoundPlayed) {
                        sendMessageToAll("showPlayersArray", connectedPeers);
                        showMultiplayerOverlay(true, "Waiting...", connectedPeers);
                    } else {
                        //if already in round, count it as a guess (so that the others don't have to wait)
                        multiplayerHasGuessed();
                    }
                })
            } else {
                setTimeout(() => {
                    incomingConn.close(); // Close the connection if room is locked (= the round has alr started)
                }, 1000);
            }
        });
    });
} else {
    console.warn("PeerJS not initialized -> Host Logic failed!");
}

let roomLocked = true;

export function createRoom(AmountOfRounds, LengthOfRounds) {
    if (get(hostStage) == 2) {
        setupMultiplayerRoom(AmountOfRounds, LengthOfRounds);
        updateTeamDisplay();
        playSound("basic_button");
    } else {
        StartRoom();
        playSound("start_button");
    }
}

export function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds) {
    multiplayerStatus.set("Room created. Please wait <10s");
    isHost.set(true);
    multiplayerFirstRoundPlayed = false;
    multiplayerCategory.set(localStorage.getItem("selectedCategory") || "standard");

    if (!mapSupportsMultiplayer(get(multiplayerCategory))) {
        multiplayerCategory.set("standard");
    }

    connectedPeers.push([get(peerId), get(username) == null ? savedGuestName : get(username), getLevel(), 0, 1, localStorage.getItem("id"), get(selectedBadge)]); //add yourself (host) to the overview

    yourTeam = 1; // Host is always in team 1
    showMultiplayerOverlay(true, "Waiting...", connectedPeers);

    // set round and length parameters
    roundAmount.set(AmountOfRounds);
    roundLength.set(LengthOfRounds);

    // set supporter level to own supporter level as baseline
    highestMultiplayerSupporterLevel.set(supporterLevel || 0);

    // unlock room
    roomLocked = false;
}

// Start room (HOST function)
function StartRoom() {
    //start the round (from host)
    multiplayerHost.textContent = "Loading Location...";
    multiplayerStatus.set("Starting! Loading location...");
    multiplayer.set(true);
    setMultiplayerUI();
    showMultiplayerOverlay(true, "Ready...", connectedPeers); //only for host, also to set the map category in mode text
    sendMessageToAll("showPlayersArray", connectedPeers); //this is for the peers (the same thing as showMultiplayerOverlay for host)
    checkGenerationTypeAndGenerate();
    if (playingDuels) {
        roomLocked = true;
    }
    matchmakingActive = false;
}

function multiplayerRematch() {
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;
    multiplayerFirstRoundPlayed = false;
    roundIndex = 1;
    connectedPeers.forEach((element) => {
        element[3] = 0; //reset scores
    })
    sendMessageToAll("rematch");
    setTimeout(function () {
        StartRoom()
    });

    //change the rematch button so signal the change
    endMultiplayerRematchButton.style.opacity = "0.5";
    endMultiplayerRematchButton.style.pointerEvents = "none";
    endMultiplayerRematchButton.textContent = "Loading...";
}

// Start the first / next round
export async function startMultiplayerRound(latitude, longitude) {
    multiplayerGuessesLocationsArray = []; // reset previous stored guesses from peers
    teamMarkerArray = [];
    totalRequiredGuesses = get(connectedClientsCount) + 1; //connections + 1 for the host (this is being set here as well as after the countdown)

    if (!multiplayerFirstRoundPlayed) {
        toggleMultiplayerSelector("close");
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
    multiplayerOverlayCountdown(); // for host
}

// Function to send a message from host to all peers
export function sendMessageToAll(type, message) {
    connectedPeers.forEach(function (peerInfo) {
        const peerId = peerInfo[0]; // Peer ID is the first element in each peerInfo array
        if (peerId) { // Ensure peerId is defined
            const connections = peer.connections[peerId];
            if (connections && connections.length > 0) {
                connections.forEach(function (conn) {
                    conn.send({
                        type: type,
                        content: message
                    });
                });
            }
        }
    });
}

// Function to disconnect all peers and close the room
function disconnectAllPeersAndCloseRoom() {
    if (get(isHost)) {
        if (peer && get(connectedClientsCount) != 0) {
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

        if (matchmakingActive) {
            //as this is apparent in leaveMultplayerRound, it is good too
            deleteRoomCodeFromMatchmakingServer();
        }
    }

    connectedClientsCount.set(0);
    connectedPeers = [];
    updateTeamDisplay();
}

let teamMarkerArray = [];

export function sendTeamMarkers(lat, long) {
    if (get(multiplayer)) {
        if (get(isHost)) {
            addReplaceTeamMarkers(get(peerId), lat, long, get(selectedPinIndex), yourTeam);
            sendMessageToAll("teamMarkers", teamMarkerArray);
        } else {
            peerSendsHost("teamMarkers", { id: get(peerId), lat: lat, long: long, pin: get(selectedPinIndex), team: yourTeam });
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
export async function joinRoom(code) {
    code.replace(/\s/g, ''); // Remove whitespaces

    // If peer isn't open yet, await that
    if (!peerOpen) {
        await new Promise(resolve => {
            peer.on('open', () => {
                resolve();
            })
        });
    }

    isHost.set(false);
    multiplayerFirstRoundPlayed = false;
    multiplayerStatus.set("Attempting join...");

    const options = {
        metadata: {
            username: get(username) == null ? savedGuestName : get(username),
            level: getLevel(),
            score: 0, //inital score is set to 0,
            id: localStorage.getItem("id"),
            badge: get(selectedBadge),
            supporterLevel: get(supporterLevel)
        }
    };

    conn = peer.connect("openguessr_" + code, options);

    // Event listener for when the connection is opened
    conn.on('open', function () {
        multiplayerStatus.set("Connection opened...");
    });

    // Receive messages
    conn.on('data', function (data) {

        if (data.type === "initialize") {
            multiplayerStatus.set("Joined!");
            multiplayer.set(true);

            setMultiplayerUI();
            toggleMultiplayerSelector("close");
            linkJoinPopup.set(false);
            matchmakingActive = false;
            roundAmount.set(data.content.roundAmount);
            roundLength.set(data.content.roundLength);
            teamAmount.set(data.content.teamAmount);
            multiplayerRestriction = data.content.multiplayerRestriction;
            multiplayerCategory.set(data.content.category);
            yourTeam = data.content.team;
            roundIndex = data.content.currentRound;
        }

        if (data.type === "showPlayersArray") {
            showMultiplayerOverlay(true, "Starting soon...", data.content);
        }

        if (data.type === "lateJoin") {
            multiplayerFirstRoundPlayed = true;
            lateJoinedWaiting = true;
            showMultiplayerOverlay(true, "Wait for next round...", data.content, true);
        }

        if (data.type === "showPlayersArrayAfterRound") {
            showMultiplayerOverlay(true, "Results from round " + roundIndex, data.content);
        }

        if (data.type === "start") {
            try {
                coordsFromHost.set(data.content.coordinates);
                highestMultiplayerSupporterLevel.set(data.content.highestSupporterLevel);
            } catch (error) {
                console.error("Error receiving locations and supporter level from the host in multiplayer.js Error: ", error);
            }


            if (multiplayerFirstRoundPlayed) {
                roundIndex++;
            }

            multiplayerFirstRoundPlayed = true;
            teamMarkerArray = [];
            lateJoinedWaiting = false;
            checkGenerationTypeAndGenerate();
            multiplayerOverlayCountdown();
        }

        if (data.type === "roundOver") {
            multiplayerGuessesLocationsArray = data.content;
            endMultiplayerRound();
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
            if (!multiplayerHasAlreadyGuessed) {
                showTimeReduceOverlay(data.content, false);
            } else {
                showTimeReduceOverlay(data.content, true); // only show the warning overlay if player has not already guessed
            }
        }
    });

    // Event listener for Connection closed
    conn.on('close', function () {
        //if you get disconnected mid round
        if (get(multiplayer)) {
            leaveMultiplayerRound();
            errorPopup("Disconnected from room", "The connection to the host was closed.", "", false, true);
        }

        //if you try to join a room that is locked
        if (!get(multiplayer)) {
            multiplayerStatus.set("Room locked.");

            if (matchmakingActive) {
                findNextDuel();
            }
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
        if (get(multiplayer)) {
            errorPopup("Error sending peer2peer message", "Couldn't send message to host.", "Host unreachable");
        }

        console.error("Error messaging host: " + error);
    }

}

// Error states (disconnected, closed etc.) --------------------------------------------------------------------------------------------------
if (peer) {
    peer.on('disconnected', function () {
        peer.reconnect();
        console.log("Disconnected from signalling server. Attempting to reconnect...");
    });

    peer.on('error', function (err) {
        console.error("PeerJS: " + err);

        if (get(multiplayer)) {
            if (err.type != "network") {
                errorPopup("Multiplayer error", "Fatal multiplayer error. Please reload if you want to use multiplayer.", err.type, true);
            } else {
                errorPopup("Disconnected from round", "You have left the multiplayer round due to network issues. Check your and the host's connection.", err.type, false);
            }

            leaveMultiplayerRound();
        } else {
            multiplayerStatus.set("Failed to join.");
        }

        if (matchmakingActive) {
            if (err.type == "peer-unavailable" && !get(isHost)) {
                findNextDuel();
            } else {
                multiplayerStatus.set("Please try again. Error: " + err.type);
                matchmakingActive = false;
                setRetryButtonState();
            }

            if (get(isHost)) {
                deleteRoomCodeFromMatchmakingServer(); //the retry button will also appear as seen above
            }
        }

    });

    peer.on('close', function () {
        errorPopup("Multiplayer connection closed", "Your multiplayer connection was permanently closed. Please reload the page.", "Error: Connection Closed", false);
        if (get(multiplayer)) {
            leaveMultiplayerRound();
        }

        if (get(isHost) && matchmakingActive) {
            deleteRoomCodeFromMatchmakingServer(); //this happens when you close the tab / leave or refresh the page
        }

        peer.destroy(); //clean up peer
    });
}

// Multiplayer leave ----------------------------------------------------------------------------------

function promptLeaveButton() {
    showConfirmPopup("Leave match?", "You are about to leave the multiplayer room. Are you sure?", leaveMultiplayerRound, false);
    playSound("leave_round");
}

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
    } else {
        if (conn) {
            try {
                conn.close();
            } catch (error) {
                console.error("Error when closing connection in multiplayer js: " + error);
            }
        }
    }

    // Stop Timer to prevent result screen
    try { multiplayerTimer.stopTimer(); } catch { }; // has to be in try catch

    // Clear running intervals
    clearInterval(countdownInterval);
    clearTimeout(endMultiplayerRoundIfGuessMissing);

    screenEscapeDisabled.set(false); // Make Back and Close visible
    duelRetryEnabled.set(false); // Make Duel retry button disabled (Standard)

    // Reset to default settings
    roundLength.set(60);
    roundAmount.set(3);
    teamAmount.set(1);
    isHost.set(false);
    roundIndex = 1;
    yourTeam = 1;

    // General UI resets
    continueText.set("Continue");
    multiplayerStatus.set();

    // Reset restriction
    restrictionButtonText.set("Standard");
    multiplayerRestriction = "standard";

    setMultiplayerUI();
    showMultiplayerOverlay(false);
    showTimeReduceOverlay(0, true);
    multiplayerFirstRoundPlayed = false;
    roomLocked = true;
    multiplayerGuessesLocationsArray = [];
    teamMarkerArray = [];
    updateMinimapWithTeamMarkers(teamMarkerArray); // clean up multiplayer minimap markers
    connectedPeers = [];
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;
    resetChat();
    matchmakingActive = false;
    playingDuels = false;
    lateJoinedWaiting = false;
    highestMultiplayerSupporterLevel.set(0);
    friendDuel = false;

    // reset Guess/Confirm button text
    document.getElementById("guessText").textContent = "Guess";

    // Set confirm button state to ensure pointer events are correct (this function calls the confirmButtonState func) and reset minimap markers
    setConfirmButtonState();

    if (mapCategory != "country") {
        document.getElementById("map").style.visibility = "visible";
        hideToggleMapButtonIfMobile(false);
    }

    endMultiplayerRoundButton.style.display = "none";
    endMultiplayerRematchButton.style.display = "none";
    endMultiplayerRematchButton.style.opacity = "1";
    endMultiplayerRematchButton.style.pointerEvents = "auto";
    endMultiplayerRematchButton.textContent = "Play again";
    setRestriction("standard");

    if (wasMultiplayerEnabled) {
        checkGenerationTypeAndGenerate();
    }
}

// Streetview Overlay UI -------------------------------------------------------------------------------------------------------------------
let endMultiplayerRoundButton = document.getElementById("endMultiplayerRoundButton");
let endMultiplayerRematchButton = document.getElementById("endMultiplayerRematchButton");

endMultiplayerRoundButton.addEventListener("click", () => {
    leaveMultiplayerRound();
    playSound("leave_round");
});
endMultiplayerRematchButton.addEventListener("click", () => {
    multiplayerRematch();
    playSound("basic_button");
});

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
        endMultiplayerRoundButton.style.display = "block"; // show leave / end button

        if (get(isHost)) {
            endMultiplayerRoundButton.textContent = "End Round";

            if (!playingDuels || friendDuel) {
                endMultiplayerRematchButton.style.display = "block";
                endMultiplayerRematchButton.style.opacity = "1";
                endMultiplayerRematchButton.style.pointerEvents = "auto";
                endMultiplayerRematchButton.textContent = "Play again";
            }

        } else {
            endMultiplayerRoundButton.textContent = "Leave Round";
        }
    } else {
        endMultiplayerRoundButton.style.display = "none";
        endMultiplayerRematchButton.style.display = "none";
    }
}

// Leaderboard / Overlay / Overview
let nameProfileIdCounter = 0;

// Win / Lose animations
function animateMultiplayerWin() {
    let timeout;
    clearTimeout(timeout);

    timeout = setTimeout(() => {
        playSound("win_sound");
        const title = document.getElementById('multiplayerTitle');

        // Reset animations
        title.style.animation = 'none';
        title.offsetHeight; // Trigger a reflow to restart the animation

        // Apply lose animation
        title.style.animation = 'multiplayerTitleWin 1s ease-in-out';
    }, 1500);
}

function animateMultiplayerLose() {
    let timeout;
    clearTimeout(timeout);

    timeout = setTimeout(() => {
        playSound("lose_sound");
        const title = document.getElementById('multiplayerTitle');

        // Reset animations
        title.style.animation = 'none';
        title.offsetHeight; // Trigger a reflow to restart the animation

        // Apply lose animations
        title.style.animation = 'multiplayerTitleLose 1s ease-in-out';
    }, 1500);
}

export function showMultiplayerOverlay(show, title, array, lateJoin) {
    let container = document.getElementById("multiplayerTable");

    if (show) {
        container.innerHTML = "";
        document.getElementById("multiplayerFade").style.opacity = "1";
        document.getElementById("multiplayerFade").style.pointerEvents = "auto";
        document.getElementById("multiplayerTitle").textContent = title;

        if (!multiplayerFirstRoundPlayed) {
            document.getElementById("mapModeText").textContent = "Multiplayer (" + get(multiplayerCategory)?.replace("community_", "") + ")";
        }

        let yourPeerId = get(peerId);

        let elementHTML = ""; // content to be added to each entry

        if (get(teamAmount) > 1) {
            let teams = {};

            // array in this case is always connected peers
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

            // Sort the teams themselves based on total xp
            let sortedTeams = Object.keys(teams).sort((a, b) => {
                const totalExperienceA = teams[a].players.reduce((sum, player) => sum + player[3], 0);
                const totalExperienceB = teams[b].players.reduce((sum, player) => sum + player[3], 0);
                return totalExperienceB - totalExperienceA;
            });

            let winningTeamIndex = sortedTeams[0];

            // Teams Win state
            if (roundIndex >= get(roundAmount)) {
                let teamColorName = teams[winningTeamIndex].colorName;
                document.getElementById("multiplayerTitle").textContent = `Team ${teamColorName} won!`;
                showEndscreenUI(true);

                if (yourTeam == winningTeamIndex) {
                    animateMultiplayerWin();
                } else {
                    animateMultiplayerLose();
                }
            } else {
                showEndscreenUI(false);
            }

            sortedTeams.forEach(teamIndex => {
                // Sort players within each team by score (experience)
                teams[teamIndex].players.sort((a, b) => b[3] - a[3]);

                teams[teamIndex].players.forEach(playerInfo => {
                    nameProfileIdCounter++;

                    const [peerId, username, level, score, team, id, badge] = playerInfo;
                    let playerColor = teams[teamIndex].color;

                    let clickableEntry = id ? "" : " entryNotClickable";

                    let newEntry = document.createElement("div");

                    if (peerId == yourPeerId) {
                        newEntry.className = "multiplayerOverlayEntry yourMultiplayerOverlay";
                        newEntry.style = `background-image: linear-gradient(90deg, transparent 60%, ${playerColor})`;

                        elementHTML = `
                            <div class="multiplayerEntryPlayerInfo">
                                <div id="usernameOverlayField${nameProfileIdCounter}" class="multiplayerEntryPlayerName${clickableEntry}">${username} (Lvl. ${level})<div class="multiplayerBadge" id="newBadgeDiv${nameProfileIdCounter}"></div></div>
                                <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                            </div>
                    `;
                    } else {
                        newEntry.className = "multiplayerOverlayEntry";
                        newEntry.style = `background-image: linear-gradient(90deg, transparent 60%, ${playerColor})`;

                        elementHTML = `
                            <div class="multiplayerEntryPlayerInfo">
                                <div id="usernameOverlayField${nameProfileIdCounter}" class="multiplayerEntryPlayerName${clickableEntry}">${username} (Lvl. ${level})<div class="multiplayerBadge" id="newBadgeDiv${nameProfileIdCounter}"></div></div>
                                <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                            </div>
                    `;
                    }

                    newEntry.innerHTML = elementHTML;
                    container.appendChild(newEntry);

                    if (badge) {
                        let newBadgeDiv = document.getElementById("newBadgeDiv" + nameProfileIdCounter);
                        newBadgeDiv.appendChild(returnMultiplayerBadge(badge));
                    }

                    if (id) {
                        try {
                            document.getElementById("usernameOverlayField" + nameProfileIdCounter).addEventListener("click", () => {
                                loadProfileFromId(id, true);
                            });
                        } catch (error) {
                            console.error("Error in showMultiplayerOverlay: " + error);
                        }
                    }
                });
            });
        } else {
            array.sort((a, b) => b[3] - a[3]);

            // No teams win state
            if (roundIndex >= get(roundAmount) && !lateJoin) {
                let winningPlayerData = array[0];
                let winningUsername = winningPlayerData[1];
                let winningId = winningPlayerData[5];
                document.getElementById("multiplayerTitle").textContent = winningUsername + " won!";

                if (localStorage.getItem("id") == winningId) {
                    animateMultiplayerWin();
                } else {
                    animateMultiplayerLose();
                }

                // Check if you won in duels or just played
                if (playingDuels && get(isAuthenticated) && !friendDuel) {
                    if (winningId == localStorage.getItem("id")) {
                        addDuelWon();
                    } else {
                        addDuelPlayed();
                    }
                }

                showEndscreenUI(true);
            } else {
                showEndscreenUI(false);
            }

            array.forEach(playerInfo => {
                nameProfileIdCounter++;

                const [peerId, username, level, score, team, id, badge] = playerInfo;

                let newEntry = document.createElement("div");

                let clickableEntry = id ? "" : " entryNotClickable";

                if (peerId == yourPeerId) {
                    newEntry.className = "multiplayerOverlayEntry yourMultiplayerOverlay";

                    elementHTML = `
                        <div class="multiplayerEntryPlayerInfo">
                            <div id="usernameOverlayField${nameProfileIdCounter}" class="multiplayerEntryPlayerName${clickableEntry}">${username} (Lvl. ${level})<div class="multiplayerBadge" id="newBadgeDiv${nameProfileIdCounter}"></div></div>
                            <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                        </div>
                `;
                } else {
                    newEntry.className = "multiplayerOverlayEntry";

                    elementHTML = `
                        <div class="multiplayerEntryPlayerInfo">
                            <div id="usernameOverlayField${nameProfileIdCounter}" class="multiplayerEntryPlayerName${clickableEntry}">${username} (Lvl. ${level})<div class="multiplayerBadge" id="newBadgeDiv${nameProfileIdCounter}"></div></div>
                            <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                        </div>
                `;
                }

                newEntry.innerHTML = elementHTML;
                container.appendChild(newEntry);

                if (badge) {
                    let newBadgeDiv = document.getElementById("newBadgeDiv" + nameProfileIdCounter);
                    newBadgeDiv.appendChild(returnMultiplayerBadge(badge));
                }

                if (id) {
                    try {
                        document.getElementById("usernameOverlayField" + nameProfileIdCounter).addEventListener("click", () => {
                            loadProfileFromId(id, true);
                        });
                    } catch (error) {
                        console.error("Error in showMultiplayerOverlay: " + error);
                    }
                }
            });
        }

        document.getElementById("confirmButton").style.pointerEvents = "none";
        document.getElementById("map").style.visibility = "hidden";
        hideToggleMapButtonIfMobile(true);
        showTimeReduceOverlay(0, true); // hide = true (in case it somehow overlaps if the result screen is being skipped quickly)

    } else {
        document.getElementById("multiplayerFade").style.opacity = "0";
        document.getElementById("multiplayerFade").style.pointerEvents = "none";
        if (get(multiplayer) || mapCategory != "country") {
            document.getElementById("map").style.visibility = "visible";
            hideToggleMapButtonIfMobile(false);
        }
    }
}

let randomBadgeIndexId = 0;

function returnMultiplayerBadge(badge) {
    if (badge) {
        randomBadgeIndexId++;

        try {
            const badgeToClone = document.getElementById(badge);
            const newBadge = badgeToClone.cloneNode(true);
            newBadge.classList.remove("badgeSelected");
            newBadge.classList.remove("badgeLocked");
            newBadge.id = "multiplayerOverlayBadge" + randomBadgeIndexId; // change id to prevent overlap 
            return newBadge;
        } catch (error) {
            console.error("Couldn't load multiplayer badge with id " + badge + ". Error: " + error);
        }
    } else {
        return "";
    }
}

let multiplayerTimer;
let countdownInterval;

// this starts the round visually and code-wise for all peers (also host, but host also starts with startMultiplayerRound() )
function multiplayerOverlayCountdown() {
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;

    const multiplayerTitle = document.getElementById("multiplayerTitle");
    let countdown = 3;

    countdownInterval = setInterval(function () {
        if (countdown > 0) {
            multiplayerTitle.textContent = `Starting... ${countdown}`;
            countdown--;
            playSound("match_countdown");
        } else {
            clearInterval(countdownInterval); // Stop the countdown
            if (get(multiplayer)) {
                showMultiplayerOverlay(false); //hide the overlay --> round starts
                document.getElementById("guessText").textContent = "Guess";

                try { multiplayerTimer.stopTimer(); } catch { }; //stop multiplayer timer (redudancy)
                multiplayerTimer = startTimer(get(roundLength), multiplayerTimerExpired); //Start the timer

                document.getElementById("mapModeText").textContent = "Multiplayer (Round: " + roundIndex + "/" + get(roundAmount) + ")";

                if (multiplayerRestriction != "standard" && multiplayerRestriction) {
                    document.getElementById("mapModeText").textContent += " (" + multiplayerRestriction + ")";
                }

                totalRequiredGuesses = get(connectedClientsCount) + 1; //connections + 1 for the host
                setRestriction(multiplayerRestriction);

                playSound("match_countdown_start");
            }
        }
    }, 1000);
}

// Set restriction ----------------------------------------------------------------------------------

const PanoramaIframe = document.getElementById("PanoramaIframe");

export function setRestriction(restriction) {
    nmpzBackground.style.pointerEvents = "none";
    nmpzBackground.style.backgroundColor = "transparent";
    PanoramaIframe.style.filter = "none";
    PanoramaIframe.style.animation = "none";

    switch (restriction) {
        case "nmpz":
            nmpzBackground.style.pointerEvents = "auto";
            break;
        case "grayscale":
            PanoramaIframe.style.filter = "grayscale(100%)";
            break;
        case "invert":
            PanoramaIframe.style.filter = "invert(100%)";
            break;
        case "hue":
            PanoramaIframe.style.filter = "hue-rotate(90deg)";
            break;
        case "fade":
            nmpzBackground.style.backgroundColor = "black";
            nmpzBackground.style.animation = "restrictionFade 2s infinite";
            break;
        case "standard":
        default:
            break; // no restriction
    }
}
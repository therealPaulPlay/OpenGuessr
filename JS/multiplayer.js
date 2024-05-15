import { clamp } from "./main.js";
import { errorPopup } from "./errorHandling.js";
import { toggleCategoryMenu, toggleSocialbar, hideToggleMapButtonIfMobile, socialBarExpanded } from "./mainUI.js";
import { startTimer } from "./timer";
import { uiSetUserXP, selectedPinIndex } from "./accountLogic.js";
import { changeCategory, checkGenerationTypeAndGenerate, mapCategory, transitionToStart } from "./categoryMenu.js";
import { confirmButtonClicks, mapMarkerLat, mapMarkerLong } from "./miniMap.js";
import { calculateDistances, loadResultMap } from "./main.js";

//Global UI --------------------------------------------------------------------------------------------
export let coordsFromHost = [];

let socialMenuMultiplayerButton = document.getElementById("multiplayerButton");
let multiplayerSelectionScreen = document.getElementById("multiplayerSelectionWindow");

let mobileMenuButton = document.getElementById("mobileMenu");

let multiplayerSelectJoin = document.getElementById("multiplayerSelectJoin");
let multiplayerSelectHost = document.getElementById("multiplayerSelectHost");
let multiplayerSelectDuels = document.getElementById("multiplayerSelectDuels");

let multiplayerSelectorClose = document.getElementById("multiplayerSelectorClose");

let joinInfoText = document.getElementById("multiplayerJoinInfo");
let multiplayerJoin = document.getElementById("multiplayerJoin"); //button with join functionality
let multiplayerHost = document.getElementById("multiplayerHost"); //button that creates a room
let nmpzBackground = document.getElementById("nmpzBackground");

//host settings
let roundPlus = document.getElementById("roundPlus");
let roundMinus = document.getElementById("roundMinus");
let roundAmountText = document.getElementById("roundAmountText");

let lengthPlus = document.getElementById("lengthPlus");
let lengthMinus = document.getElementById("lengthMinus");
let roundLengthText = document.getElementById("roundLengthText");

//Duels
let retryDuelFind = document.getElementById("multiplayerDuelRetry");

socialMenuMultiplayerButton.addEventListener("click", toggleMultiplayerSelector);

multiplayerSelectorClose.addEventListener("click", function () {
    leaveMultiplayerRound(); //leave round and if you are the host, also disconnect all peers
    toggleMultiplayerSelector();
});

multiplayerSelectJoin.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("join"); })
multiplayerSelectHost.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("host"); })
multiplayerSelectDuels.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("duels"); })
multiplayerSelectJoin.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })
multiplayerSelectHost.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })
multiplayerSelectDuels.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })

let multiPlayerWindowOpen = false;

export function toggleMultiplayerSelector(alwaysClose) {
    if (alwaysClose == "close") {
        multiPlayerWindowOpen = true;
    }

    if (localStorage.getItem("id") != null || multiplayer) {
        if (multiPlayerWindowOpen) {
            multiplayerSelectionScreen.style.display = "none";
            document.getElementById("blackBackground").style.visibility = "hidden";
        } else {
            multiplayerSelectionScreen.style.display = "block";
            document.getElementById("blackBackground").style.visibility = "visible";
            setMultiplayerWindowSelection("main");
            if (socialBarExpanded) {
                toggleSocialbar();
            }
        }

        multiPlayerWindowOpen = !multiPlayerWindowOpen;
    } else {
        window.location.href = "/signup.html"
    }
}

function changeMultiplayerSelectorInfotext(hoveredButton) {
    const infoText = document.getElementById("multiplayerSelectorInfotext");
    let infoTextContent = "Default infotext.";

    switch (hoveredButton) {
        case "join":
            infoTextContent = "Join a room hosted by another player with a roomcode.";
            break;
        case "host":
            infoTextContent = "Create a new room and share the roomcode.";
            break;
        case "duels":
            infoTextContent = "Automatically play against other online players.";
            break;
        default:
            infoTextContent = "Hover over the modes to learn more about them.";
            break;
    }

    infoText.innerText = infoTextContent;
}

//Pages ---------------------------------------------------------------------------------------
let hostCodeArea = document.getElementById("hostCodeArea");
let roomCreationSettings = document.getElementById("roomCreationSettings");

multiplayerSelectJoin.addEventListener("click", () => { setMultiplayerWindowSelection("join"); })
multiplayerSelectHost.addEventListener("click", () => { setMultiplayerWindowSelection("host"); })
multiplayerSelectDuels.addEventListener("click", () => { setMultiplayerWindowSelection("duel"); })

let multiplayerWindowMain = document.getElementById("multiplayerWindowMain");
let multiplayerWindowJoin = document.getElementById("multiplayerWindowJoin");
let multiplayerWindowHost = document.getElementById("multiplayerWindowHost");
let multiplayerWindowDuel = document.getElementById("multiplayerWindowDuel");
let toggleRestrictions = document.getElementById("toggleRestrictions");

let multiplayerSelectorBack = document.getElementById("multiplayerSelectorBack");
multiplayerSelectorBack.addEventListener("click", function () { setMultiplayerWindowSelection("main") });

function setMultiplayerWindowSelection(window) {
    multiplayerWindowMain.style.display = "none";
    multiplayerWindowJoin.style.display = "none";
    multiplayerWindowHost.style.display = "none";
    multiplayerWindowDuel.style.display = "none";
    multiplayerSelectorBack.style.display = "none";
    multiplayerSelectorBack.style.opacity= "0.5";
    multiplayerSelectorClose.style.opacity = "1";
    multiplayerSelectorBack.style.pointerEvents= "auto";
    multiplayerSelectorClose.style.pointerEvents = "auto";
    hostCodeArea.style.display = "none";
    roomCreationSettings.style.display = "flex";
    multiplayerHost.textContent = "Create room";
    roundLengthText.textContent = "120";
    roundAmountText.textContent = "3";
    retryDuelFind.style.pointerEvents = "none";
    retryDuelFind.style.opacity = "0.5";
    toggleRestrictions.textContent = "Standard";
    document.getElementById("roomCodeInput").value = "";
    multiplayerRestriction = "standard";
    setDuelFindStatus("Initializing...");
    setJoinCounter(0);
    setJoinInfoText("Enter the roomcode.");
    document.getElementById("roomCreationModes").style.display = "flex";
    multiplayerRestriction = "standard";
    setJoinButtonState();
    leaveMultiplayerRound(); //leave round and disconnect all peers if you are the host

    if (window == "main") {
        multiplayerWindowMain.style.display = "block";
        disconnectAllPeersAndCloseRoom();
    } else if (window == "join") {
        multiplayerWindowJoin.style.display = "block";
        multiplayerSelectorBack.style.display = "block";
    } else if (window == "host") {
        multiplayerWindowHost.style.display = "block";
        multiplayerSelectorBack.style.display = "block";
    } else if (window == "duel") {
        multiplayerWindowDuel.style.display = "block";
        multiplayerSelectorBack.style.display = "block";
        findDuel();
    }
}

//Join page ----------------------------------------------------------------------------------------------

multiplayerJoin.addEventListener("click", () => {
    joinRoom(removeWhiteSpace(document.getElementById("roomCodeInput").value));
})

function setJoinInfoText(text) {
    joinInfoText.innerText = text; //this function is used to display things like "Invalid Roomcode" etc.
}

document.getElementById("roomCodeInput").addEventListener("input", setJoinButtonState);

function setJoinButtonState() {
    if (document.getElementById("roomCodeInput").value != "") {
        multiplayerJoin.style.opacity = "1";
        multiplayerJoin.style.pointerEvents = "auto";
    } else {
        multiplayerJoin.style.opacity = "0.5";
        multiplayerJoin.style.pointerEvents = "none";
    }
}

//Host page ------------------------------------------------------------------------------------------------
multiplayerHost.addEventListener("click", () => {
    createRoom(roundAmountText.textContent, roundLengthText.textContent);
});

function showHostCodeArea(roomcode) {
    hostCodeArea.style.display = "flex";
    roomCreationSettings.style.display = "none";
    document.getElementById("roomCodeDisplay").textContent = roomcode;
    document.getElementById("roomCreationModes").style.display = "none";
}

roundPlus.addEventListener("click", () => { hostRoundAmount(1); })
roundMinus.addEventListener("click", () => { hostRoundAmount(-1); })

function hostRoundAmount(changeAmount) {
    let currentRoundAmount = Number(roundAmountText.textContent);
    roundAmountText.textContent = clamp((currentRoundAmount + changeAmount), 2, 10);
}

lengthPlus.addEventListener("click", () => { hostLengthAmount(10); })
lengthMinus.addEventListener("click", () => { hostLengthAmount(-10); })

function hostLengthAmount(changeAmount) {
    let currentLengthAmount = Number(roundLengthText.textContent);
    roundLengthText.textContent = clamp((currentLengthAmount + changeAmount), 10, 300);
}

function setJoinCounter(playerAmount) {
    document.getElementById("joinCounter").textContent = "Players joined: " + (playerAmount + 1);
    if (multiplayerHost.textContent == "Start" && playerAmount == 0) {
        multiplayerHost.style.opacity = "0.5";
        multiplayerHost.style.pointerEvents = "none";
    } else {
        multiplayerHost.style.opacity = "1";
        multiplayerHost.style.pointerEvents = "auto";
    }
}

toggleRestrictions.addEventListener("click", toggleMultiplayerRestriction);

let multiplayerRestriction = "standard";

function toggleMultiplayerRestriction() {
    if (toggleRestrictions.textContent == "Standard") {
        toggleRestrictions.textContent = "No move (NMPZ)";
        multiplayerRestriction = "nmpz";
    } else {
        toggleRestrictions.textContent = "Standard";
        multiplayerRestriction = "standard";
    }
}



//Game Ui ------------------------------------------------------------------------------------------------------------------------
export let multiplayer = false;

function setMultiplayerUI() {
    toggleCategoryMenu(true);
    let categoryButton = document.getElementById("categoryMenuButton");
    let floatingSocialButton = document.getElementById("floatingSocialButton");

    if (multiplayer) {
        categoryButton.style.opacity = "0.5";
        categoryButton.style.pointerEvents = "none";
        floatingSocialButton.style.opacity = "0.5";
        floatingSocialButton.style.pointerEvents = "none";
        document.getElementById("mapModeIndicator").style.display = "flex";
        document.getElementById("multiplayerChat").style.display = "flex";
        document.getElementById("multiplayerLeave").style.display = "block";
        document.getElementById("mapModeText").textContent = "Multiplayer (Awaiting info..)";

        mobileMenuButton.style.opacity = "0.5";
        mobileMenuButton.style.pointerEvents = "none";
    } else {
        categoryButton.style.opacity = "1";
        categoryButton.style.pointerEvents = "auto";
        floatingSocialButton.style.opacity = "1";
        floatingSocialButton.style.pointerEvents = "auto";
        document.getElementById("mapModeIndicator").style.display = "none";
        document.getElementById("multiplayerChat").style.display = "none";
        document.getElementById("multiplayerLeave").style.display = "none";
        mobileMenuButton.style.opacity = "1";
        mobileMenuButton.style.pointerEvents = "auto";
    }
}

//if the timer expires for peers or host
export function multiplayerTimerExpired() {
    confirmButtonClicks(); //only do this if the player actually hasnt guessed yet...

    //when the timer expires, but a peer doesn't respond by executing confirmButtonCliks --> still end the round after 1000ms
    if (isHost) {
        setTimeout(function () {
            endMultiplayerRound();
        }, 5000);
    }
}

let roundEnded = false;
export let autoSkipResult;

function endMultiplayerRound() {
    if (!roundEnded) {
        if (isHost) {
            sendMessageToAll("roundOver", multiplayerGuessesLocationsArray);
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            document.getElementById("nextRound").innerHTML = "Wait before skipping... →";
            //After 2 seconds, enable the skip functionality
            setTimeout(function () {
                document.getElementById("nextRound").innerHTML = "Skip →";
                document.getElementById("nextRound").style.opacity = "1";
                document.getElementById("nextRound").style.pointerEvents = "auto";
            }, 2000)
            //After 10 seconds, skip automatically to not let peers wait too long
            autoSkipResult = setTimeout(transitionToStart, 10000);

        } else {
            //if i'ts not the host, hide the next round button!
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            document.getElementById("nextRound").innerHTML = "Waiting for host... →";
        }

        calculateDistances(mapMarkerLat, mapMarkerLong);
        loadResultMap(mapMarkerLat, mapMarkerLong);
        try { multiplayerTimer.stopTimer(); } catch { }; //stop multiplayer timer
        roundEnded = true;
    } else {
        console.warn("Multiplayer round already ended!");
    }
}

let multiplayerHasAlreadyGuessed = false;

export function multiplayerStateToGuessed() {
    if (!multiplayerHasAlreadyGuessed) {
        if (localStorage.getItem("username") != null) {
            distributeChat("System: " + localStorage.getItem("username") + " guessed.");
        } else {
            distributeChat("System: " + savedGuestName + " guessed.");
        }
    }

    if (isHost) {
        if (!multiplayerHasAlreadyGuessed) {
            multiplayerGuessesLocationsArray.push([mapMarkerLat, mapMarkerLong, selectedPinIndex]); //add the hosts guess to the guesses
            multiplayerHasGuessed(); //after that, add one to the guesses (and maybe go to result screen if all guesses are there)
        }
    } else {
        if (!multiplayerHasAlreadyGuessed) {
            peerSendsHost("guessed", {
                lat: mapMarkerLat,
                long: mapMarkerLong,
                style: selectedPinIndex
            });
        }
    }

    multiplayerHasAlreadyGuessed = true;
}

let totalRequiredGuesses = 0;

export function multiplayerHasGuessed() {
    if (multiplayer) {
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

let multiplayerCategory = "default";

// Multiplayer Setup (IF player has an id! ) ---------------------------------------------------------------------------------------
var peer;
let connectedClientsCount = 0;

let roundAmount; //how many rounds to play
let roundLength; //how long the rounds should be in seconds
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

let unqiueUserID = 0;

if (localStorage.getItem("id") != null) {
    unqiueUserID = "openguessr_" + localStorage.getItem("id") + generateRandomCode(2);
} else {
    unqiueUserID = "openguessr_" + "guest_" + generateRandomCode(10);
}

//set up the peer connection
try {
    peer = new Peer(unqiueUserID, {
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },
                { url: 'turn:relay1.expressturn.com:3478', username: 'ef1UDUILFJLZW4Z79M', credential: 'S2Haraluwx2IjS1f' }
            ]
        }
    });
} catch (error) {
    console.error("Could not inizialize PeerJS: " + error);
}

//Joining via Links (also as a guest!) 

var queryString = window.location.search;
let joinOnLoadViaLink = false;

// Check if there is a query string
if (queryString && queryString.length > 1) { // Checking if queryString is not empty
    // Remove the "?" character from the beginning
    queryString = queryString.substring(1);

    // Split the query string by "&" in case there are multiple parameters
    var params = queryString.split('&');

    // Assume the room code is the first parameter
    var roomCode = params[0];

    // You can then use the room code in your application
    console.log("Attempting join via Room Code Link:", roomCode);
    joinOnLoadViaLink = true;
}

document.addEventListener('DOMContentLoaded', function () {
    if (joinOnLoadViaLink) {
        if (peer) {
            try {
                peer.on('open', function () {
                    joinRoom(roomCode);
                });
            } catch (err) {
                console.error("Tried to join via link with initizalized peer, but there was an exception when joining.");
            }
        } else {
            console.error("Tried to join round via link, but peerjs was not initialized yet.");
        }

        joinOnLoadViaLink = false;
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
});

let copyRoomcodeLinkButton = document.getElementById("roomcodeLink");

copyRoomcodeLinkButton.addEventListener("click", copyRoomcodeLink);

function copyRoomcodeLink() {
    navigator.clipboard.writeText(window.location.origin + "/?" + peerId.replace("openguessr_", ""))
        .then(function () {
            copyRoomcodeLinkButton.textContent = "Copied!";
            setTimeout(() => {
                copyRoomcodeLinkButton.textContent = "Copy Link";
            }, 700);
        })
        .catch(function (error) {
            copyRoomcodeLinkButton.textContent = "Error!";
            console.error("Copy error: " + error);
            setTimeout(() => {
                copyRoomcodeLinkButton.textContent = "Copy Link";
            }, 700);
        });
}

function generateFunnyGuestName() {
    var animals = ["Giraffe", "Ape", "Sloth", "Penguin", "Kangaroo", "Panda", "Zebra", "Llama"];
    var randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    savedGuestName = "Guest" + randomAnimal;
    return savedGuestName;
}

let savedGuestName = "none set";

// Logic ------------------------------------------------------------------------------------------------
var conn; // the connection data
export let peerId; //host peer id
export let isHost = false;
export let connectedPeers = [];

function removeConnectedPeerById(peerId) {
    // Find the index of the entry with the given ID
    const index = connectedPeers.findIndex(entry => entry[0] === peerId);

    // If the entry exists in the array, remove it
    if (index !== -1) {
        connectedPeers.splice(index, 1);
    }
}

//Chat -----------------------------------------------------------------------------------------------------
let chatBox = document.getElementById("multiplayerMessageBox");

function resetChat() {
    chatBox.textContent = "";
}

//mainly for peers if they receive a message
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
        if (isHost) {
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

chatSendButton.addEventListener("click", manuallySendChat);

chatInput.addEventListener("keydown", function (event) {
    if (document.activeElement === chatInput && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        manuallySendChat();
    }
});

function manuallySendChat() {
    if (chatInput.value != "") {
        if (localStorage.getItem("username") != null) {
            distributeChat(localStorage.getItem("username") + ": " + chatInput.value);
        } else {
            distributeChat(savedGuestName + ": " + chatInput.value);
        }
        chatInput.value = "";
    }
}

//Find Duel Logic ------------------------------------------------------------------------------------------

let roomIndex = 0;
let matchmakingActive = false;

//set info text
let multiplayerDuelInfo = document.getElementById("multiplayerDuelInfo");
function setDuelFindStatus(text) {
    multiplayerDuelInfo.textContent = text;
}

//this initiates the find duel system
async function findDuel() {
    roomIndex = 0; //reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive = true;
    setRetryButtonState();
    setDuelFindStatus("Starting...");
    attemptDuelJoin(roomIndex);
}

//This function attempts to get a room code from the server and to join the room
async function attemptDuelJoin(index) {
    if (index == 0) {
        setDuelFindStatus("Requesting roomcode...");
    } else {
        setDuelFindStatus("Requesting new roomcode...");
    }
    let receivedRoomCode = "default";

    //Get Roomcode from server
    try {
        const response = await fetch("https://api.openguessr.com/api/rooms/" + index, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem("bearer")
            }
        });

        if (response.ok) {
            receivedRoomCode = await response.json();
            receivedRoomCode = receivedRoomCode.code;
        } else {
            console.error('Error fetching room code:', response.status);
            setDuelFindStatus("Bad Get Request response: " + response.status);
            findNextDuel(); //as this could be a temporary thing, try again
        }

    } catch (error) {
        console.error('Error occurred when trying to fetch room code: ', error);
        setDuelFindStatus("Couldn't send get request");
        matchmakingActive = false; //if there is no sever response, stop the matchmaking process
        setRetryButtonState();
    }

    //Attempt to join if there is a code, otherwise create room
    if (receivedRoomCode != null && receivedRoomCode != "default") {
        joinRoom(receivedRoomCode); //duel find status will be set in this function as well
    } else if (receivedRoomCode == null){
        //create room & hide close + back button for the time
        multiplayerSelectorBack.style.opacity= "0.2";
        multiplayerSelectorClose.style.opacity = "0.2";
        multiplayerSelectorBack.style.pointerEvents= "none";
        multiplayerSelectorClose.style.pointerEvents = "none";
        try {
            changeCategory("standard");
        } catch (e) {
            console.error("Error changing category to standard for multiplayer duels. Error: " + e);
        }
        sendRoomCodeToMatchmakingServer();
        setupMultiplayerRoom(5, 60); //+ auto skip for result screen
    }
}

//This occurs when the peer connect returns an error like peer_unavailable (means = doesn't exist)
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

        const response = await fetch("https://api.openguessr.com/api/rooms/" + peerId.replace("openguessr_", ""), {
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
                    setDuelFindStatus("No match found. Please retry");
                    matchmakingActive = false;
                    setRetryButtonState();
                    leaveMultiplayerRound();
                    deleteRoomCodeFromMatchmakingServer();
                }
            }, 10000); //After 10 seconds, as the room code is now expired, leave the multiplayer round and show the retry button

        } else {
            console.error("Failed sending the Room Code to the server: " + response.status);
            setDuelFindStatus("Error sending roomcode to server: " + response.status);
            matchmakingActive = false;
            setRetryButtonState();
        }

      } catch (error) {
        console.error('Failed making a post request to the server: ', error);
        setDuelFindStatus("Error making a request to server: " + error);
        matchmakingActive = false;
        setRetryButtonState();
      }
}

async function deleteRoomCodeFromMatchmakingServer() {
    try {
        const requestBody = {
          id: localStorage.getItem("id")
        }

        const response = await fetch("https://api.openguessr.com/api/rooms/" + peerId.replace("openguessr_", ""), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ` + localStorage.getItem("bearer")
          },
          body: JSON.stringify(requestBody)
        });
    
        if (!response.ok) {
          console.warn("Failed deleting the Room Code from the server: " + response.status);
          setDuelFindStatus("Error deleting roomcode from server: " + response.status);
        }

      } catch (error) {
        console.error('Failed making a delete request to the server: ', error);
        setDuelFindStatus("Error making a request to server: " + error);
      }
}

retryDuelFind.addEventListener("click", findDuel); //Retry button will trigger the attempt join function

//enable / disable the retry button depending on whether it is currently trying to join/host or not
function setRetryButtonState () {
    if (matchmakingActive) {
        retryDuelFind.style.pointerEvents = "none";
        retryDuelFind.style.opacity = "0.5";
    } else {
        retryDuelFind.style.pointerEvents = "auto";
        retryDuelFind.style.opacity = "1";
        multiplayerSelectorBack.style.opacity= "0.5";
        multiplayerSelectorClose.style.opacity = "1";
        multiplayerSelectorBack.style.pointerEvents= "auto";
        multiplayerSelectorClose.style.pointerEvents = "auto";
    }
}

//Host Logic ----------------------------------------------------------------------------------------------
export let multiplayerGuessesLocationsArray = [];
let multiplayerFirstRoundPlayed = false; // for host and peers! peers use this to see whether they should incrase the round index

if (peer) {
    peer.on('open', function (id) {
        peerId = id; //this also triggers for peers, as their connection opens

        // Set up event listener for incoming connections (HOST LOGIC)
        peer.on('connection', function (incomingConn) {
            if (!roomLocked) {
                connectedPeers.push([incomingConn.peer, incomingConn.metadata.username, incomingConn.metadata.level, incomingConn.metadata.score]);
                connectedClientsCount++;
                setJoinCounter(connectedClientsCount);

                //if duels matchmaking is active, immediately start the round and close the room on the first connection
                if(matchmakingActive) {
                    roomLocked = true;
                    deleteRoomCodeFromMatchmakingServer();
                    StartRoom();
                }

                // Event listener for when the connection is open
                incomingConn.on('open', function () {
                    const welcomeMessage = {
                        type: "initialize",
                        content: {
                            roundAmount: roundAmount,
                            roundLength: roundLength,
                            multiplayerRestriction: multiplayerRestriction,
                            category: multiplayerCategory
                        }
                    }
                    // Send messages
                    incomingConn.send(welcomeMessage);
                    distributeChat("System: " + incomingConn.metadata.username + " joined.");

                    if (!multiplayerFirstRoundPlayed) {
                        sendMessageToAll("showPlayersArray", connectedPeers); //send it to peer
                        showMultiplayerOverlay(true, "Waiting...", connectedPeers); //also show it for host
                    }
                });


                // Receive messages
                incomingConn.on('data', function (data) {
                    if (data.type == "guessed") {
                        multiplayerGuessesLocationsArray.push([data.content.lat, data.content.long, data.content.style]);
                        multiplayerHasGuessed();
                    }

                    if (data.type == "score") {
                        updatePeerDataScore(incomingConn.peer, data.content);
                    }

                    if (data.type == "chat") {
                        distributeChat(data.content);
                    }
                });

                //Peer disconnects
                incomingConn.on('close', function () {
                    connectedClientsCount--;
                    setJoinCounter(connectedClientsCount);
                    removeConnectedPeerById(incomingConn.peer);
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

function createRoom(AmountOfRounds, LengthOfRounds) {
    if (multiplayerHost.textContent != "Start") {
        setupMultiplayerRoom(AmountOfRounds, LengthOfRounds);
        showHostCodeArea("Roomcode: " + peerId.replace("openguessr_", ""));
        multiplayerHost.textContent = "Start";
        setJoinCounter(0); //greys out the start button too
    } else {
        StartRoom();
    }
}

function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds) {
    setDuelFindStatus("Room created. Please wait <10s");
    isHost = true;
    multiplayerFirstRoundPlayed = false;
    multiplayerCategory = mapCategory;
    roomLocked = false;

    if (multiplayerCategory == "hard" || multiplayerCategory == "daily") {
        multiplayerCategory = "standard - auto";
    }

    connectedPeers.push([peerId, localStorage.getItem("username"), uiSetUserXP(localStorage.getItem("experience")).level, 0]); //add yourself (host) to the overview
    showMultiplayerOverlay(true, "Waiting...", connectedPeers);

    //set round and length parameters
    roundAmount = AmountOfRounds;
    roundLength = LengthOfRounds;
}

function StartRoom() {
    if (connectedClientsCount != 0) {
        //start the round (from host)
        multiplayerHost.textContent = "Loading Location...";
        setDuelFindStatus("Starting! Loading location...");
        multiplayer = true;
        setMultiplayerUI();
        showMultiplayerOverlay(true, "Ready...", connectedPeers); //only for host, also to set the map category in mode text
        checkGenerationTypeAndGenerate();
        roomLocked = true;
        matchmakingActive = false;
    } else {
        console.error("No players have joined - cannot start multiplayer room.");
    }
}

//Start the first / next round
export function startMultiplayerRound(latitude, longitude) {
    multiplayerGuessesLocationsArray = []; //reset previous stored guesses from peers

    if (multiplayerFirstRoundPlayed == false) {
        toggleMultiplayerSelector();
        multiplayerFirstRoundPlayed = true;

        sendMessageToAll("start", [latitude, longitude]);
        multiplayerOverlayCountdown();
    } else {
        roundIndex++;

        //check if session isn't over
        if (roundIndex <= roundAmount) {
            setTimeout(() => {
                sendMessageToAll("start", [latitude, longitude]); //for peers
                multiplayerOverlayCountdown(); //for host
            }, 1500)
        }
    }

    distributeChat("System: Starting Round " + roundIndex);
}

//Function to send a message from host to all peers
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
    if (isHost) {
        if (peer && connectedClientsCount != 0) {
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

        if(matchmakingActive) {
            //as this is apparent in leaveMultplayerRound, it is good too
            deleteRoomCodeFromMatchmakingServer();
        }
    }

    connectedClientsCount = 0;
    connectedPeers = [];
    setJoinCounter(connectedClientsCount);
}

//Peer Logic -----------------------------------------------------------------------------------------------------------------
function removeWhiteSpace(input) {
    return input.replace(/\s/g, '');
}

function joinRoom(code) {
    isHost = false;

    setJoinInfoText("Attempting join...");
    setDuelFindStatus("Attempting join...");

    const options = {
        metadata: {
            username: localStorage.getItem("username") == null ? generateFunnyGuestName() : localStorage.getItem("username"),
            level: uiSetUserXP(localStorage.getItem("experience")).level,
            score: 0 //inital score is set to 0
        }
    };

    conn = peer.connect("openguessr_" + code, options);

    // Event listener for when the connection is opened
    conn.on('open', function () {
    });

    // Receive messages
    conn.on('data', function (data) {
        
        if (data.type === "initialize") {
            setJoinInfoText("Joined!");
            setDuelFindStatus("Joined!");
            multiplayer = true;
            setMultiplayerUI();
            toggleMultiplayerSelector("close");
            matchmakingActive = false;
            roundAmount = data.content.roundAmount;
            roundLength = data.content.roundLength;
            multiplayerRestriction = data.content.multiplayerRestriction;
            multiplayerCategory = data.content.category;
        }

        if (data.type === "showPlayersArray") {
            showMultiplayerOverlay(true, "Starting soon...", data.content);
        }

        if (data.type === "showPlayersArrayAfterRound") {
            showMultiplayerOverlay(true, "Results from round " + roundIndex, data.content);
        }

        if (data.type === "start") {
            try {
                coordsFromHost = data.content;
            } catch (error) {
                console.error("Error receiving locations from the host in multiplayer.js Error: ", error);
            }

            if (multiplayerFirstRoundPlayed) {
                roundIndex++;
            }

            multiplayerFirstRoundPlayed = true;
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

        if (data.type === "closeResultScreen") {
            transitionToStart();
        }

        if (data.type === "locked") {
            setJoinInfoText("Room locked!");
        }
    });

    // Event listener for Connection closed
    conn.on('close', function () {
        //if you get disconnected mid round
        if (multiplayer) {
            leaveMultiplayerRound();
            errorPopup("Disconnected from room", "", "User disconnected", false);
        }
        //if you try to join a room that is locked
        if (!multiplayer) {
            setJoinInfoText("Room locked - round ongoing");

            if (matchmakingActive) {
                setDuelFindStatus("Room locked - round ongoing");
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
        errorPopup("Error sending message", "Couldn't send message to host.", "Host unreachable");
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

        if (multiplayer) {
            if (err.type != "network") {
                errorPopup("Multiplayer error", "Fatal multiplayer error. Please reload if you want to use multiplayer.", err.type, true);
            } else {
                errorPopup("Disconnected from round.", "You have left the multiplayer round due to network issues. Check your and the host's connection.", err.type, false);
            }

            leaveMultiplayerRound();
        } else {
            setJoinInfoText("Failed to join.");
        }

        if (matchmakingActive) {
            if (err.type == "peer-unavailable" && !isHost) {
                findNextDuel();
            } else {
                setDuelFindStatus("Please try again. Error: " + err.type);
                matchmakingActive = false;
                setRetryButtonState();
            }

            if (isHost) {
                deleteRoomCodeFromMatchmakingServer(); //the retry button will also appear as seen above
            }
        }

    });

    peer.on('close', function () {
        errorPopup("Multiplayer connection closed", "Your multiplayer connection was closed.", "Error: Connection Closed", false);
        if (multiplayer) {
            leaveMultiplayerRound();
        }

        if (isHost && matchmakingActive) {
            deleteRoomCodeFromMatchmakingServer(); //this happens when you close the tab / leave or refresh the page
        }
    });
}

//Multiplayer leave ----------------------------------------------------------------------------------
let leaveButton = document.getElementById("multiplayerLeave");

leaveButton.addEventListener("click", leaveMultiplayerRound);

function leaveMultiplayerRound() {
    //important! first step is disabling multiplayer
    if (multiplayer) {
        multiplayer = false;
        checkGenerationTypeAndGenerate();
    }

    if (isHost) {
        disconnectAllPeersAndCloseRoom(); //only does this if there are clients connected (connectedClientsCount != 0)
    } else {
        if (conn) {
            try {
                conn.close();
                console.log("closed");
            } catch (error) {
                console.error("Error when closing connection in multiplayer js: " + error);
            }
        }
    }

    try { multiplayerTimer.stopTimer(); } catch { }; //has to be in try catch
    multiplayer = false;
    setMultiplayerUI();
    showMultiplayerOverlay(false);
    roundIndex = 1;
    multiplayerFirstRoundPlayed = false;
    roomLocked = true;
    multiplayerGuessesLocationsArray = [];
    connectedPeers = [];
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;
    multiplayerRestriction = "standard";
    resetChat();
    matchmakingActive = false;
    isHost = false;

    //reset UI things
    document.getElementById("confirmButton").textContent = "Guess";
    document.getElementById("confirmButton").style.pointerEvents = "auto";
    document.getElementById("confirmButton").style.visibility = "visible";
    document.getElementById("map").style.pointerEvents = "auto";
    document.getElementById("map").style.visibility = "visible";
    hideToggleMapButtonIfMobile(false);
    document.getElementById("nextRound").style.opacity = "1";
    document.getElementById("nextRound").style.pointerEvents = "auto";
    document.getElementById("nextRound").textContent = "Next round →";
    endMultiplayerRoundButton.style.display = "none";
    nmpzBackground.style.pointerEvents = "none";
}

//Streetview Overlay UI -------------------------------------------------------------------------------------------------------------------
let endMultiplayerRoundButton = document.getElementById("endMultiplayerRoundButton");
endMultiplayerRoundButton.addEventListener("click", leaveMultiplayerRound);

export function showMultiplayerOverlay(show, title, array) {
    if (show) {
        document.getElementById("multiplayerFade").style.opacity = "1";
        document.getElementById("multiplayerFade").style.pointerEvents = "auto";
        document.getElementById("multiplayerTitle").textContent = title;

        //before the first round has been played, we want to display the host's category
        if (!multiplayerFirstRoundPlayed) {
            document.getElementById("mapModeText").textContent = "Multiplayer (Map: " + multiplayerCategory + ")";
        }

        // Sort array by score in descending order
        array.sort((a, b) => b[3] - a[3]);

        if (roundIndex >= roundAmount) {
            let winningPlayerData = array[0];
            let winningUsername = winningPlayerData[1];

            document.getElementById("multiplayerTitle").textContent = winningUsername + " won!";
            endMultiplayerRoundButton.style.display = "block";

            if (isHost) {
                endMultiplayerRoundButton.textContent = "End Round";
            } else {
                endMultiplayerRoundButton.textContent = "Leave Round";
            }
        } else {
            endMultiplayerRoundButton.style.display = "none";
        }

        let body = '';

        let yourPeerId = peerId;

        // Generate HTML for each player
        array.forEach(playerInfo => {
            const [peerId, username, level, score] = playerInfo;
            if (peerId == yourPeerId) {
                body += `
                <div class="multiplayerOverlayEntry yourMultiplayerOverlay">
                    <div class="multiplayerEntryPlayerInfo">
                        <div class="multiplayerEntryPlayerName">${username} (Lvl. ${level})</div>
                        <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                    </div>
                </div>
            `;
            } else {
                body += `
                <div class="multiplayerOverlayEntry">
                    <div class="multiplayerEntryPlayerInfo">
                        <div class="multiplayerEntryPlayerName">${username} (Lvl. ${level})</div>
                        <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                    </div>
                </div>
            `;
            }
        });

        document.getElementById("multiplayerTable").innerHTML = body;
        document.getElementById("confirmButton").style.visibility = "hidden";
        document.getElementById("confirmButton").style.pointerEvents = "none";
        document.getElementById("map").style.visibility = "hidden";
        hideToggleMapButtonIfMobile(true);
        document.getElementById("revealCompass").style.visibility = "hidden";
    } else {
        document.getElementById("multiplayerFade").style.opacity = "0";
        document.getElementById("multiplayerFade").style.pointerEvents = "none";
        document.getElementById("confirmButton").style.visibility = "visible";
        document.getElementById("map").style.visibility = "visible";
        hideToggleMapButtonIfMobile(false);
        document.getElementById("revealCompass").style.visibility = "visible";
    }
}

let multiplayerTimer;

//this starts the round visually and code-wise for all peers (also host, but host also starts with startMultiplayerRound() )
function multiplayerOverlayCountdown() {
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;

    const multiplayerTitle = document.getElementById("multiplayerTitle");
    let countdown = 3;

    const countdownInterval = setInterval(function () {
        if (countdown > 0) {
            multiplayerTitle.textContent = `Starting... ${countdown}`;
            countdown--;
        } else {
            clearInterval(countdownInterval); // Stop the countdown
            showMultiplayerOverlay(false); //hide the overlay --> round starts
            document.getElementById("map").style.pointerEvents = "auto"; //re-enable the map
            document.getElementById("confirmButton").textContent = "Guess";
            try { multiplayerTimer.stopTimer(); } catch { }; //stop multiplayer timer (redudancy)
            multiplayerTimer = startTimer(roundLength, multiplayerTimerExpired); //Start the timer
            document.getElementById("mapModeText").textContent = "Multiplayer (Round: " + roundIndex + "/" + roundAmount + ")";
            if (multiplayerRestriction == "nmpz") {
                document.getElementById("mapModeText").textContent += " (NMPZ)";
            }
            totalRequiredGuesses = connectedClientsCount + 1; //connections + 1 for the host
            if (multiplayerRestriction == "nmpz") {
                nmpzBackground.style.pointerEvents = "auto";
            } else {
                nmpzBackground.style.pointerEvents = "none";
            }
        }
    }, 1000);
}
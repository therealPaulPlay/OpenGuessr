import { clamp, loadAndInitializeLibrary } from "./main.js";
import { errorPopup } from "./errorHandling.js";
import { toggleCategoryMenu, hideToggleMapButtonIfMobile, disableResultScreen, showPageBrowser, setGamemodeSelector, showConfirmPopup } from "./mainUI.js";
import { startTimer } from "./timer";
import { uiSetUserXP, isAuthenticated } from "./accountLogic.js";
import { selectedBadge, selectedPinIndex, supporterLevel } from "./profileView.js";
import { changeCategory, checkGenerationTypeAndGenerate, mapCategory, mapSupportsMultiplayer, transitionToStart } from "./categoryMenu.js";
import { confirmButtonClicks, mapMarkerLat, mapMarkerLong, updateMinimapWithTeamMarkers } from "./miniMap.js";
import { calculateDistances, loadResultMap } from "./main.js";
import { playSound } from "./soundManager.js";
import { addDuelPlayed, addDuelWon, loadProfileFromId } from "./profileView.js";

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

let teamsPlus = document.getElementById("teamsPlus");
let teamsMinus = document.getElementById("teamsMinus");
let teamAmountText = document.getElementById("teamAmountText");

//Duels
let retryDuelFind = document.getElementById("multiplayerDuelRetry");

socialMenuMultiplayerButton.addEventListener("click", () => {
    toggleMultiplayerSelector();
    playSound("basic_button");
});

multiplayerSelectorClose.addEventListener("click", function () {
    playSound("basic_button");
    leaveMultiplayerRound(); //leave round and if you are the host, also disconnect all peers
    toggleMultiplayerSelector();
});

let multiPlayerWindowOpen = false;

let uniqueUserID = 0; // used in setup for peerJS as peer id

export function toggleMultiplayerSelector(alwaysClose) {
    if (alwaysClose == "close") {
        multiPlayerWindowOpen = true;
    }

    if (multiPlayerWindowOpen) {
        multiplayerSelectionScreen.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    } else {
        multiplayerSelectionScreen.style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
        setMultiplayerWindowSelection("main");
    }

    multiPlayerWindowOpen = !multiPlayerWindowOpen;
}

//Pages ---------------------------------------------------------------------------------------
let hostCodeArea = document.getElementById("hostCodeArea");
let roomCreationSettings = document.getElementById("roomCreationSettings");
let teamAmount = 1;

multiplayerSelectJoin.addEventListener("click", () => { playSound("basic_button"); setMultiplayerWindowSelection("join"); })
multiplayerSelectHost.addEventListener("click", () => { playSound("basic_button"); setMultiplayerWindowSelection("host"); })
multiplayerSelectDuels.addEventListener("click", () => { playSound("basic_button"); setMultiplayerWindowSelection("duel"); })

let multiplayerWindowMain = document.getElementById("multiplayerWindowMain");
let multiplayerWindowJoin = document.getElementById("multiplayerWindowJoin");
let multiplayerWindowHost = document.getElementById("multiplayerWindowHost");
let multiplayerWindowDuel = document.getElementById("multiplayerWindowDuel");
let toggleRestrictions = document.getElementById("toggleRestrictions");

let multiplayerSelectorBack = document.getElementById("multiplayerSelectorBack");
multiplayerSelectorBack.addEventListener("click", function () { playSound("basic_button"); setMultiplayerWindowSelection("main"); });

function setMultiplayerWindowSelection(window) {
    multiplayerWindowMain.style.display = "none";
    multiplayerWindowJoin.style.display = "none";
    multiplayerWindowHost.style.display = "none";
    multiplayerWindowDuel.style.display = "none";
    multiplayerSelectorBack.style.display = "none";
    multiplayerSelectorBack.style.opacity = "0.5";
    multiplayerSelectorClose.style.opacity = "1";
    document.getElementById("multiplayerMapDisplay").textContent = mapCategory.replace("community_", "");
    multiplayerSelectorBack.style.pointerEvents = "auto";
    multiplayerSelectorClose.style.pointerEvents = "auto";
    hostCodeArea.style.display = "none";
    roomCreationSettings.style.display = "flex";
    multiplayerHost.textContent = "Create room";
    roundLengthText.textContent = "120";
    roundAmountText.textContent = "3";
    teamAmountText.textContent = "no";
    teamAmount = 1;
    retryDuelFind.style.pointerEvents = "none";
    retryDuelFind.style.opacity = "0.5";
    toggleRestrictions.textContent = "Standard";
    document.getElementById("roomCodeInput").value = "";
    multiplayerRestriction = "standard";
    setDuelFindStatus("Initializing...");
    setJoinCounter(0);
    document.getElementById("teamsDisplayText").textContent = "Nothing to display";
    setJoinInfoText("Enter the roomcode.");
    document.getElementById("roomCreationModes").style.display = "flex";
    document.getElementById("roomCreationTeams").style.display = "flex";
    document.getElementById("roomCreationMap").style.display = "flex";
    document.getElementById("roomcodeLink").style.display = "none";
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
        if (isAuthenticated) {
            multiplayerWindowDuel.style.display = "block";
            multiplayerSelectorBack.style.display = "block";
            findDuel();
        } else {
            toggleMultiplayerSelector("close");
            showPageBrowser("/signup.html", true);
        }
    }
}

//Join page ----------------------------------------------------------------------------------------------

multiplayerJoin.addEventListener("click", () => {
    //disable join button for 1s to prevent spamming from causing issues
    multiplayerJoin.style.pointerEvents = "none";
    multiplayerJoin.style.opacity = "0.5";
    playSound("start_button");
    joinRoom(removeWhiteSpace(document.getElementById("roomCodeInput").value));
});

document.getElementById("roomCodeInput").addEventListener("keydown", function (event) {
    if (document.activeElement === document.getElementById("roomCodeInput") && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        multiplayerJoin.style.pointerEvents = "none";
        multiplayerJoin.style.opacity = "0.5";
        playSound("start_button");
        joinRoom(removeWhiteSpace(document.getElementById("roomCodeInput").value));
    }
});

function setJoinInfoText(text) {
    joinInfoText.innerText = text; //this function is used to display things like "Invalid Roomcode" etc.
    document.getElementById("linkjoinStatus").textContent = text; // link join popup for status info
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
    document.getElementById("roomCreationTeams").style.display = "none";
    document.getElementById("roomCreationMap").style.display = "none";
    document.getElementById("roomcodeLink").style.display = "block";
}

roundPlus.addEventListener("click", () => { hostRoundAmount(1, true); })
roundMinus.addEventListener("click", () => { hostRoundAmount(-1, true); })

function hostRoundAmount(changeAmount, sound) {
    let currentRoundAmount = Number(roundAmountText.textContent);
    roundAmountText.textContent = clamp((currentRoundAmount + changeAmount), 2, 10);

    if (sound) {
        playSound("change_value");
    }
}

lengthPlus.addEventListener("click", () => { hostLengthAmount(10, true); })
lengthMinus.addEventListener("click", () => { hostLengthAmount(-10, true); })

function hostLengthAmount(changeAmount, sound) {
    let currentLengthAmount = Number(roundLengthText.textContent);
    roundLengthText.textContent = clamp((currentLengthAmount + changeAmount), 10, 300);

    if (sound) {
        playSound("change_value");
    }
}

teamsPlus.addEventListener("click", () => { hostTeamAmount(1, true); });
teamsMinus.addEventListener("click", () => { hostTeamAmount(-1, true); });

function hostTeamAmount(changeAmount, sound) {
    teamAmount = clamp((teamAmount + changeAmount), 1, 5);
    teamAmountText.textContent = teamAmount == 1 ? "no" : teamAmount;

    if (sound) {
        playSound("change_value");
    }
}

function setJoinCounter(playerAmount) {
    document.getElementById("joinCounter").textContent = "Players joined: " + (playerAmount + 1);
    if (multiplayerHost.textContent == "Start" && ((playerAmount + 1) < teamAmount || playerAmount == 0)) {
        multiplayerHost.style.opacity = "0.5";
        multiplayerHost.style.pointerEvents = "none";
    } else {
        multiplayerHost.style.opacity = "1";
        multiplayerHost.style.pointerEvents = "auto";
    }
}

function updateTeamDisplay() {
    const amountOfTeams = teamAmount;
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


toggleRestrictions.addEventListener("click", () => {
    toggleMultiplayerRestriction();
    playSound("basic_button");
});

let multiplayerRestriction = "standard";

let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
let currentRestrictionIndex = 0;

function toggleMultiplayerRestriction() {
    if (toggleRestrictions.textContent == "Standard") {
        currentRestrictionIndex = 1; // start from the first restriction after standard
    } else {
        currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
    }
    multiplayerRestriction = restrictions[currentRestrictionIndex];

    // Update the button text
    switch (multiplayerRestriction) {
        case "nmpz":
            toggleRestrictions.textContent = "No move (NMPZ)";
            break;
        case "grayscale":
            toggleRestrictions.textContent = "Grayscale";
            break;
        case "invert":
            toggleRestrictions.textContent = "Invert Colors";
            break;
        case "hue":
            toggleRestrictions.textContent = "Hue Shift";
            break;
        case "fade":
            toggleRestrictions.textContent = "Blink (Fade)";
            break;
        case "standard":
        default:
            toggleRestrictions.textContent = "Standard";
            break;
    }

    setRestriction(multiplayerRestriction);
}

//Game Ui ------------------------------------------------------------------------------------------------------------------------
export let multiplayer = false;

function setMultiplayerUI() {
    toggleCategoryMenu(true);
    let categoryButton = document.getElementById("categoryMenuButton");
    let hardmodeTimerButton = document.getElementById("timerButton");

    if (multiplayer) {
        categoryButton.style.opacity = "0.5";
        categoryButton.style.pointerEvents = "none";
        setGamemodeSelector(false);
        hardmodeTimerButton.style.opacity = "0.5";
        hardmodeTimerButton.style.pointerEvents = "none";
        document.getElementById("mapModeIndicator").style.display = "flex";
        document.getElementById("multiplayerChat").style.display = "flex";
        document.getElementById("multiplayerLeave").style.display = "block";
        document.getElementById("revealCompass").style.bottom = "calc(50% - 10px)";
        document.getElementById("mapModeText").textContent = "Multiplayer (Awaiting info..)";

        //hide country picker UI
        document.getElementById("countryGuesserSelector").style.display = "none";

        mobileMenuButton.style.opacity = "0.5";
        mobileMenuButton.style.pointerEvents = "none";

        // disable result screen if it is open (edge case)
        if (document.getElementById("EndOverlay").style.opacity != "0%") {
            disableResultScreen();
        }
    } else {
        categoryButton.style.opacity = "1";
        categoryButton.style.pointerEvents = "auto";
        setGamemodeSelector(true);
        hardmodeTimerButton.style.opacity = "1";
        hardmodeTimerButton.style.pointerEvents = "auto";
        document.getElementById("mapModeIndicator").style.display = "none";
        document.getElementById("multiplayerChat").style.display = "none";
        document.getElementById("multiplayerLeave").style.display = "none";
        document.getElementById("revealCompass").style.bottom = "calc(50% - 40px)";
        mobileMenuButton.style.opacity = "1";
        mobileMenuButton.style.pointerEvents = "auto";
    }
}

//if the timer expires for peers or host

let endMultiplayerRoundIfGuessMissing;

export function multiplayerTimerExpired() {
    confirmButtonClicks(); //only do this if the player actually hasnt guessed yet...

    // when the timer expires, but a peer doesn't respond by executing confirmButtonCliks --> still end the round after 2000ms
    if (isHost) {
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
        if (isHost) {
            clearTimeout(endMultiplayerRoundIfGuessMissing);
            sendMessageToAll("roundOver", multiplayerGuessesLocationsArray);
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            // After 2 seconds (or 5 for duels), enable the skip functionality
            let skipTimeout = playingDuels ? 5000 : 2000;
            document.getElementById("nextRoundText").textContent = "Wait " + (skipTimeout / 1000) + "s...";

            setTimeout(function () {
                document.getElementById("nextRoundText").textContent = "Skip";
                document.getElementById("nextRound").style.opacity = "1";
                document.getElementById("nextRound").style.pointerEvents = "auto";
            }, skipTimeout)

            // After 10 seconds, skip automatically to not let peers wait too long in Duels
            if (playingDuels) {
                autoSkipResult = setTimeout(() => { transitionToStart() }, 10000);
            }

        } else {
            //if i'ts not the host, hide the next round button!
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            document.getElementById("nextRoundText").textContent = "Waiting for host...";
        }

        if (!lateJoinedWaiting) {
            calculateDistances(mapMarkerLat, mapMarkerLong);
            loadResultMap(mapMarkerLat, mapMarkerLong);
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
        if (localStorage.getItem("username") != null) {
            distributeChat("System: " + localStorage.getItem("username") + " guessed.");
        } else {
            distributeChat("System: " + savedGuestName + " guessed.");
        }
    }

    if (isHost) {
        if (!multiplayerHasAlreadyGuessed) {
            multiplayerGuessesLocationsArray.push([mapMarkerLat, mapMarkerLong, selectedPinIndex, localStorage.getItem("username") != null ? localStorage.getItem("username") : savedGuestName]); //add the hosts guess to the guesses
            multiplayerHasGuessed(); // this substracts one from the total requried guesses (and maybe ends the round)
        }

    } else {
        if (!multiplayerHasAlreadyGuessed) {
            peerSendsHost("guessed", {
                lat: mapMarkerLat,
                long: mapMarkerLong,
                style: selectedPinIndex,
                name: localStorage.getItem("username") != null ? localStorage.getItem("username") : savedGuestName
            });
        }
    }

    multiplayerHasAlreadyGuessed = true;

    // Reduce time for the opponent in duels (after setting ..hasGuessed!!)
    if (playingDuels) {
        if (isHost) {
            sendMessageToAll("timeReduce", 15); // 15 seconds
            showTimeReduceOverlay(15, true); // reduce time for the host too
        } else {
            peerSendsHost("timeReduce", 15); // 15 seconds, the host will respond with a time reduce for everyone
        }
    }
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

export let multiplayerCategory = "standard";

// Multiplayer Setup (IF player has an id! ) ---------------------------------------------------------------------------------------
let peer;
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

document.getElementById("linkJoinClose").addEventListener("click", () => {
    playSound("basic_button");
    setLinkjoinPopup(false);
});

// called in accountLogic after signin status was set
export function attemptJoinViaLink() {
    if (joinOnLoadViaLink) {
        if (peer) {
            try {
                setLinkjoinPopup(true);
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

function setLinkjoinPopup(show) {
    if (show) {
        document.getElementById("linkjoinWindow").style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
    } else {
        document.getElementById("linkjoinWindow").style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    }
}

let copyRoomcodeLinkButton = document.getElementById("roomcodeLink");

copyRoomcodeLinkButton.addEventListener("click", () => {
    copyRoomcodeLink();
    playSound("basic_button");
});

function copyRoomcodeLink() {
    navigator.clipboard.writeText(window.location.origin + "/?join=" + peerId.replace("openguessr_", ""))
        .then(function () {
            document.getElementById("linkIcon").src = "/IMG/link_success_icon.png";
            setTimeout(() => {
                document.getElementById("linkIcon").src = "/IMG/link_icon.png";
            }, 700);
        })
        .catch(function (error) {
            document.getElementById("linkIcon").src = "/IMG/link_error_icon.png";
            console.error("Copy error: " + error);
            setTimeout(() => {
                document.getElementById("linkIcon").src = "/IMG/link_icon.png";
            }, 700);
        });
}

// Vars ------------------------------------------------------------------------------------------------
let conn; // the connection data
export let peerId;
export let isHost = false;
export let connectedPeers = [];

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
let playingDuels = false;

//set info text
let multiplayerDuelInfo = document.getElementById("multiplayerDuelInfo");
function setDuelFindStatus(text) {
    multiplayerDuelInfo.textContent = text;
    try {
        if (text.toLowerCase().includes("wait")) {
            multiplayerDuelInfo.classList.add("loading");
        } else {
            multiplayerDuelInfo.classList.remove("loading");
        }
    } catch (error) {
        console.error("Failed to animate loading text in multiplayer js: " + error);
    }
}

//this initiates the find duel system
async function findDuel() {
    roomIndex = 0; //reset roomIndex every time you (re)try to find a duel (if joining fails, this will be set to the next value)
    matchmakingActive = true;
    playingDuels = true;
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
    } else if (receivedRoomCode == null) {
        //create room & hide close + back button for the time
        multiplayerSelectorBack.style.opacity = "0.2";
        multiplayerSelectorClose.style.opacity = "0.2";
        multiplayerSelectorBack.style.pointerEvents = "none";
        multiplayerSelectorClose.style.pointerEvents = "none";
        try {
            changeCategory("standard", false); //this will only change the category and not generate! (to prevent skip of first round)
        } catch (e) {
            console.error("Error changing category to standard for multiplayer duels. Error: " + e);
        }
        setupMultiplayerRoom(5, 60); //+ auto skip for result screen
        sendRoomCodeToMatchmakingServer();
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

        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/host/" + peerId.replace("openguessr_", ""), {
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
            }, 10000); // After 10 seconds, as the room code is now expired, leave the multiplayer round and show the retry button

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

        const response = await fetch("https://accounts.openguessr.com/accounts/rooms/delete/" + peerId.replace("openguessr_", ""), {
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

retryDuelFind.addEventListener("click", () => {
    findDuel();
    playSound("basic_button");
}); //Retry button will trigger the attempt join function

//enable / disable the retry button depending on whether it is currently trying to join/host or not
function setRetryButtonState() {
    if (matchmakingActive) {
        retryDuelFind.style.pointerEvents = "none";
        retryDuelFind.style.opacity = "0.5";
    } else {
        retryDuelFind.style.pointerEvents = "auto";
        retryDuelFind.style.opacity = "1";
        multiplayerSelectorBack.style.opacity = "0.5";
        multiplayerSelectorClose.style.opacity = "1";
        multiplayerSelectorBack.style.pointerEvents = "auto";
        multiplayerSelectorClose.style.pointerEvents = "auto";
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
        peerId = id; // this also triggers for peers, as their connection opens
        peerOpen = true;
    });
}

//Host Logic ----------------------------------------------------------------------------------------------
export let multiplayerGuessesLocationsArray = [];
let multiplayerFirstRoundPlayed = false; // for host and peers! peers use this to see whether they should incrase the round index
export let yourTeam = 1;
export let highestMultiplayerSupporterLevel = 1; // in multiplayer, the highest supporter stage will be used for the supporter bonus for everyone

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
                if (matchmakingActive) {
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

                        if (incomingConn.metadata.supporterLevel > highestMultiplayerSupporterLevel) {
                            highestMultiplayerSupporterLevel = incomingConn.supporterLevel;
                        }

                    } else {
                        setTimeout(() => {
                            incomingConn.close();
                            distributeChat("System: " + incomingConn.metadata.username + " kicked (duplicate).");
                        }, 500);
                    }

                    connectedClientsCount++;
                    setJoinCounter(connectedClientsCount);
                    updateTeamDisplay();
                    clearTimeout(brokenConnectionTimeout); //stop the broken-connection kick timer

                    const initialMessage = {
                        type: "initialize",
                        content: {
                            roundAmount: roundAmount,
                            currentRound: roundIndex,
                            roundLength: roundLength,
                            teamAmount: teamAmount,
                            team: getTeamFromPeerId(incomingConn.peer),
                            multiplayerRestriction: multiplayerRestriction,
                            category: multiplayerCategory
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
                        if (teamAmount > 1) { updateMinimapWithTeamMarkers(teamMarkerArray) };
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
                    connectedClientsCount--;
                    setJoinCounter(connectedClientsCount);
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

function createRoom(AmountOfRounds, LengthOfRounds) {
    if (multiplayerHost.textContent != "Start") {
        setupMultiplayerRoom(AmountOfRounds, LengthOfRounds);
        showHostCodeArea("Roomcode: " + peerId.replace("openguessr_", ""));
        multiplayerHost.textContent = "Start";
        setJoinCounter(0); //greys out the start button too
        updateTeamDisplay();
        playSound("basic_button");
    } else {
        StartRoom();
        playSound("start_button");
    }
}

function setupMultiplayerRoom(AmountOfRounds, LengthOfRounds) {
    setDuelFindStatus("Room created. Please wait <10s");
    isHost = true;
    multiplayerFirstRoundPlayed = false;
    multiplayerCategory = mapCategory;

    if (!mapSupportsMultiplayer(multiplayerCategory)) {
        multiplayerCategory = "standard";
    }

    connectedPeers.push([peerId, localStorage.getItem("username") == null ? savedGuestName : localStorage.getItem("username"), uiSetUserXP(localStorage.getItem("experience")).level, 0, 1, localStorage.getItem("id"), selectedBadge]); //add yourself (host) to the overview
    yourTeam = 1; // Host is always in team 1
    showMultiplayerOverlay(true, "Waiting...", connectedPeers);

    //set round and length parameters
    roundAmount = AmountOfRounds;
    roundLength = LengthOfRounds;

    // set supporter level to own supporter level as baseline
    highestMultiplayerSupporterLevel = supporterLevel || 0;

    //unlock room
    roomLocked = false;
}

// Start room (HOST function)
function StartRoom() {
    //start the round (from host)
    multiplayerHost.textContent = "Loading Location...";
    setDuelFindStatus("Starting! Loading location...");
    multiplayer = true;
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

//Start the first / next round
export async function startMultiplayerRound(latitude, longitude) {
    multiplayerGuessesLocationsArray = []; // reset previous stored guesses from peers
    teamMarkerArray = [];
    totalRequiredGuesses = connectedClientsCount + 1; //connections + 1 for the host (this is being set here as well as after the countdown)

    if (!multiplayerFirstRoundPlayed) {
        toggleMultiplayerSelector("close");
        multiplayerFirstRoundPlayed = true;
    } else {
        roundIndex++
        if (roundIndex > roundAmount) {
            return;
        } else {
            // if it is not the first round, wait to show the results properly
            await new Promise(resolve => { setTimeout(resolve, 1500); });
        }
    }

    sendMessageToAll("start", { coordinates: [latitude, longitude], highestSupporterLevel: highestMultiplayerSupporterLevel });
    distributeChat("System: Starting Round " + roundIndex);
    multiplayerOverlayCountdown(); // for host
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

        if (matchmakingActive) {
            //as this is apparent in leaveMultplayerRound, it is good too
            deleteRoomCodeFromMatchmakingServer();
        }
    }

    connectedClientsCount = 0;
    connectedPeers = [];
    updateTeamDisplay();
    setJoinCounter(connectedClientsCount);
}

let teamMarkerArray = [];

export function sendTeamMarkers(lat, long) {
    if (multiplayer) {
        if (isHost) {
            addReplaceTeamMarkers(peerId, lat, long, selectedPinIndex, yourTeam);
            sendMessageToAll("teamMarkers", teamMarkerArray);
        } else {
            peerSendsHost("teamMarkers", { id: peerId, lat: lat, long: long, pin: selectedPinIndex, team: yourTeam });
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

//Peer Logic -----------------------------------------------------------------------------------------------------------------
function removeWhiteSpace(input) {
    return input.replace(/\s/g, '');
}

async function joinRoom(code) {
    // if peer isn't open yet, await that
    if (!peerOpen) {
        await new Promise(resolve => {
            peer.on('open', () => {
                resolve();
            })
        });
    }

    isHost = false;
    multiplayerFirstRoundPlayed = false;

    setJoinInfoText("Attempting join...");
    setDuelFindStatus("Attempting join...");

    const options = {
        metadata: {
            username: localStorage.getItem("username") == null ? savedGuestName : localStorage.getItem("username"),
            level: uiSetUserXP(localStorage.getItem("experience")).level,
            score: 0, //inital score is set to 0,
            id: localStorage.getItem("id"),
            badge: selectedBadge,
            supporterLevel: supporterLevel
        }
    };

    conn = peer.connect("openguessr_" + code, options);

    // Event listener for when the connection is opened
    conn.on('open', function () {
        setJoinInfoText("Connection opened...");
        setDuelFindStatus("Connection opened...");
    });

    // Receive messages
    conn.on('data', function (data) {

        if (data.type === "initialize") {
            setJoinInfoText("Joined!");
            setDuelFindStatus("Joined!");
            multiplayer = true;
            setMultiplayerUI();
            toggleMultiplayerSelector("close");
            setLinkjoinPopup(false);
            matchmakingActive = false;
            roundAmount = data.content.roundAmount;
            roundLength = data.content.roundLength;
            teamAmount = data.content.teamAmount;
            multiplayerRestriction = data.content.multiplayerRestriction;
            multiplayerCategory = data.content.category;
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
                coordsFromHost = data.content.coordinates;
                highestMultiplayerSupporterLevel = data.content.highestSupporterLevel;
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
            if (teamAmount > 1) { updateMinimapWithTeamMarkers(teamMarkerArray) };
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
        if (multiplayer) {
            leaveMultiplayerRound();
            errorPopup("Disconnected from room", "The connection to the host was closed.", "", false, true);
        }

        //if you try to join a room that is locked
        if (!multiplayer) {
            setJoinInfoText("Room locked.");
            setJoinButtonState();

            if (matchmakingActive) {
                setDuelFindStatus("Room locked.");
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
        if (multiplayer) {
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

        if (multiplayer) {
            if (err.type != "network") {
                errorPopup("Multiplayer error", "Fatal multiplayer error. Please reload if you want to use multiplayer.", err.type, true);
            } else {
                errorPopup("Disconnected from round", "You have left the multiplayer round due to network issues. Check your and the host's connection.", err.type, false);
            }

            leaveMultiplayerRound();
        } else {
            setJoinInfoText("Failed to join.");
            setJoinButtonState();
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
        errorPopup("Multiplayer connection closed", "Your multiplayer connection was permanently closed. Please reload the page.", "Error: Connection Closed", false);
        if (multiplayer) {
            leaveMultiplayerRound();
        }

        if (isHost && matchmakingActive) {
            deleteRoomCodeFromMatchmakingServer(); //this happens when you close the tab / leave or refresh the page
        }

        peer.destroy(); //clean up peer
    });
}

//Multiplayer leave ----------------------------------------------------------------------------------
let leaveButton = document.getElementById("multiplayerLeave");

leaveButton.addEventListener("click", () => {
    showConfirmPopup("Leave match?", "You are about to leave the multiplayer room. Are you sure?", leaveMultiplayerRound, false);
    playSound("leave_round");
});

function leaveMultiplayerRound() {
    //important! first step is disabling multiplayer
    let wasMultiplayerEnabled = false;

    if (multiplayer) {
        multiplayer = false;
        wasMultiplayerEnabled = true;
    }

    if (isHost) {
        disconnectAllPeersAndCloseRoom(); //only does this if there are clients connected (connectedClientsCount != 0)
    } else {
        if (conn) {
            try {
                conn.close();
            } catch (error) {
                console.error("Error when closing connection in multiplayer js: " + error);
            }
        }
    }

    try { multiplayerTimer.stopTimer(); } catch { }; //has to be in try catch
    clearInterval(countdownInterval);
    clearTimeout(endMultiplayerRoundIfGuessMissing);
    multiplayer = false;
    setMultiplayerUI();
    showMultiplayerOverlay(false);
    showTimeReduceOverlay(0, true);
    roundIndex = 1;
    yourTeam = 1;
    multiplayerFirstRoundPlayed = false;
    roomLocked = true;
    multiplayerGuessesLocationsArray = [];
    teamMarkerArray = [];
    updateMinimapWithTeamMarkers(teamMarkerArray); // clean up multiplayer minimap markers
    connectedPeers = [];
    roundEnded = false;
    multiplayerHasAlreadyGuessed = false;
    multiplayerRestriction = "standard";
    resetChat();
    matchmakingActive = false;
    isHost = false;
    playingDuels = false;
    lateJoinedWaiting = false;
    highestMultiplayerSupporterLevel = 1

    //reset UI things
    document.getElementById("guessText").textContent = "Guess";
    document.getElementById("confirmButton").style.pointerEvents = "auto";

    if (mapCategory != "country") {
        document.getElementById("map").style.visibility = "visible";
        hideToggleMapButtonIfMobile(false);
    }

    document.getElementById("nextRound").style.opacity = "1";
    document.getElementById("nextRound").style.pointerEvents = "auto";
    document.getElementById("nextRoundText").textContent = "Next round";
    endMultiplayerRoundButton.style.display = "none";
    endMultiplayerRematchButton.style.display = "none";
    endMultiplayerRematchButton.style.opacity = "1";
    endMultiplayerRematchButton.style.pointerEvents = "auto";
    endMultiplayerRematchButton.textContent = "Play again"
    setRestriction("standard");

    if (wasMultiplayerEnabled) {
        checkGenerationTypeAndGenerate();
    }
}

//Streetview Overlay UI -------------------------------------------------------------------------------------------------------------------
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

        if (isHost) {
            endMultiplayerRoundButton.textContent = "End Round";

            if (!playingDuels) {
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

export function showMultiplayerOverlay(show, title, array, lateJoin) {
    let container = document.getElementById("multiplayerTable");

    if (show) {
        container.innerHTML = "";
        document.getElementById("multiplayerFade").style.opacity = "1";
        document.getElementById("multiplayerFade").style.pointerEvents = "auto";
        document.getElementById("multiplayerTitle").textContent = title;

        if (!multiplayerFirstRoundPlayed) {
            document.getElementById("mapModeText").textContent = "Multiplayer (" + multiplayerCategory.replace("community_", "") + ")";
        }

        let yourPeerId = peerId;

        let elementHTML = ""; // content to be added to each entry

        if (teamAmount > 1) {
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
            if (roundIndex >= roundAmount) {
                let teamColorName = teams[winningTeamIndex].colorName;
                document.getElementById("multiplayerTitle").textContent = `Team ${teamColorName} won!`;
                showEndscreenUI(true);
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
                                loadProfileFromId(id, false, true);
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
            if (roundIndex >= roundAmount && !lateJoin) {
                let winningPlayerData = array[0];
                let winningUsername = winningPlayerData[1];
                let winningId = winningPlayerData[5];
                document.getElementById("multiplayerTitle").textContent = winningUsername + " won!";

                // check if you won in duels or just played
                if (playingDuels && isAuthenticated) {
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
                            loadProfileFromId(id, false, true);
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
        document.getElementById("revealCompass").style.visibility = "hidden";
        showTimeReduceOverlay(0, true); // hide = true (in case it somehow overlaps if the result screen is being skipped quickly)

    } else {
        document.getElementById("multiplayerFade").style.opacity = "0";
        document.getElementById("multiplayerFade").style.pointerEvents = "none";
        if (multiplayer || mapCategory != "country") {
            document.getElementById("map").style.visibility = "visible";
            hideToggleMapButtonIfMobile(false);
            document.getElementById("revealCompass").style.visibility = "visible";
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
            if (multiplayer) {
                showMultiplayerOverlay(false); //hide the overlay --> round starts
                document.getElementById("guessText").textContent = "Guess";

                try { multiplayerTimer.stopTimer(); } catch { }; //stop multiplayer timer (redudancy)
                multiplayerTimer = startTimer(roundLength, multiplayerTimerExpired); //Start the timer
                
                document.getElementById("mapModeText").textContent = "Multiplayer (Round: " + roundIndex + "/" + roundAmount + ")";
                
                if (multiplayerRestriction != "standard" && multiplayerRestriction) {
                    document.getElementById("mapModeText").textContent += " (" + multiplayerRestriction + ")";
                }

                totalRequiredGuesses = connectedClientsCount + 1; //connections + 1 for the host
                setRestriction(multiplayerRestriction);

                playSound("match_countdown_start");
            }
        }
    }, 1000);
}

// Set restriction ----------------------------------------------------------------------------------

const guesserWindow = document.getElementById("GuesserWindow");

export function setRestriction(restriction) {
    nmpzBackground.style.pointerEvents = "none";
    nmpzBackground.style.backgroundColor = "transparent";
    guesserWindow.style.filter = "none";
    guesserWindow.style.animation = "none";

    switch (restriction) {
        case "nmpz":
            nmpzBackground.style.pointerEvents = "auto";
            break;
        case "grayscale":
            guesserWindow.style.filter = "grayscale(100%)";
            break;
        case "invert":
            guesserWindow.style.filter = "invert(100%)";
            break;
        case "hue":
            guesserWindow.style.filter = "hue-rotate(90deg)";
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
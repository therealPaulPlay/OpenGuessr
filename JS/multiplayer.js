import { clamp } from "./main.js";
import { errorPopup } from "./errorHandling.js";
import { toggleCategoryMenu, toggleSocialbar, hideToggleMapButtonIfMobile, socialBarExpanded } from "./mainUI.js";
import { startTimer } from "./timer";
import { uiSetUserXP, selectedPinIndex } from "./accountLogic.js";
import { checkGenerationTypeAndGenerate, transitionToStart } from "./categoryMenu.js";
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

socialMenuMultiplayerButton.addEventListener("click", toggleMultiplayerSelector);

document.getElementById("multiplayerSelectorClose").addEventListener("click", function () {
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

export function toggleMultiplayerSelector() {
    if (localStorage.getItem("id") != null) {
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
            infoTextContent = "Duels will be launched with a future update.";
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

let multiplayerWindowMain = document.getElementById("multiplayerWindowMain");
let multiplayerWindowJoin = document.getElementById("multiplayerWindowJoin");
let multiplayerWindowHost = document.getElementById("multiplayerWindowHost");
let toggleRestrictions = document.getElementById("toggleRestrictions");

let multiplayerSelectorBack = document.getElementById("multiplayerSelectorBack");
multiplayerSelectorBack.addEventListener("click", function () { setMultiplayerWindowSelection("main") });

function setMultiplayerWindowSelection(window) {
    multiplayerWindowMain.style.display = "none";
    multiplayerWindowJoin.style.display = "none";
    multiplayerWindowHost.style.display = "none";
    multiplayerSelectorBack.style.display = "none";
    hostCodeArea.style.display = "none";
    roomCreationSettings.style.display = "flex";
    multiplayerHost.textContent = "Create room";
    roundLengthText.textContent = "120";
    roundAmountText.textContent = "3";
    toggleRestrictions.textContent = "Standard";
    document.getElementById("roomCodeInput").value = "";
    multiplayerRestriction = "standard";
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
    } else if (window = "host") {
        multiplayerWindowHost.style.display = "block";
        multiplayerSelectorBack.style.display = "block";
    }
}

//Join page ----------------------------------------------------------------------------------------------

multiplayerJoin.addEventListener("click", joinRoom)

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
multiplayerHost.addEventListener("click", createRoom);

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
        document.getElementById("multiplayerLeave").style.display = "block";
        document.getElementById("mapModeText").textContent = "Multiplayer";
        mobileMenuButton.style.opacity = "0.5";
        mobileMenuButton.style.pointerEvents = "none";
    } else {
        categoryButton.style.opacity = "1";
        categoryButton.style.pointerEvents = "auto";
        floatingSocialButton.style.opacity = "1";
        floatingSocialButton.style.pointerEvents = "auto";
        document.getElementById("mapModeIndicator").style.display = "none";
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

function endMultiplayerRound() {
    if (!roundEnded) {
        if (isHost) {
            sendMessageToAll("roundOver", multiplayerGuessesLocationsArray);
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            document.getElementById("nextRoundText").innerHTML = "Wait before skipping... →";
            setTimeout(function () {
                document.getElementById("nextRoundText").innerHTML = "Skip →";
                document.getElementById("nextRound").style.opacity = "1";
                document.getElementById("nextRound").style.pointerEvents = "auto";
            }, 2000)
        } else {
            //if i'ts not the host, hide the next round button!
            document.getElementById("nextRound").style.opacity = "0.5";
            document.getElementById("nextRound").style.pointerEvents = "none";
            document.getElementById("nextRoundText").innerHTML = "Waiting for host... →";
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
if (localStorage.getItem("id") != null) {
    let unqiueUserID = "openguessr_" + localStorage.getItem("id") + generateRandomCode(2);
    peer = new Peer(unqiueUserID, {
        config: {'iceServers': [
          { url: 'stun:stun.l.google.com:19302' },
          { url: 'turn:freestun.net:3479', username: 'free', credential: 'free' }
        ]} 
      });
}

// Logic ------------------------------------------------------------------------------------------------
var conn; // the connection data
export let peerId; //host peer id
export let isHost = false;
export let connectedPeers = [];

function removeConnectedPeerById(peerId) {
    // Find the index of the entry with the given ID
    const index = connectedPeers.findIndex(entry => entry[1] === peerId);

    // If the entry exists in the array, remove it
    if (index != -1) {
        connectedPeers.splice(index, 1);
    }
}

//Host Logic ----------------------------------------------------------------------------------------------
export let multiplayerGuessesLocationsArray = [];
let multiplayerFirstRoundPlayed = false; // for host and peers! peers use this to see whether they should incrase the round index

if (peer) {
    peer.on('open', function (id) {
        peerId = id;

        // Set up event listener for incoming connections (HOST LOGIC)
        peer.on('connection', function (incomingConn) {
            if (!roomLocked) {
                connectedPeers.push([incomingConn.peer, incomingConn.metadata.username, incomingConn.metadata.level, incomingConn.metadata.score]);
                connectedClientsCount++;
                setJoinCounter(connectedClientsCount);

                // Event listener for when the connection is open
                incomingConn.on('open', function () {
                    const welcomeMessage = {
                        type: "roundInfo",
                        content: {
                            roundAmount: roundAmount,
                            roundLength: roundLength,
                            multiplayerRestriction: multiplayerRestriction

                        }
                    }
                    // Send messages
                    incomingConn.send(welcomeMessage);

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
                });

                //Peer disconnects
                incomingConn.on('close', function () {
                    connectedClientsCount--;
                    setJoinCounter(connectedClientsCount);
                    removeConnectedPeerById(incomingConn.peerId);

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
                incomingConn.close(); // Close the connection if room is locked (= the round has alr started)
            }
        });
    });
} else {
    console.warn("PeerJS not initialized -> user not logged in!");
}

let roomLocked = true;

function createRoom() {
    isHost = true;
    multiplayerFirstRoundPlayed = false;
    roomLocked = false;

    if (multiplayerHost.textContent != "Start") {
        showHostCodeArea("Roomcode: " + peerId.replace("openguessr_", ""));
        multiplayerHost.textContent = "Start";
        connectedPeers.push([peerId, localStorage.getItem("username"), uiSetUserXP(localStorage.getItem("experience")).level, 0]);
        showMultiplayerOverlay(true, "Waiting...", connectedPeers);
        setJoinCounter(0); //greys out the start button too
        roomLocked = false;

        //set round and length parameters
        roundAmount = roundAmountText.textContent;
        roundLength = roundLengthText.textContent;
    } else {
        if (connectedClientsCount != 0) {
            //start the round (from host)
            multiplayerHost.textContent = "Loading Location...";
            multiplayer = true;
            setMultiplayerUI();
            checkGenerationTypeAndGenerate();
            roomLocked = true;
        }
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
        if (peer) {
            for (let peerId in peer.connections) {
                peer.connections[peerId].forEach(function (connection) {
                    connection.close();
                });
            }
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

function joinRoom() {
    isHost = false;

    setJoinInfoText("Attempting join...");

    const options = {
        metadata: {
            username: localStorage.getItem("username"),
            level: uiSetUserXP(localStorage.getItem("experience")).level,
            score: 0 //inital score is set to 0
        }
    };

    conn = peer.connect("openguessr_" + removeWhiteSpace(document.getElementById("roomCodeInput").value), options);

    // Event listener for when the connection is opened
    conn.on('open', function () {
        setJoinInfoText("Joined!");
        multiplayer = true;
        setMultiplayerUI();
        toggleMultiplayerSelector();
    });

    // Receive messages
    conn.on('data', function (data) {
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

        if (data.type === "roundInfo") {
            roundAmount = data.content.roundAmount;
            roundLength = data.content.roundLength;
            multiplayerRestriction = data.content.multiplayerRestriction;
        }

        if (data.type === "roundOver") {
            multiplayerGuessesLocationsArray = data.content;
            endMultiplayerRound();
        }

        if (data.type === "closeResultScreen") {
            transitionToStart();
        }

    });

    // Event listener for Connection closed
    conn.on('close', function () {
        leaveMultiplayerRound();
        errorPopup("Disconnected from room", "", "User disconnected", false);
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
        console.error("PeerJS Error: " + err);

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

    });

    peer.on('close', function () {
        errorPopup("Multiplayer connection closed", "Your multiplayer connection was closed.", "Error: Connection Closed", false);
        if (multiplayer) {
            leaveMultiplayerRound();
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
        disconnectAllPeersAndCloseRoom();
    } else {
        if (conn) {
            conn.close();
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

    //reset UI things
    document.getElementById("confirmButton").textContent = "Guess";
    document.getElementById("confirmButton").style.pointerEvents = "auto";
    document.getElementById("confirmButton").style.visibility = "visible";
    document.getElementById("map").style.pointerEvents = "auto";
    document.getElementById("map").style.visibility = "visible";
    hideToggleMapButtonIfMobile(false);
    document.getElementById("nextRound").style.opacity = "1";
    document.getElementById("nextRound").style.pointerEvents = "auto";
    document.getElementById("nextRoundText").textContent = "Next round →";
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

        // Sort array by score in descending order
        array.sort((a, b) => b[3] - a[3]);

        if (roundIndex >= roundAmount) {
            let winningPlayerData = array[0];
            let winningUsername = winningPlayerData[1];

            document.getElementById("multiplayerTitle").textContent = winningUsername + " won!";

            if (isHost) {
                endMultiplayerRoundButton.style.display = "block";
            } else {
                endMultiplayerRoundButton.style.display = "none";
            }
        } else {
            endMultiplayerRoundButton.style.display = "none";
        }

        let body = '';

        // Generate HTML for each player
        array.forEach(playerInfo => {
            const [peerId, username, level, score] = playerInfo;
            body += `
                <div class="multiplayerOverlayEntry">
                    <div class="multiplayerEntryPlayerInfo">
                        <div class="multiplayerEntryPlayerName">${username} (Lvl. ${level})</div>
                        <div class="multiplayerEntryPlayerScore">Score: ${score.toLocaleString()}</div>
                    </div>
                </div>
            `;
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
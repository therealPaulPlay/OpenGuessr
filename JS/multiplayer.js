import { clamp } from "./main.js";
import { errorPopup } from "./errorHandling.js";
import { toggleCategoryMenu, toggleSocialbar } from "./mainUI.js";
import { globalTimer } from "./dailyChallenge.js";
import { uiSetUserXP } from "./accountLogic.js";

//Global UI --------------------------------------------------------------------------------------------
let socialMenuMultiplayerButton = document.getElementById("multiplayerButton");
let multiplayerSelectionScreen = document.getElementById("multiplayerSelectionWindow");

let multiplayerSelectJoin = document.getElementById("multiplayerSelectJoin");
let multiplayerSelectHost = document.getElementById("multiplayerSelectHost");
let multiplayerSelectDuels = document.getElementById("multiplayerSelectDuels");

let joinInfoText = document.getElementById("multiplayerJoinInfo");
let multiplayerJoin = document.getElementById("multiplayerJoin"); //button with join functionality
let multiplayerHost = document.getElementById("multiplayerHost"); //button that creates a room

//streetview overlay
let multiplayerFade = document.getElementById("multiplayerFade");

//host settings
let roundPlus = document.getElementById("roundPlus");
let roundMinus = document.getElementById("roundMinus");
let roundAmountText = document.getElementById("roundAmountText");

let lengthPlus = document.getElementById("lengthPlus");
let lengthMinus = document.getElementById("lengthMinus");
let roundLengthText = document.getElementById("roundLengthText");

socialMenuMultiplayerButton.addEventListener("click", toggleMultiplayerSelector);
document.getElementById("multiplayerSelectorClose").addEventListener("click", function () {
    toggleMultiplayerSelector();
    disconnectAllPeersAndCloseRoom(); //also close the room when closing the window manually
});

multiplayerSelectJoin.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("join"); })
multiplayerSelectHost.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("host"); })
multiplayerSelectDuels.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("duels"); })
multiplayerSelectJoin.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })
multiplayerSelectHost.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })
multiplayerSelectDuels.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })

let multiPlayerWindowOpen = false;

function toggleMultiplayerSelector() {
    if (localStorage.getItem("id") != null) {
        if (multiPlayerWindowOpen) {
            multiplayerSelectionScreen.style.display = "none";
            document.getElementById("blackBackground").style.visibility = "hidden";
        } else {
            multiplayerSelectionScreen.style.display = "block";
            document.getElementById("blackBackground").style.visibility = "visible";
            setMultiplayerWindowSelection("main");
            toggleSocialbar();
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
            infoTextContent = "Join a room with a roomcode.";
            break;
        case "host":
            infoTextContent = "Create a new room and share the roomcode.";
            break;
        case "duels":
            infoTextContent = "Duels will be launched with a future update.";
            break;
        default:
            infoTextContent = "Hover over the modes to learn more.";
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
    document.getElementById("roomCodeInput").value = "";
    setJoinCounter(0);
    setJoinInfoText("Enter the roomcode.");
    setJoinButtonState();

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
}

roundPlus.addEventListener("click", () => { hostRoundAmount(1); })
roundMinus.addEventListener("click", () => { hostRoundAmount(-1); })

function hostRoundAmount(changeAmount) {
    let currentRoundAmount = Number(roundAmountText.textContent);
    roundAmountText.textContent = clamp((currentRoundAmount + changeAmount), 1, 5);
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
    } else {
        categoryButton.style.opacity = "1";
        categoryButton.style.pointerEvents = "auto";
        floatingSocialButton.style.opacity = "1";
        floatingSocialButton.style.pointerEvents = "auto";
        document.getElementById("mapModeIndicator").style.display = "none";
    }
}

export function multiplayerStartTimer() {
    if (multiplayer) {
        globalTimer = startTimer(120, multiplayerTimerExpired);
    }
}

export function multiplayerTimerExpired() {
    confirmButtonClicks(); //if the timer expires and the player hasn't guessed yet, the guess function will be evoked.
}

// Multiplayer Setup (IF player has an id! ) ---------------------------------------------------------------------------------------
var peer;
let connectedClientsCount = 0;

function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}
if (localStorage.getItem("id") != null) {
    let unqiueUserID = "openguessr_" + localStorage.getItem("id") + generateRandomCode(2);
    peer = new Peer(unqiueUserID);
}

// Logic ------------------------------------------------------------------------------------------------
var conn; // the connection data
let peerId;
let isHost = false;
let connectedPeers = [];

function removeConnectedPeerById(peerId) {
    // Find the index of the entry with the given ID
    const index = connectedPeers.findIndex(entry => entry[1] === peerId);
    
    // If the entry exists in the array, remove it
    if (index != -1) {
        connectedPeers.splice(index, 1);
    }
}

//Host Logic ----------------------------------------------------------------------------------------------
if (peer) {
    peer.on('open', function (id) {
        peerId = id;

        // Set up event listener for incoming connections (HOST LOGIC)
        peer.on('connection', function (incomingConn) {
            console.log('Incoming connection from peer:', incomingConn.peer);
            console.log(incomingConn.metadata.username)

            connectedPeers.push([incomingConn.peer, incomingConn.metadata.username, incomingConn.metadata.level, incomingConn.metadata.score]);
            connectedClientsCount++;
            setJoinCounter(connectedClientsCount);

            // Event listener for when the connection is open
            incomingConn.on('open', function () {
                console.log('Connection to peer', incomingConn.peer, 'established.');

                // Receive messages
                incomingConn.on('data', function (data) {
                    console.log('Received from', incomingConn.peer, ':', data);

                });

                // Send messages
                incomingConn.send('Hello from host!');
                sendMessageToAll("showPlayersArray", connectedPeers);
            });

            //Peer disconnects
            incomingConn.on('close', function () {
                connectedClientsCount--;
                setJoinCounter(connectedClientsCount);
                removeConnectedPeerById(incomingConn.peerId);
            })
        });
    });
} else {
    console.error('PeerJS initialization failed.');
}

function createRoom(rounds, length) {
    isHost = true;

    if (multiplayerHost.textContent != "Start") {
        showHostCodeArea("Roomcode: " + peerId.replace("openguessr_", ""));
        multiplayerHost.textContent = "Start";
        setJoinCounter(0);
    } else {
        multiplayer = true;
        setMultiplayerUI();
        toggleMultiplayerSelector();
    }
}

//Function to send a message from host to all peers
function sendMessageToAll(type, message) {
    connectedPeers.forEach(function(peerInfo) {
        const peerId = peerInfo[0]; // Peer ID is the first element in each peerInfo array
        if (peerId) { // Ensure peerId is defined
            const connections = peer.connections[peerId];
            if (connections && connections.length > 0) {
                connections.forEach(function(conn) {
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

    conn = peer.connect("openguessr_" + document.getElementById("roomCodeInput").value, options);

    // Event listener for when the connection is opened
    conn.on('open', function () {
        setJoinInfoText("Joined!");
        multiplayer = true;
        setMultiplayerUI();
        toggleMultiplayerSelector();

        // Send initial message
        conn.send('Hello!');
    });

    // Receive messages
    conn.on('data', function (data) {
        console.log('Received', data);

        if (data.type === "showPlayersArray") {
            showMultiplayerOverlay(true, "Waiting...", data.content);
        }
    });

    // Event listener for Connection closed
    conn.on('close', function () {
        multiplayer = false;
        setMultiplayerUI();

        errorPopup("Disconnected from room", "You have left the round.", "User disconnected", false);
    });
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

            multiplayer = false;
            setMultiplayerUI();
        } else {
            setJoinInfoText("Failed to join.");
        }

    });

    peer.on('close', function () {
        errorPopup("Multiplayer connection closed", "Your multiplayer connection was closed.", "Error: Connection Closed", false);
        if (multiplayer) {
            multiplayer = false;
            setMultiplayerUI();
        }
    });
}

//Multiplayer leave ----------------------------------------------------------------------------------
let leaveButton = document.getElementById("multiplayerLeave");

leaveButton.addEventListener("click", leaveMultiplayerRound);

function leaveMultiplayerRound() {
    if (isHost) {
        disconnectAllPeersAndCloseRoom();
    } else {
        if (conn) {
            conn.close();
        }
    }

    multiplayer = false;
    setMultiplayerUI();
}

//Streetview Overlay UI -------------------------------------------------------------------------------------------------------------------
export function showMultiplayerOverlay(show, title, array) {
    if (show) {
        multiplayerFade.style.opacity = "1";
        multiplayerFade.style.pointerEvents = "auto";
        document.getElementById("multiplayerTitle").textContent = title;

        let body = '';

        // Sort array by score in descending order
        array.sort((a, b) => b[3] - a[3]);

        // Generate HTML for each player
        array.forEach(playerInfo => {
            const [peerId, username, level, score] = playerInfo;
            body += `
                <div class="multiplayerOverlayEntry">
                    <div class="multiplayerEntryPlayerInfo">
                        <div class="multiplayerEntryPlayerName">${username} (Lvl. ${level})</div>
                        <div class="multiplayerEntryPlayerScore">Score: ${score}</div>
                    </div>
                </div>
            `;
        });

        document.getElementById("multiplayerTable").innerHTML = body;
    } else {
        multiplayerFade.style.opacity = "0";
        multiplayerFade.style.pointerEvents = "none";
    }
}
import { clamp } from "./main.js";
import { errorPopup } from "./errorHandling.js";

//Global UI --------------------------------------------------------------------------------------------
let socialMenuMultiplayerButton = document.getElementById("multiplayerButton");
let multiplayerSelectionScreen = document.getElementById("multiplayerSelectionWindow");

let multiplayerSelectJoin = document.getElementById("multiplayerSelectJoin");
let multiplayerSelectHost = document.getElementById("multiplayerSelectHost");
let multiplayerSelectDuels = document.getElementById("multiplayerSelectDuels");

let joinInfoText = document.getElementById("multiplayerJoinInfo");
let multiplayerJoin = document.getElementById("multiplayerJoin"); //button with join functionality
let multiplayerHost = document.getElementById("multiplayerHost"); //button that creates a room

//host settings
let roundPlus = document.getElementById("roundPlus");
let roundMinus = document.getElementById("roundMinus");
let roundAmountText = document.getElementById("roundAmountText");

let lengthPlus = document.getElementById("lengthPlus");
let lengthMinus = document.getElementById("lengthMinus");
let roundLengthText = document.getElementById("roundLengthText");

socialMenuMultiplayerButton.addEventListener("click", toggleMultiplayerSelector);
document.getElementById("multiplayerSelectorClose").addEventListener("click", toggleMultiplayerSelector);

multiplayerSelectJoin.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("join"); })
multiplayerSelectHost.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("host"); })
multiplayerSelectDuels.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("duels"); })
multiplayerSelectJoin.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })
multiplayerSelectHost.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })
multiplayerSelectDuels.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext(); })

let multiPlayerWindowOpen = false;

function toggleMultiplayerSelector() {
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

    if (window == "main") {
        multiplayerWindowMain.style.display = "block";
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
    roundAmountText.textContent = clamp((currentRoundAmount + changeAmount), 1, 10);
}

lengthPlus.addEventListener("click", () => { hostLengthAmount(10); })
lengthMinus.addEventListener("click", () => { hostLengthAmount(-10); })

function hostLengthAmount(changeAmount) {
    let currentLengthAmount = Number(roundLengthText.textContent);
    roundLengthText.textContent = clamp((currentLengthAmount + changeAmount), 10, 300);
}

// Multiplayer Setup ---------------------------------------------------------------------------------------
var peer = new Peer();

// Logic ------------------------------------------------------------------------------------------------
var conn; // the connection data
let peerId;

if (peer) {
    peer.on('open', function (id) {
        peerId = id;
        console.log('My peer ID is: ' + id);

        // Set up event listener for incoming connections (HOST LOGIC)
        peer.on('connection', function (incomingConn) {
            console.log('Incoming connection from peer:', incomingConn.peer);

            // Event listener for when the connection is open
            incomingConn.on('open', function () {
                console.log('Connection to peer', incomingConn.peer, 'established.');

                // Receive messages
                incomingConn.on('data', function (data) {
                    console.log('Received from', incomingConn.peer, ':', data);
                });

                // Send messages
                incomingConn.send('Hello from host!');
            });
        });
    });
} else {
    console.error('PeerJS initialization failed.');
}

function createRoom(rounds, length) {
    if (multiplayerHost.textContent != "Start") {
        showHostCodeArea("Code: " + peerId);
        multiplayerHost.textContent = "Start";
    } else {
        // TODO: start the round here
    }
}

function joinRoom() {
    setJoinInfoText("Attempting join...");

    const options = {
        metadata: {
            username: localStorage.getItem("username")
        }
    };

    try {
        conn = peer.connect(document.getElementById("roomCodeInput").value, options);

        // Event listener for when the connection is open
        conn.on('open', function () {
            setJoinInfoText("Joined!");

            // Receive messages
            conn.on('data', function (data) {
                console.log('Received', data);
            });

            // Send messages
            conn.send('Hello!');
        });
    } catch (error) {
        setJoinInfoText("Invalid: " + error);
        console.error("Error occurred during room join: " + error);
    }
}

// Error states (disconnected, closed etc.) --------------------------------------------------------------------------------------------------
peer.on('disconnected', function () {
    peer.reconnect();
    console.log("Disconnected from signalling server. Attempting to reconnect...");
});

peer.on('error', function (err) {
    console.error("PeerJS Error: " + err);
    errorPopup("Multiplayer error", "Fatal multiplayer error. Please reload if you want to use multiplayer.", err.type, false);
});

peer.on('close', function () {
    errorPopup("Multiplayer connection closed", "Your multiplayer connection was closed.", "Error: Connection Closed", false);
});
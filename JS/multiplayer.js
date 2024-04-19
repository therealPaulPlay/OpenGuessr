//Multiplayer UI -----------------------------------------------------------------------------------------

//Global UI --------------------------------------------------------------------------------------------
let socialMenuMultiplayerButton = document.getElementById("multiplayerButton");
let multiplayerSelectionScreen = document.getElementById("multiplayerSelectionWindow");

let multiplayerSelectJoin = document.getElementById("multiplayerSelectJoin");
let multiplayerSelectHost = document.getElementById("multiplayerSelectHost");
let multiplayerSelectDuels = document.getElementById("multiplayerSelectDuels");

socialMenuMultiplayerButton.addEventListener("click", toggleMultiplayerSelector);
document.getElementById("multiplayerSelectorClose").addEventListener("click", toggleMultiplayerSelector);

multiplayerSelectJoin.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("join");})
multiplayerSelectHost.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("host");})
multiplayerSelectDuels.addEventListener("mouseover", () => { changeMultiplayerSelectorInfotext("duels");})
multiplayerSelectJoin.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext();})
multiplayerSelectHost.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext();})
multiplayerSelectDuels.addEventListener("mouseout", () => { changeMultiplayerSelectorInfotext();})

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

function changeMultiplayerSelectorInfotext (hoveredButton) {
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
multiplayerSelectJoin.addEventListener("click", () => { setMultiplayerWindowSelection("join");})
multiplayerSelectHost.addEventListener("click", () => { setMultiplayerWindowSelection("host");})

let multiplayerWindowMain = document.getElementById("multiplayerWindowMain");
let multiplayerWindowJoin = document.getElementById("multiplayerWindowJoin");
let multiplayerWindowHost = document.getElementById("multiplayerWindowHost");

let multiplayerSelectorBack = document.getElementById("multiplayerSelectorBack");
multiplayerSelectorBack.addEventListener("click", function() {setMultiplayerWindowSelection("main")});

function setMultiplayerWindowSelection(window) {
    multiplayerWindowMain.style.display = "none";
    multiplayerWindowJoin.style.display = "none";
    multiplayerWindowHost.style.display = "none";
    multiplayerSelectorBack.style.display = "none"; 

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
let joinInfoText = document.getElementById("multiplayerJoinInfo");
let multiplayerJoin = document.getElementById("multiplayerJoin"); //button with join functionality

function setJoinInfoText(text) {
    joinInfoText.innerText = text; //this function is used to display things like "Invalid Roomcode" etc.
}

//Host page ------------------------------------------------------------------------------------------------
let multiplayerHost = document.getElementById("multiplayerHost"); //button that creates a room
//Multiplayer UI -----------------------------------------------------------------------------------------
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
    }

    multiPlayerWindowOpen = !multiPlayerWindowOpen;
}

function changeMultiplayerSelectorInfotext (hoveredButton) {
    const infoText = document.getElementById("multiplayerSelectorInfotext");
    let infoTextContent = "Default infotext.";
    
    switch (hoveredButton) {
        case "join":
            infoTextContent = "Join a room with a roomcode. To create a party, select host.";
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
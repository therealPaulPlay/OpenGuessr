import { closePopup } from "./errorHandling.js";
import { generateNewLocation, resMap, reloadIframe } from "./main.js";

//How to play Window ---------------------------------------------------------------------------------------
let helpButton = document.getElementById("helpButton");
helpButton.addEventListener("click", toggleHelpWindow)

let helpWindow = document.getElementById("helpWindow");

let helpClose = document.getElementById("helpClose");
helpClose.addEventListener("click", toggleHelpWindow);

function toggleHelpWindow() {
    if (helpWindow.style.display == "block") {
        helpWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    } else {
        helpWindow.style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
    }
}

//Social Menu and Leaderboard link --------------------------------------------------------------------------
let socialBarExpanded = false;

document.getElementById("floatingSocialButton").addEventListener("click", toggleSidebar);

function toggleSidebar() {
    if (!socialBarExpanded) {
        document.getElementById("socialBar").style.maxHeight = "1000px";
        socialBarExpanded = true;
        document.getElementById("floatingSocialButton").innerHTML = "Social Menu ▲";
    } else {
        document.getElementById("socialBar").style.maxHeight = "0";
        socialBarExpanded = false;
        document.getElementById("floatingSocialButton").innerHTML = "Social Menu ▼";
    }
}

document.getElementById("leaderboardButton").addEventListener("click", goToLeaderboard);

function goToLeaderboard() {
    window.location.href = "/leaderboard.html";
}

//Toggle Map on mobile devices ---------------------------------------------------------------------------------------
let toggleMapButton = document.getElementById("floatingMapButton");

let mapExpanded = true;

toggleMapButton.addEventListener("click", toggleMap);

function toggleMap() {
    if (!mapExpanded) {
        document.getElementById("map").style.maxHeight = "100%";
        mapExpanded = true;
    } else {
        document.getElementById("map").style.maxHeight = "0%";
        mapExpanded = false;
    }
}

//Popup Window (Account info and How to play window) ------------------------------------------------------------
let closeButton = document.getElementById("popupClose");
closeButton.addEventListener("click", closePopup);

//Various links in the navbar ----------------------------------------------------------------------------------------
let resetBTN = document.getElementById("resetButtonSVG");
resetBTN.addEventListener("click", function () { reloadIframe() });

let logoBTN = document.getElementById("logo");
logoBTN.addEventListener("click", function () { generateNewLocation(true) });

let nextRound = document.getElementById("nextRound");
nextRound.addEventListener("click", transitionToStart);

let socialRedditButton = document.getElementById("socialsButton");
socialRedditButton.addEventListener("click", function() {window.open("https://www.reddit.com/r/OpenGuessr/", '_blank').focus()});

let privacyButton = document.getElementById("privacyButton");
privacyButton.addEventListener("click", function() {window.location.href = "/legal.html"});

//Smooth fade between iframe loading  ---------------------------------------------------------------------------------------------
export function transitionToStart() {

    document.getElementById("BeforeOverlay").style.opacity = "0";
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("BeforeOverlay").style.opacity = "100";
    resMap.stop(); //stop the flying animation
    setTimeout(function() {resMap.stop()}, 200)
    generateNewLocation(true); 

    setTimeout(disableResultScreen, 200);
}

//Result screen animations ---------------------------------------------------------------------------------------------------------
export let resultScreenEnabled = false;

export function enableResultScreen(resultString, extraMessage) {
    document.getElementById("EndOverlay").style.opacity = "100%";
    document.getElementById("EndOverlay").style.visibility = "visible";

    document.getElementById("logo").style.pointerEvents = "none";

    document.getElementById("distanceText").innerText = "Your guess was "+resultString+" away from the target.";
    document.getElementById("motivationText").innerText = extraMessage;

    resultScreenEnabled = true;
}

function disableResultScreen() {
    document.getElementById("EndOverlay").style.opacity = "0%";
    setTimeout(function() {document.getElementById("EndOverlay").style.visibility = "hidden"}, 200)
    document.getElementById("logo").style.pointerEvents = "auto";
    
    resultScreenEnabled = false;
}

//Extended Navbar dropdown (Category Selection Area) ------------------------------------------------------------------------------
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");
let floatingCategoryArea = document.getElementById("floatingCategoryArea");

let categoriesExpanded = false;

categoryMenuButton.addEventListener("click", function() {
    if (!categoriesExpanded) {
        floatingCategoryArea.style.top = "395px";
        extendedNavbar.classList.add("expanded");
        categoryMenuButton.innerText = "Map Categories ▲";
        categoriesExpanded = true;
    } else {
        setTimeout(function() {
            floatingCategoryArea.style.top = "85px";
            extendedNavbar.scrollTop = 0;
        }, 75); 
        extendedNavbar.classList.remove("expanded");
        categoryMenuButton.innerText = "Map Categories ▼";
        categoriesExpanded = false;
    }
});


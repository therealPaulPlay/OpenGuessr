import { closePopup } from "./errorHandling.js";
import { reloadIframe } from "./main.js";
import { setUserXP, uiSetUserXP, isAuthenticated } from "./accountLogic.js";
import { toggleMultiplayerSelector } from "./multiplayer.js";

//How to play - Window ---------------------------------------------------------------------------------------
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
export let socialBarExpanded = false;

document.getElementById("floatingSocialButton").addEventListener("click", toggleSocialbar);

export function toggleSocialbar() {
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
document.getElementById("dailyLeaderboardButton").addEventListener("click", goToDailyLeaderboard);

function goToLeaderboard() {
    window.location.href = "/leaderboard.html";
}

function goToDailyLeaderboard() {
    window.location.href = "/dailyLeaderboard.html";
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

export function shrinkMapIfMobile() {
    if (window.innerHeight > window.innerWidth && mapExpanded) {
        toggleMap();
    }
}

export function hideToggleMapButtonIfMobile(hide) {
    if (window.innerHeight > window.innerWidth) {
        if (hide) {
            toggleMapButton.style.visibility = "hidden";
        } else {
            toggleMapButton.style.visibility = "visible";
        }
    }
}

//Universal Popup Window (Account info and How to play window) ------------------------------------------------------------
let closeButton = document.getElementById("popupClose");
closeButton.addEventListener("click", closePopup);

//Various buttons and links ------------------------------------------------------------------------------------------------
let resetBTN = document.getElementById("resetButtonSVG");
resetBTN.addEventListener("click", function () { reloadIframe() });

let socialRedditButton = document.getElementById("redditButton");
socialRedditButton.addEventListener("click", function() {window.open("https://www.reddit.com/r/OpenGuessr/", '_blank').focus()});

let socialDiscordButton = document.getElementById("discordButton");
socialDiscordButton.addEventListener("click", function() {window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus()});

let privacyButton = document.getElementById("privacyButton");
privacyButton.addEventListener("click", function() {window.location.href = "/legal.html"});

//Result screen animations ---------------------------------------------------------------------------------------------------------
export let resultScreenEnabled = false;

export function enableResultScreen(resultString, extraMessage) {
    document.getElementById("EndOverlay").style.opacity = "100%";
    document.getElementById("EndOverlay").style.visibility = "visible";

    document.getElementById("distanceText").innerText = "Your guess was "+resultString+" away from the target.";
    document.getElementById("motivationText").innerText = extraMessage;

    resultScreenEnabled = true;
}

export function disableResultScreen() {
    document.getElementById("EndOverlay").style.opacity = "0%";
    setTimeout(function() {document.getElementById("EndOverlay").style.visibility = "hidden"}, 200)
    
    resultScreenEnabled = false;
}

//Extended Navbar dropdown (Category Selection Area) ------------------------------------------------------------------------------
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");
let floatingCategoryArea = document.getElementById("floatingCategoryArea");

let categoriesExpanded = false;

categoryMenuButton.addEventListener("click", function() {
    toggleCategoryMenu(false)});

export function toggleCategoryMenu(alwaysClose) {
    if (alwaysClose) {
        categoriesExpanded = true;
    }

    if (!categoriesExpanded) {
        floatingCategoryArea.style.top = "360px";
        document.getElementById("extendedNavbarContent").scrollTop = "0";
        document.getElementById("extendedNavbarGradient").style.display = "block";
        extendedNavbar.classList.add("expanded");
        categoryMenuButton.innerText = "Map Categories ▲";
        categoriesExpanded = true;
    } else {
        setTimeout(function() {
            floatingCategoryArea.style.top = "85px";
            document.getElementById("extendedNavbarGradient").style.display = "none";
        }, 75); 
        extendedNavbar.classList.remove("expanded");
        categoryMenuButton.innerText = "Map Categories ▼";
        categoriesExpanded = false;
    }
}

//Social / Discord Join Popup -----------------------------------------------------------------------------------------------------

let socialWindow = document.getElementById("socialWindow");

function showSocialPopup() {
    socialWindow.style.display = "block";
    document.getElementById("blackBackground").style.visibility = "visible";
}

function closeSocialPopup() {
    socialWindow.style.display = "none";
    document.getElementById("blackBackground").style.visibility = "hidden";
    localStorage.setItem("discordPopup", "true");
}

export function socialPopupProbability() {
    if (isAuthenticated && localStorage.getItem("discordPopup") == null) {
        const randomNumber = Math.floor(Math.random() * 3);

        if (randomNumber === 0) {
            showSocialPopup();
        }
    }
}

document.getElementById("socialPopupClose").addEventListener("click", closeSocialPopup);

document.getElementById("socialPopupJoin").addEventListener("click", function() {
    window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus();
    setTimeout(async function() {
        closeSocialPopup();
        await setUserXP(Number(localStorage.getItem("experience")) + 7500);
        uiSetUserXP(localStorage.getItem("experience"));
    }, 200)
});

//reveal compass -------------------------------------------------------------------------------------
let revealCompass = document.getElementById("revealCompass");
revealCompass.addEventListener("click", toggleMapOffset);

let mapOffset = false;

function toggleMapOffset() {
    if (mapOffset) {
        document.getElementById("map").style.marginRight = "0.75%";
        document.getElementById("mapModeIndicator").style.marginRight = "0.75%";
        revealCompass.style.marginRight = "0.75%";
        revealCompass.innerHTML = "reveal compass";
        mapOffset = false;
    } else {
        document.getElementById("map").style.marginRight = "65px";
        document.getElementById("mapModeIndicator").style.marginRight = "65px";
        revealCompass.style.marginRight = "65px";
        revealCompass.innerHTML = "hide compass";
        mapOffset = true;
    }
}

//switch UI toggles back to standard on window resize ----------------------------------------------

window.addEventListener("resize", (event) => {
    mapOffset = true; 
    toggleMapOffset(); 
    mapExpanded = false;
    toggleMap();
});

//Username UI endless scroll --------------------------------------------------------------------------------------------------
// Get the elements
const accountName = document.getElementById('accountName');

// Check if the text length exceeds the threshold
export function checkTextLength() {
  const textLength = accountName.textContent.length;
  
  if (textLength > 20) {
    accountName.classList.add('scroll');
  } else {
    accountName.classList.remove('scroll');
  }
}

// Check for text length initially and when the text changes
window.addEventListener('DOMContentLoaded', checkTextLength); // Check on page load
window.addEventListener('input', checkTextLength); // Check when text changes


//Mobile UI Menu -----------------------------------------------------------------------------------------
let mobileWindow = document.getElementById("mobileWindow");
let mobileMenuButton = document.getElementById("mobileMenu");

mobileMenuButton.addEventListener("click", toggleMobileMenu);

let mobileWindowOpen = false;

export function toggleMobileMenu() {
    mobileWindowOpen = !mobileWindowOpen;

    if (mobileWindowOpen) {
        mobileWindow.style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
    } else {
        mobileWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    }
}

document.getElementById("mobilePopupClose").addEventListener("click", toggleMobileMenu);

document.getElementById("mobileLeaderboardButton").addEventListener("click", goToLeaderboard);
document.getElementById("mobileDailyLeaderboardButton").addEventListener("click", goToDailyLeaderboard);
document.getElementById("mobileMultiplayerButton").addEventListener("click", function() {
    toggleMobileMenu();
    toggleMultiplayerSelector();
});

document.getElementById("mobileCategoryButton").addEventListener("click", function() {
    toggleMobileMenu();
    toggleCategoryMenu();

    if (mapExpanded) {
        toggleMap();
    }
})


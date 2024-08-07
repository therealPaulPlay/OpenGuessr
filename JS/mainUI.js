import { closePopup } from "./errorHandling.js";
import { reloadIframe } from "./main.js";
import { setUserXP, uiSetUserXP, isAuthenticated, checkAuthenticationStatus } from "./accountLogic.js";
import { toggleMultiplayerSelector } from "./multiplayer.js";
import { checkIfGuessWasCorrect, countryGuesserMode, selectedCountryGuesserCountry } from "./countryGuesser.js";
import { playSound } from "./soundManager.js";
import { changeCategory, loadCommunityCategories, mapCategory, loadMapCategory, attachCategoryEventListeners } from "./categoryMenu.js";
import { loadCompetition } from "./competitionLogic.js";
import { loadProfileFromId } from "./profileView.js";

//How to play - Window ---------------------------------------------------------------------------------------
let helpButton = document.getElementById("helpButton");
helpButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleHelpWindow();
})

let helpWindow = document.getElementById("helpWindow");

let helpClose = document.getElementById("helpClose");
helpClose.addEventListener("click", toggleHelpWindow);

function toggleHelpWindow() {
    playSound("basic_button");

    if (helpWindow.style.display == "block") {
        helpWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    } else {
        helpWindow.style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
    }
}

// Social Links --------------------------------------------------------------------------

document.getElementById("leaderboardButton").addEventListener("click", () => {
    playSound("basic_button");
    goToLeaderboard();
});

document.getElementById("competitionsButton").addEventListener("click", () => {
    playSound("basic_button");
    showPageBrowser("/competitions.html");
});

function goToLeaderboard() {
    showPageBrowser("/leaderboard.html");
}

//Toggle Map on mobile devices ---------------------------------------------------------------------------------------
let toggleMapButton = document.getElementById("floatingMapButton");

let mapExpanded = true;

toggleMapButton.addEventListener("click", () => {
    toggleMap();
    playSound("floating_button");
    toggleMapButton.style.filter = "brightness(0.7)";
    setTimeout(() => {
        toggleMapButton.style.filter = "brightness(1)";
    }, 250);
});

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
closeButton.addEventListener("click", () => {
    closePopup();
    playSound("basic_button");
});

//Various buttons and links ------------------------------------------------------------------------------------------------
let resetBTN = document.getElementById("resetButtonSVG");
resetBTN.addEventListener("click", function () { playSound("reload"); reloadIframe(); });

let socialRedditButton = document.getElementById("redditButton");
socialRedditButton.addEventListener("click", function () { playSound("basic_button"); window.open("https://www.reddit.com/r/OpenGuessr/", '_blank').focus() });

let socialDiscordButton = document.getElementById("discordButton");
socialDiscordButton.addEventListener("click", function () { playSound("basic_button"); window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus() });

let privacyButton = document.getElementById("privacyButton");
privacyButton.addEventListener("click", function () { playSound("basic_button"); toggleSettingsWindow(); showPageBrowser("/legal.html"); });

document.getElementById("discoverMaps").addEventListener("click", () => { playSound("basic_button"); showPageBrowser("/maps.html"); });

//Result screen animations ---------------------------------------------------------------------------------------------------------
export let resultScreenEnabled = false;

export function enableResultScreen(resultString, extraMessage) {
    document.getElementById("EndOverlay").style.opacity = "100%";
    document.getElementById("EndOverlay").style.visibility = "visible";

    document.getElementById("distanceText").innerText = "Your guess was " + resultString + " away from the target.";
    document.getElementById("motivationText").innerText = extraMessage;

    if (countryGuesserMode) {
        if (checkIfGuessWasCorrect()) {
            document.getElementById("distanceText").innerText = "That is correct! The location was in " + selectedCountryGuesserCountry + ".";
        } else {
            document.getElementById("distanceText").innerText = "Wrong! The correct country would have been " + selectedCountryGuesserCountry + ".";
        }
    }

    resultScreenEnabled = true;
}

export function disableResultScreen() {
    document.getElementById("EndOverlay").style.opacity = "0%";
    setTimeout(() => {
        document.getElementById("EndOverlay").style.visibility = "hidden";
    }, 250);

    resultScreenEnabled = false;
}

//Extended Navbar dropdown (Category Selection Area) ------------------------------------------------------------------------------
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");
let topButtonArea = document.getElementById("topButtonArea");

let categoriesExpanded = false;

categoryMenuButton.addEventListener("click", function () {
    toggleCategoryMenu(false);
    playSound("floating_button");
});

document.getElementById("mobileCategoriesClose").addEventListener("click", () => {
    toggleCategoryMenu(true);
    playSound("basic_button");
});

export function toggleCategoryMenu(alwaysClose) {
    try {
        if (alwaysClose) {
            categoriesExpanded = true;
        }

        let moveTimeouts;

        if (!categoriesExpanded) {
            clearInterval(moveTimeouts);
            document.getElementById("extendedNavbarContent").scrollTop = "0";

            document.querySelectorAll('.animateSocialsText').forEach(function (text) {
                text.style.maxWidth = "200px";
            });

            if (window.innerHeight > window.innerWidth) {
                extendedNavbar.classList.add("expandedMobile");
                document.getElementById("extendedNavbarGradient").style.display = "block";
                document.getElementById("extendedNavbarGradient").style.borderRadius = "0";
                document.getElementById("mobileExtendedNavbarControls").style.display = "flex";
                document.getElementById("mobileExtendedNavbarControls").style.opacity = "1";
            } else {
                document.getElementById("extendedNavbarGradient").style.borderRadius = "0 0 10px 10px";
            }

            moveTimeouts = setTimeout(() => {
                topButtonArea.style.top = "355px";
                document.getElementById("extendedNavbarGradient").style.display = "block";
                extendedNavbar.classList.add("expanded");
                document.getElementById("mapsArrow").classList.add("arrowIconRotated");
                categoriesExpanded = true;
            }, 100);

        } else {
            clearInterval(moveTimeouts);
            setTimeout(function () {
                topButtonArea.style.top = "15px";
                document.getElementById("extendedNavbarGradient").style.display = "none";
                document.getElementById("mobileExtendedNavbarControls").style.display = "none";
            }, 75);
            setTimeout(() => {
                document.querySelectorAll('.animateSocialsText').forEach(function (text) {
                    text.style.maxWidth = "0px";
                });
            }, 150);
            document.getElementById("mobileExtendedNavbarControls").style.opacity = "0";
            extendedNavbar.classList.remove("expanded");
            extendedNavbar.classList.remove("expandedMobile");
            document.getElementById("mapsArrow").classList.remove("arrowIconRotated");
            categoriesExpanded = false;
        }
    } catch {
        console.warn("Couldn't toggle category menu");
    }

}

// Social top bar area --------------------------------------------------------------------------------------------------------------

export function setGamemodeSelector(enabled) {
    if (enabled) {
        document.getElementById("gamemodeMenu").classList.remove("gamemodeMenuDisabled");
    } else {
        document.getElementById("gamemodeMenu").classList.add("gamemodeMenuDisabled");
    }
}

// Cool center hover for top bar -------------------------------------------------------

let gamemodeTransitionTimeout;

document.getElementById("gamemodeMenu").addEventListener("mouseover", () => {
    clearTimeout(gamemodeTransitionTimeout);
    document.querySelectorAll(".topBarSides").forEach((e) => {
        e.classList.add("sideMenuDisabled");
    })
});

document.getElementById("gamemodeMenu").addEventListener("mouseout", () => {
    clearTimeout(gamemodeTransitionTimeout);
    gamemodeTransitionTimeout = setTimeout(() => {
        document.querySelectorAll(".topBarSides").forEach((e) => {
            e.classList.remove("sideMenuDisabled");
        })
    }, 200);
});

//Social / Discord Join Popup -----------------------------------------------------------------------------------------------------

let socialWindow = document.getElementById("socialWindow");

function showSocialPopup() {
    document.getElementById("discordWidget").setAttribute("src", "https://discord.com/widget?id=1221841177863651499&theme=dark");
    socialWindow.style.display = "block";
    document.getElementById("blackBackground").style.visibility = "visible";
}

function closeSocialPopup() {
    socialWindow.style.display = "none";
    document.getElementById("blackBackground").style.visibility = "hidden";
    localStorage.setItem("discordPopup", "true");
}

export function socialPopupProbability() {
    if (isAuthenticated && localStorage.getItem("discordPopup") == null && document.getElementById("pageBrowserWindow").style.display != "block") {
        const randomNumber = Math.floor(Math.random() * 3);

        if (randomNumber === 0) {
            showSocialPopup();
        }
    }
}

document.getElementById("socialPopupClose").addEventListener("click", () => {
    closeSocialPopup();
    playSound("basic_button");
});

document.getElementById("socialPopupJoin").addEventListener("click", function () {
    playSound("basic_button");
    window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus();
    setTimeout(async function () {
        closeSocialPopup();
        await setUserXP(Number(localStorage.getItem("experience")) + 7500, 7500, false);
        uiSetUserXP(localStorage.getItem("experience"));
    }, 200)
});

//reveal compass -------------------------------------------------------------------------------------
let revealCompass = document.getElementById("revealCompass");
revealCompass.addEventListener("click", () => {
    toggleMapOffset();
    playSound("basic_button");
});

let mapOffset = false;

function toggleMapOffset() {
    if (mapOffset) {
        document.getElementById("mapHolder").style.marginRight = "0px";
        revealCompass.innerHTML = "reveal compass";
        mapOffset = false;
    } else {
        document.getElementById("mapHolder").style.marginRight = "65px";
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
    toggleCategoryMenu(true);
});

//Username UI endless scroll --------------------------------------------------------------------------------------------------

// Check if the text length exceeds the threshold
export function checkTextLength() {
    const accountName = document.getElementById("accountName");

    const textLength = accountName.textContent.length;

    if (textLength > 10) {
        accountName.classList.add("namescroll");
    } else {
        accountName.classList.remove("namescroll");
    }
}

//Mobile UI Menu -----------------------------------------------------------------------------------------
let mobileWindow = document.getElementById("mobileWindow");
let mobileMenuButton = document.getElementById("mobileMenu");

mobileMenuButton.addEventListener("click", () => {
    toggleMobileMenu();
    playSound("basic_button");
});

let mobileWindowOpen = false;

export function toggleMobileMenu() {
    mobileWindowOpen = !mobileWindowOpen;

    if (mobileWindowOpen) {
        mobileWindow.style.display = "block";

        setTimeout(() => {
            mobileWindow.style.opacity = "1";
            mobileWindow.style.scale = "1";
        }, 50);

        document.getElementById("blackBackground").style.visibility = "visible";
    } else {
        mobileWindow.style.opacity = "0";
        mobileWindow.style.scale = "0.95";
        mobileWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    }
}

document.getElementById("mobilePopupClose").addEventListener("click", () => {
    toggleMobileMenu();
    playSound("basic_button");
});

document.getElementById("mobileLeaderboardButton").addEventListener("click", () => {
    playSound("basic_button");
    toggleMobileMenu();
    goToLeaderboard();
});

document.getElementById("mobileMultiplayerButton").addEventListener("click", function () {
    toggleMobileMenu();
    toggleMultiplayerSelector();
    playSound("basic_button");
});

document.getElementById("mobileCategoryButton").addEventListener("click", function () {
    toggleMobileMenu();
    toggleCategoryMenu();
    playSound("floating_button");
});

document.getElementById("mobileCompetitionsButton").addEventListener("click", function () {
    toggleMobileMenu();
    playSound("basic_button");
    showPageBrowser("/competitions.html");
});

//Prevent automatic "last button press" with space bar or enter key ------------------------------------------------------------------
document.addEventListener('keydown', function (event) {
    var tag = event.target.tagName.toLowerCase();
    if (event.key === 'Enter' || event.key === ' ') {
        if (tag === 'button') {
            event.preventDefault();
        }
    }
});

//Settings - Window ---------------------------------------------------------------------------------------
let settingsButton = document.getElementById("settingsButton");
settingsButton.addEventListener("click", () => {
    playSound("basic_button");
    toggleSettingsWindow();
})

let settingsWindow = document.getElementById("settingsWindow");

let settingsClose = document.getElementById("settingsClose");
settingsClose.addEventListener("click", () => {
    playSound("basic_button");
    toggleSettingsWindow();
});

function toggleSettingsWindow() {
    if (settingsWindow.style.display == "block") {
        settingsWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    } else {
        settingsWindow.style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
    }
}

//Unit switch between kilometers and miles

let kilometersButton = document.getElementById("unitSwitchKilometers");
let milesButton = document.getElementById("unitSwitchMiles");
export let distanceUnit = "kilometers";

const tempStorageDistanceUnit = localStorage.getItem("distanceUnit");

if (tempStorageDistanceUnit != null) {
    setDistanceUnitButtons(tempStorageDistanceUnit);
} else {
    setDistanceUnitButtons("kilometers");
}

function setDistanceUnitButtons(unit) {
    if (unit == "miles") {
        kilometersButton.style.opacity = "0.5";
        milesButton.style.opacity = "1";
        distanceUnit = "miles";
    } else {
        milesButton.style.opacity = "0.5";
        kilometersButton.style.opacity = "1";
        distanceUnit = "kilometers";
    }
}

kilometersButton.addEventListener("click", () => {
    setDistanceUnitButtons("kilometers");
    playSound("basic_button");
    localStorage.setItem("distanceUnit", "kilometers");
});

milesButton.addEventListener("click", () => {
    setDistanceUnitButtons("miles");
    playSound("basic_button");
    localStorage.setItem("distanceUnit", "miles");
});

let fullscreenButton = document.getElementById("fullscreenButton");

fullscreenButton.addEventListener("click", () => {
    try {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    } catch (error) {
        console.error("Error entering / exiting fullscreen: " + error);
    }
});

document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        document.getElementById("fullscreenText").textContent = "Fullscreen";
    } else {
        document.getElementById("fullscreenText").textContent = "Exit Fullscreen";
    }
});

//Check if element is clickable ----------------------------------------------------------

export function isElementClickable(element) {
    if (!element || element.offsetParent === null || getComputedStyle(element).visibility === 'hidden') {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    // Check if the element or any of its closer parents have pointer-events set to 'auto'
    let el = element;
    let closestPointerEventsNoneParent = null;
    while (el) {
        if (getComputedStyle(el).pointerEvents === 'none') {
            closestPointerEventsNoneParent = el;
        } else if (getComputedStyle(el).pointerEvents === 'auto') {
            closestPointerEventsNoneParent = null;
        }
        el = el.parentElement;
    }

    // If there's a closer parent with pointer-events: none, the element is not clickable
    if (closestPointerEventsNoneParent) {
        return false;
    }

    return topElement === element || element.contains(topElement);
}

// Troubleshootig Window ------------------------------------------------------------------------------------------------------

let troubleshootButton = document.getElementById("troubleshootGuideButton");
let troubleshootClose = document.getElementById("troubleshootClose");
let troubleshootWindow = document.getElementById("troubleshootWindow");

troubleshootButton.addEventListener("click", toggleTroubleshootWindow);
troubleshootClose.addEventListener("click", toggleTroubleshootWindow);

function toggleTroubleshootWindow() {
    playSound("basic_button");
    toggleMultiplayerSelector();
    if (troubleshootWindow.style.display != "block") {
        document.getElementById("blackBackground").style.visibility = "visible";
    }
    troubleshootWindow.style.display = troubleshootWindow.style.display != "block" ? "block" : "none";
}

// Show advertisement text after some time (if no ads are being served, it is visible) ---------------------------------------------------------------------------------

// display text to encourage disabling ad block after 12s
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.getElementById("adsText").style.opacity = "0.25";
    }, 12000);
});

// Daily competition link to competitions ---------------------------------------------------------------------------------

document.getElementById("dailyCompetition").addEventListener("click", () => {
    playSound("button_juicy");
    showPageBrowser("/competitions.html");
});

// Universal confirm popup -------------------------------------------------------------------------------------------------

let confirmPopup = document.getElementById("confirmPopup");

export function showConfirmPopup(title, text, executeFunction, accountDelete) {
    confirmPopup.style.display = "flex";
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmDescription").textContent = text;
    document.getElementById("accountDeletePassword").style.display = "none";

    if (accountDelete) {
        document.getElementById("accountDeletePassword").style.display = "block";
        document.getElementById("accountDeletePassword").value = "";
    }

    // Remove all event listeners by cloning the element
    const button = document.getElementById("confirmProceed");
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", () => {
        playSound("basic_button");
        
        try {
            executeFunction();
            confirmPopup.style.display = "none";
        } catch (error) {
            console.error("Couldn't execute callback function in confirm popup in mainUI.js: " + error);
        }
    });
}

document.getElementById("confirmCancel").addEventListener("click", () => {
    playSound("basic_button");
    confirmPopup.style.display = "none";
});

// In-App page browser -----------------------------------------------------------------------------------

let pageBrowserWindow = document.getElementById("pageBrowserWindow");

export function showPageBrowser(page, login) {
    document.getElementById("blackBackground").style.visibility = "visible";
    document.getElementById("pageBrowserIframe").src = window.location.origin + page;
    socialWindow.style.display = "none"; // hide social window in case it is currently active to prevent overlap

    if (login) {
        pageBrowserWindow.classList.add("loginIframeWindow");
    } else {
        pageBrowserWindow.classList.remove("loginIframeWindow");
    }

    pageBrowserWindow.style.display = "block";

    document.getElementById("pageBrowserIframe").onload = function () {
        this.style.opacity = "1";
    };
}

function disablePageBrowser() {
    document.getElementById("blackBackground").style.visibility = "hidden";
    pageBrowserWindow.style.display = "none";
    document.getElementById("pageBrowserIframe").style.opacity = "0";
    document.getElementById("pageBrowserIframe").src = ""; // unload iframe to save performance
}

window.onmessage = function (e) {
    try {
        const data = String(e.data); // Ensure data is a string

        const profileMatch = data.match(/^profile(\d+)$/); // extract profile id if text includes profile

        switch (true) {
            case data === "close":
                disablePageBrowser();
                break;
            case data === "reloadCommunityMaps":
                loadCommunityCategories();
                attachCategoryEventListeners();
                break;
            case data === "loadCategory":
                loadMapCategory();
                changeCategory(mapCategory, false);
                break;
            case data === "reloadCategory":
                loadMapCategory();
                changeCategory(mapCategory, true);
                break;
            case data === "loadAccountStatus":
                checkAuthenticationStatus();
                break;
            case data === "loadCompetition":
                loadCompetition(true);
                break;
            case profileMatch !== null:
                loadProfileFromId(Number(profileMatch[1]), false, true);
                break;
        }
    } catch (error) {
        console.error("Error processing window message: " + error);
    }
};

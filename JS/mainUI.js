import { closePopup, errorPopup } from "./errorHandling.js";
import { reloadIframe, loadAndInitializeLibrary, compareDistances, currentStreetviewLat, currentStreetviewLong } from "./main.js";
import { loadResultMap } from "./resultMap.js";
import { setUserXP, uiSetUserXP, isAuthenticated, checkAuthenticationStatus, loadResultScreenXP } from "./accountLogic.js";
import { leaveMultiplayerRound, toggleMultiplayerSelector } from "./multiplayer.js";
import { checkIfGuessWasCorrect, countryGuesserMode, selectedCountryGuesserCountry } from "./countryGuesser.js";
import { playSound } from "../src/lib/utils/soundManager.js";
import { changeCategory, loadCommunityCategories, mapCategory, loadMapCategory, attachCategoryEventListeners, checkGenerationTypeAndGenerate } from "./categoryMenu.js";
import { leaveCompetition, loadCompetition } from "./competitionLogic.js";
import { loadProfileFromId, supportedAmount, supporterLevel } from "./profileView.js";
import { resetMap } from "./miniMap.js";
import { refreshPlacements } from "./ads.js";
import { openLocationOnMaps } from "../src/lib/utils/openLocationOnMaps.js";
import { calculateDistances } from "../src/lib/utils/distanceFunctions.js";

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

// Various buttons and links -----------------------------------------------------------------------------------------------------------------
document.getElementById("discoverMaps").addEventListener("click", () => { playSound("basic_button"); showPageBrowser("/maps.html"); });
document.getElementById("discoverEducation").addEventListener("click", function () { playSound("basic_button"); window.open("https://education.openguessr.com", '_blank').focus() });

// Result screen animations ---------------------------------------------------------------------------------------------------------
export let resultScreenEnabled = false;

export function enableResultScreen(guessLat, guessLong) {
    if (!resultScreenEnabled) {

        // Error proofing in case they are not defined
        guessLat = guessLat || 0;
        guessLong = guessLong || 0;

        const distance = calculateDistances(guessLat, guessLong);

        const resultStrings = compareDistances(distance);
        let resultString = resultStrings.resultAsString;
        let extraMessage = resultStrings.extraMsg;

        loadResultScreenXP(distance);

        document.getElementById("EndOverlay").style.opacity = "0%";
        document.getElementById("EndOverlay").style.display = "flex";

        setTimeout(() => {
            document.getElementById("EndOverlay").style.opacity = "100%";
        }), 50;

        refreshPlacements();

        document.getElementById("distanceText").innerText = resultString;
        document.getElementById("motivationText").innerText = extraMessage;

        if (countryGuesserMode) {
            if (checkIfGuessWasCorrect()) {
                document.getElementById("distanceText").innerText = "Correct!";
                document.getElementById("motivationText").innerText = "The country is " + selectedCountryGuesserCountry + ".";
            } else {
                document.getElementById("distanceText").innerText = "Wrong!";
                document.getElementById("motivationText").innerText = "The country was " + selectedCountryGuesserCountry + ".";
            }
        }

        // Reset the map if it already exists - important for going to the next round
        resetMap();

        // Add CSS class to the map container to style the map
        document.getElementById("mapHolder").classList.add("mapHolderToResult");
        document.getElementById("map").classList.add("mapFullOpacity");

        // Load result on the map
        loadResultMap(guessLat, guessLong);

        playSound("confirm");

        resultScreenEnabled = true;
    } else {
        console.log("Result screen already enabled!");
    }
}

let hideEndOverlayTimeout;

export function disableResultScreen() {
    if (resultScreenEnabled) {
        clearTimeout(hideEndOverlayTimeout);

        document.getElementById("EndOverlay").style.opacity = "0%";

        hideEndOverlayTimeout = setTimeout(function () {
            document.getElementById("EndOverlay").style.display = "none";
            resultScreenEnabled = false;
            refreshPlacements();
        }, 250);

        resetMap();
    } else {
        console.warn("Result screen already disabled.");
    }
}

// Map Category menu (extended navbar) -------------------------------------------------------------------------------------------------
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");
let topButtonArea = document.getElementById("topButtonArea");
let mobileButtonArea = document.getElementById("mobileButtonArea");

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
        let mobileControlsTimeout;

        if (!categoriesExpanded) {
            clearTimeout(moveTimeouts);
            clearTimeout(mobileControlsTimeout);
            document.getElementById("extendedNavbarContent").scrollTop = "0";

            if (window.matchMedia("(max-width: 600px)").matches) {
                extendedNavbar.classList.add("expandedMobile");
                document.getElementById("extendedNavbarGradient").style.display = "block";
                document.getElementById("extendedNavbarGradient").style.borderRadius = "0";

                mobileControlsTimeout = setTimeout(() => {
                    document.getElementById("mobileExtendedNavbarControls").style.display = "flex";
                    document.getElementById("mobileExtendedNavbarControls").style.opacity = "1";
                }, 150);
            } else {
                document.getElementById("extendedNavbarGradient").style.borderRadius = "0 0 10px 10px";
                mobileButtonArea.style.top = "465px";
            }

            moveTimeouts = setTimeout(() => {
                topButtonArea.style.top = "465px";
                document.getElementById("extendedNavbarGradient").style.display = "block";
                extendedNavbar.classList.add("expanded");
                document.getElementById("mapsArrow").classList.add("arrowIconRotated");
                categoriesExpanded = true;
            }, 100);

        } else {
            clearTimeout(moveTimeouts);
            clearTimeout(mobileControlsTimeout);
            setTimeout(function () {
                topButtonArea.style.top = "15px";
                mobileButtonArea.style.top = "15px";
                document.getElementById("extendedNavbarGradient").style.display = "none";
                document.getElementById("mobileExtendedNavbarControls").style.display = "none";
            }, 75);
            document.getElementById("mobileExtendedNavbarControls").style.opacity = "0";
            extendedNavbar.classList.remove("expanded");
            extendedNavbar.classList.remove("expandedMobile");
            document.getElementById("mapsArrow").classList.remove("arrowIconRotated");
            categoriesExpanded = false;
        }
    } catch (error) {
        console.warn("Couldn't toggle category menu: " + error);
    }

}

// Expand Countries Category section in map menu -----------------------------------------------------------------------------------

let countryCategoriesExpand = document.getElementById("countryCategoriesExpand");
let countryCategoryArea = document.getElementById("expandableCountryArea");

let countryCategoriesExpanded = false;

countryCategoriesExpand.addEventListener("click", () => {

    if (countryCategoriesExpanded) {
        countryCategoryArea.style.maxHeight = "185px";
        document.getElementById("arrowIconCountries").style.rotate = "0deg";
        document.getElementById("countryCategoriesFade").style.opacity = "1";
        document.getElementById("countriesMoreText").style.width = "fit-content"
        document.getElementById("countriesMoreText").style.marginRight = "5px";
    } else {
        countryCategoryArea.style.maxHeight = "2000px";
        document.getElementById("arrowIconCountries").style.rotate = "180deg";
        document.getElementById("countryCategoriesFade").style.opacity = "0";
        document.getElementById("countriesMoreText").style.width = "0"
        document.getElementById("countriesMoreText").style.marginRight = "0";
    }

    countryCategoriesExpanded = !countryCategoriesExpanded;
});

// Social top bar area --------------------------------------------------------------------------------------------------------------

export function setGamemodeSelector(enabled) {
    if (enabled) {
        document.getElementById("gamemodeMenu").classList.remove("gamemodeMenuDisabled");
    } else {
        document.getElementById("gamemodeMenu").classList.add("gamemodeMenuDisabled");
    }
}

// Username UI endless scroll --------------------------------------------------------------------------------------------------

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

// Mobile UI Menu Buttons -----------------------------------------------------------------------------------------
document.getElementById("mobileLeaderboardButton").addEventListener("click", () => {
    playSound("basic_button");
    goToLeaderboard();
});

document.getElementById("mobileMultiplayerButton").addEventListener("click", function () {
    toggleMultiplayerSelector();
    playSound("basic_button");
});

document.getElementById("mobileCategoryButton").addEventListener("click", function () {
    toggleCategoryMenu();
    playSound("floating_button");
});

document.getElementById("mobileCompetitionsButton").addEventListener("click", function () {
    playSound("basic_button");
    showPageBrowser("/competitions.html");
});

// Prevent automatic "last button press" with space bar or enter key ------------------------------------------------------------------
document.addEventListener('keydown', function (event) {
    var tag = event.target.tagName.toLowerCase();
    if (event.key === 'Enter' || event.key === ' ') {
        if (tag === 'button') {
            event.preventDefault();
        }
    }
});

// Check if element is clickable ----------------------------------------------------------

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

// Daily competition link to competitions ---------------------------------------------------------------------------------

document.getElementById("dailyCompetition").addEventListener("click", () => {
    playSound("button_juicy");
    showPageBrowser("/competitions.html");
});

// Supporter Boost effect -------------------------------------------------------------------------------

let supporterBoost = document.getElementById("supporterBoost");
let supporterBoostText = document.getElementById("supporterBoostText");
let supporterBoostTimeout;

export async function supporterXpBoostAnimation(factor) {
    supporterBoost.style.opacity = "0";
    supporterBoostText.classList.remove("supporterBoostTextMove");
    clearTimeout(supporterBoostTimeout);

    await new Promise(resolve => {
        supporterBoostTimeout = setTimeout(resolve, 1500);
    });

    factor -= 1;
    factor = Math.round(factor * 100);
    factor += "%";

    supporterBoostText.textContent = factor + " Experience Boost";

    supporterBoost.style.opacity = "1";
    supporterBoostText.classList.add("supporterBoostTextMove");

    supporterBoostTimeout = setTimeout(() => {
        supporterBoost.style.opacity = "0";
        supporterBoostText.classList.remove("supporterBoostTextMove");
    }, 2000);
}

// Open map locations on google maps --------------------------------------------------------------------------------------------------

document.getElementById("endScreenOpenLocation").addEventListener("click", () => { playSound("basic_button"); openLocationOnMaps(currentStreetviewLat, currentStreetviewLong) });

// Hide advertisements (Supporter Tier 2) ----------------------------------------------------------------

export function setAdVisibility(visible) {
    try {
        document.querySelectorAll(".hideForSupporters").forEach((e) => {
            e.style.display = visible ? "" : "none";
        });
    } catch (error) {
        console.error("Error disabling/enabling ads that can be hidden for supporters in main.js: " + error);
    }
}

// Detect intent to leave or reload website using mouse movements  --------------------------------------------------------------------------------

let exitBarTimeout;
let exitBarDisabled = false;
let lastMouseY = window.innerHeight; // Start as the bottom of the window
let isMouseInPage = false; // Flag to check if the mouse was previously outside the window

// Track mouse movements
document.addEventListener("mousemove", (event) => {
    const currentMouseY = event.clientY;

    // Check if the mouse is entering the page for the first time
    if (!isMouseInPage) {
        isMouseInPage = true;
        lastMouseY = currentMouseY;
        return;
    }

    // Update lastMouseY only after mouse enters the page
    lastMouseY = currentMouseY;
});

// Disable popup on top bar hover
document.querySelectorAll(".topBarDesktop").forEach((e) => {
    e.addEventListener("mouseover", () => {
        clearTimeout(exitBarTimeout);
        exitBarDisabled = true;
        exitBarTimeout = setTimeout(() => {
            exitBarDisabled = false;
        }, 350);
    });
});

document.getElementById("topCursorDetectionBar").addEventListener("mouseover", (event) => {
    const currentMouseY = event.clientY;

    // Trigger popup only if mouse is moving upwards and was inside the page before
    if (currentMouseY < lastMouseY && isMouseInPage) {
        if (!exitBarDisabled) {
            exitIntentPopup();
        }
    }

    // Update lastMouseY after checking
    lastMouseY = currentMouseY;
});

// Reset mouse-in-page flag when the mouse leaves the window
document.addEventListener("mouseleave", () => {
    isMouseInPage = false;
});

// Before Exit Popup ---------------------------------------------------------------
const beforeExitPopup = document.getElementById("beforeExitPopup");

function exitIntentPopup() {
    if (localStorage.getItem("hideExitPopup") != "1" && beforeExitPopup.style.display != "flex") {
        beforeExitPopup.style.display = "flex";
        expandCostExpanded = false;
        setExplanationExpandState();
        loadMonthlySupportedAmount();
    }
}

document.getElementById("beforeExitNotAgain").addEventListener("click", () => {
    beforeExitPopup.style.display = "none";
    localStorage.setItem("hideExitPopup", "1");
    playSound("basic_button");
});

document.getElementById("beforeExitClose").addEventListener("click", () => {
    beforeExitPopup.style.display = "none";
    playSound("basic_button");
});

document.getElementById("costSupportButton").addEventListener("click", () => {
    beforeExitPopup.style.display = "none";
    playSound("basic_button");
    supporterWindowIfAuthenticated();
});

document.getElementById("beforeExitReloadButton").addEventListener("click", () => {
    beforeExitPopup.style.display = "none";
    playSound("basic_button");
    leaveMultiplayerRound();
    leaveCompetition(false);
    disableResultScreen();
    disablePageBrowser();
    checkGenerationTypeAndGenerate();
});

// text expand

const expandableCostExplanation = document.getElementById("costExplanationText");

let expandCostExpanded = false;

document.getElementById("costExplanationToggle").addEventListener("click", () => {
    expandCostExpanded = !expandCostExpanded;
    setExplanationExpandState();
})

function setExplanationExpandState() {
    if (expandCostExpanded) {
        document.getElementById("costExplanationToggle").textContent = "Show less";
        expandableCostExplanation.style.maxHeight = "5000px";
    } else {
        document.getElementById("costExplanationToggle").textContent = "Read more";
        expandableCostExplanation.style.maxHeight = "";
    }
}

async function loadMonthlySupportedAmount() {
    const monthlySupportedText = document.getElementById("monthlySupportedAmount");
    monthlySupportedText.textContent = "+$ ... ...";

    try {
        const response = await fetch("https://accounts.openguessr.com/stripe/statistics/current-month", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error("Error occurred while loading monthly supported amount: " + response.status);
        } else {
            const data = await response.json();
            monthlySupportedText.textContent = "+$ " + data.supported_amount;
        }

    } catch (error) {
        console.error("Network error occured trying to load monthly supported amount: " + error);
    }

}

// Captcha Popup for the minimap to prevent bots and malicious map load attempts ------------------------------------------------
const captchaPopup = document.getElementById("captchaPopup");

let captchaRendered = false;

export function showCaptchaPopup() {
    captchaPopup.style.display = "flex";

    if (!captchaRendered) {
        captchaRendered = true;
        try {
            turnstile.render('#captchaContainer', {
                sitekey: "0x4AAAAAAAi-FhzOg4nXIP3z",
                callback: onTurnstileCallback // Ensure this callback function is defined globally (window.functionname)
            });
        } catch (error) {
            console.error("Error occured trying to render captcha with Turnstile: " + error);
        }
    }
}

export function hideCaptchaPopup() {
    captchaPopup.style.display = "none";
}

document.getElementById("captchaClose").addEventListener("click", () => {
    playSound("basic_button");
    hideCaptchaPopup();
});

// In-App page browser -------------------------------------------------------------------------------------------------------

/*
KEPT AROUND FOR FUTURE INSPECTION

window.onmessage = function (e) {
    try {
        const data = String(e.data); // Ensure data is a string

        const profileMatch = data.match(/^profile(\d+)$/); // extract profile id if text includes profile

        switch (true) {
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
*/

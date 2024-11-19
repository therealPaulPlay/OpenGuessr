import { toggleMultiplayerSelector } from "./multiplayer.js";
import { playSound } from "../src/lib/utils/soundManager.js";

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

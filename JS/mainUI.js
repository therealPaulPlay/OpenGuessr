import { closePopup, errorPopup } from "./errorHandling.js";
import { reloadIframe, loadAndInitializeLibrary, compareDistances, calculateDistances, loadResultMap } from "./main.js";
import { setUserXP, uiSetUserXP, isAuthenticated, checkAuthenticationStatus, loadResultScreenXP } from "./accountLogic.js";
import { leaveMultiplayerRound, toggleMultiplayerSelector } from "./multiplayer.js";
import { checkIfGuessWasCorrect, countryGuesserMode, selectedCountryGuesserCountry } from "./countryGuesser.js";
import { playSound } from "./soundManager.js";
import { changeCategory, loadCommunityCategories, mapCategory, loadMapCategory, attachCategoryEventListeners, checkGenerationTypeAndGenerate } from "./categoryMenu.js";
import { leaveCompetition, loadCompetition } from "./competitionLogic.js";
import { loadProfileFromId, supportedAmount, supporterLevel } from "./profileView.js";
import { initializeRewardAd } from "./rewardedAds.js";
import { enableBottomAd, enableResultAds } from "./venatusCustom.js";
import { handleMapUnhover, resetMap } from "./miniMap.js";

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
    
        document.getElementById("EndOverlay").style.opacity = "100%";
        document.getElementById("EndOverlay").style.visibility = "visible";
    
        document.getElementById("distanceText").innerText = resultString;
        document.getElementById("motivationText").innerText = extraMessage;
    
        enableResultAds();
    
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
            document.getElementById("EndOverlay").style.visibility = "hidden";
            resultScreenEnabled = false;
            enableBottomAd();
        }, 250);

        resetMap();
    } else {
        console.warn("Result screen already disabled.");
    }
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
        document.getElementById("revealCompassArrow").style.transform = "rotate(90deg)";
        document.getElementById("mapHolder").style.marginRight = "0px";
        mapOffset = false;
    } else {
        document.getElementById("revealCompassArrow").style.transform = "rotate(270deg)";
        document.getElementById("mapHolder").style.marginRight = "65px";
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
        document.getElementById("blackBackground").style.visibility = "visible";
    } else {
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
setTimeout(() => {
    document.querySelectorAll(".noAdvertsText").forEach((e) => {
        e.style.opacity = "0.25";
    });
}, 8000);

// Daily competition link to competitions ---------------------------------------------------------------------------------

document.getElementById("dailyCompetition").addEventListener("click", () => {
    playSound("button_juicy");
    showPageBrowser("/competitions.html");
});

// Universal confirm popup -------------------------------------------------------------------------------------------------

let confirmPopup = document.getElementById("confirmPopup");

export function showConfirmPopup(title, text, executeFunction, accountDelete, nameChange, messageOnly, adPrompt, supporterPrompt, signupPrompt) {
    confirmPopup.style.display = "flex";
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmDescription").innerHTML = text;
    document.getElementById("accountDeletePassword").style.display = "none";
    document.getElementById("usernameInput").style.display = "none";
    document.getElementById("confirmProceed").style.display = "block";
    document.getElementById("confirmProceed").textContent = "Confirm";
    document.getElementById("confirmProceed").style.backgroundColor = "var(--brand-color)";

    if (accountDelete) {
        document.getElementById("accountDeletePassword").style.display = "block";
        document.getElementById("accountDeletePassword").value = "";
    }

    if (nameChange) {
        document.getElementById("usernameInput").style.display = "block";
        document.getElementById("usernameInput").value = "";
    }

    if (messageOnly) {
        document.getElementById("confirmProceed").style.display = "none";
    }

    if (adPrompt) {
        document.getElementById("confirmProceed").textContent = "Reactivate";
        document.getElementById("confirmProceed").style.backgroundColor = "#588e6b";
    }

    if (supporterPrompt) {
        document.getElementById("confirmProceed").textContent = "Support";
        document.getElementById("confirmProceed").style.backgroundColor = "#588e6b";
    }

    if (signupPrompt) {
        document.getElementById("confirmProceed").textContent = "Create Account";
    }

    // Remove all event listeners by cloning the element
    const button = document.getElementById("confirmProceed");
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", () => {
        playSound("basic_button");

        try {
            if (executeFunction) {
                executeFunction();
            }
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

// Supporter benefits window and purchases -----------------------------------------------------------------------------------------------------------------------

document.querySelectorAll(".supporterAdText").forEach((e) => {
    e.addEventListener("click", () => {
        supporterWindowIfAuthenticated();
    });
});

export function supporterWindowIfAuthenticated() {
    if (isAuthenticated) {
        openSupporterWindow();
        return true;
    } else {
        showConfirmPopup("Account required", "To support OpenGuessr with a one-time payment, an account is required, so that you can enjoy amazing supporter benefits on all devices!", () => {
            showPageBrowser("/signup.html", true);
        }, false, false, false, false, false, true);
        return false;
    }
}

document.getElementById("viewSupporterBenefits").addEventListener("click", () => {
    playSound("basic_button");
    openSupporterWindow();
});

document.getElementById("supporterClose").addEventListener("click", () => {
    playSound("basic_button");
    closeSupporterWindow();
});

function openSupporterWindow() {
    updateTierPrices();
    document.getElementById("supporterPopup").style.display = "flex";
    document.getElementById("supporterTierScrollBox").scrollTop = "0";
}

function closeSupporterWindow() {
    setSupporterPitch();
    document.getElementById("supporterPopup").style.display = "none";
}

export function setSupporterPitch() {
    if (!(supporterLevel > 0)) {
        document.getElementById("supporterPitch").textContent = "Become a supporter.";
        document.getElementById("supporterTextSecondary").textContent = "Contributions keep the game free.";
    } else {
        document.getElementById("supporterPitch").textContent = "Thank you.";
        document.getElementById("supporterTextSecondary").textContent = "Your contribution keeps the game free.";
    }
}

function updateTierPrices() {
    const basePrices = [2.99, 6.99, 14.99, 24.99];

    for (let i = 1; i <= 4; i++) {
        const priceButton = document.getElementById("tierPrice" + i);

        if (supporterLevel >= i) {
            priceButton.classList.add("tierBuyButtonUnlocked");
            priceButton.textContent = "Unlocked";
        } else {
            priceButton.classList.remove("tierBuyButtonUnlocked");
            priceButton.textContent = basePrices[i - 1] + " $";

            if (supportedAmount > 0) {
                priceButton.innerHTML = `<span class="baseTierPrice">${priceButton.textContent = basePrices[i - 1]} $</span>${Math.round(Math.max(basePrices[i - 1] - supportedAmount - 0.01, 0) * 100) / 100} $`;
            }
        }

    }
}

// Initialize Stripe
const stripeTestPubKey = "pk_test_51Ple5q1DTHjmMID9JDDStdV8VeFdfqVZMpGKFMaCrFD6WioMuoAuWzl9Odz25aJvw3L4tHVtzLrdNUFG34gH5pN300ZhIcpIID";
const stripeLivePubKey = 'pk_live_51Ple5q1DTHjmMID9LrSuKNuwlN0Ls0issp2PTRO9QWGPdmKpLspMUXvKZQnXtHT5u0SxYZDBVSDsadzy3lAq5T2j00X9uGEJdr';
let stripe;

// load stripe
async function getStripe() {
    stripe = await loadAndInitializeLibrary(
        'https://js.stripe.com/v3/',
        'Stripe',
        (Stripe) => Stripe(stripeLivePubKey)
    );

    return stripe;
}

// Function to handle buy button click
async function handleBuyClick(productId) {

    if (!stripe) {
        await getStripe();
    }

    try {
        // Fetch the current user's ID (you need to implement this based on your authentication system)
        const id = localStorage.getItem("id");

        // Call the server to create a Checkout Session
        const response = await fetch('https://accounts.openguessr.com/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("bearer")
            },
            body: JSON.stringify({ productId, id })
        });

        const { sessionId } = await response.json();

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (result.error) {
            console.error('Error occured during request to stripe:', result.error.message);
            errorPopup("Stripe request failed", "The server returned an error from your purchase request.", error, false, false);
        }
    } catch (error) {
        console.error('Error occured when trying to send request to stripe:', error);
        errorPopup("Error sending stripe request", "Your purchase request couldn't be sent.", error, false, false);
    }
}

// Add event listeners to buy buttons
document.querySelectorAll('.tierBuyButton').forEach((button) => {
    try {
        button.addEventListener('click', () => {
            const productId = Number(button.id.replace(/[^0-9]/g, ''));
            handleBuyClick(productId);
            button.textContent = "please wait...";
        });
    } catch (error) {
        console.error("Failed to attach event listener to tierBuyButton: " + error);
    }
});

// Thank you window after purchase for stripe
let urlParams = new URLSearchParams(window.location.search);

let stripeSessionFinished;

try {
    stripeSessionFinished = urlParams.get("session_id");
    if (stripeSessionFinished) {
        showConfirmPopup("Thank you!", "You are now a supporter - thank you for your contribution! Supporters like you keep the game free and open for everyone.", false, false, false, true);
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
} catch { }

// Free ad-supported experience boost --------------------------------------------------------------------------

let freeSupporterBoost = document.getElementById("freeSupporterBoost");

export let freeSupporterBoostEnabled = false;

freeSupporterBoost.addEventListener("click", () => {
    playSound("basic_button");
    initializeRewardAd(supporterBoostAdDismiss, enableSupporterAdBoost);
});

function setAdSupporterTier(available) {
    if (available) {
        document.getElementById("adTierBox").style.pointerEvents = "auto";
        document.getElementById("adTierBox").style.background = "rgb(80, 90, 91)";
        freeSupporterBoost.style.pointerEvents = "auto";
        freeSupporterBoost.style.opacity = "1";
        document.getElementById("freeSupporterBoostText").textContent = "Free 20% experience boost.";
    } else {
        document.getElementById("adTierBox").style.pointerEvents = "none";
        document.getElementById("adTierBox").style.background = "rgba(255, 255, 255, 0.1)";
        freeSupporterBoost.style.pointerEvents = "none";
        freeSupporterBoost.style.opacity = "0.5";
        document.getElementById("freeSupporterBoostText").textContent = "Experience boost active.";
    }
}

function supporterBoostAdDismiss(adNotAvailable, rewardClaimed) {
    if (adNotAvailable) {
        errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
        setAdSupporterTier(true);
    } else {
        if (!rewardClaimed) {
            errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
            setAdSupporterTier(true);
        } else {
            setAdSupporterTier(false);
        }
    }
}

function enableSupporterAdBoost() {
    setAdSupporterTier(false);
    startAdSupporterTimer();
    freeSupporterBoostEnabled = true;
}

async function startAdSupporterTimer(prefix = "Boost active. Remaining: ") {
    let t = 180, e = document.getElementById("freeSupporterBoostText");
    (function u() {
        let timeText = t > 59
            ? Math.floor(t / 60) + ':' + (t % 60).toString().padStart(2, '0') + ' min'
            : t + 's';
        e.textContent = prefix + timeText;
        t > 0 ? (setTimeout(u, 1000), t--) : (setAdSupporterTier(true), freeSupporterBoostEnabled = false,
            showConfirmPopup("Boost expired", "Your free experience boost has expired. Do you want to reactivate it?", () => { initializeRewardAd(supporterBoostAdDismiss, enableSupporterAdBoost) }, false, false, false, true));
    })();
}

// Notification -----------------------------------------------------------------------------------------

const notificationBar = document.getElementById("notificationBar");

let hideNotificationTimeout;

export function showNotification(text, acceptFunction, dismissFunction, showAccept, renameAcceptToLearnMore) {
    notificationBar.style.top = "65px";
    notificationBar.style.opacity = "1";
    document.getElementById("notificationText").textContent = text;
    document.getElementById("notificationAccept").textContent = "Accept";
    clearTimeout(hideNotificationTimeout);

    if (showAccept) {
        document.getElementById("notificationAccept").style.display = "block";
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 30000); // much longer expiration time for notifications that ask for user action
    } else {
        document.getElementById("notificationAccept").style.display = "none";
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 3000);
    }

    if (renameAcceptToLearnMore) {
        document.getElementById("notificationAccept").textContent = "?";
        clearTimeout(hideNotificationTimeout);
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 5000); // shorter expiration for informational notifications
    }

    const button = document.getElementById("notificationAccept");
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    const dismissButton = document.getElementById("notificationDismiss");
    const newDismissButton = dismissButton.cloneNode(true);
    dismissButton.parentNode.replaceChild(newDismissButton, dismissButton);

    newButton.addEventListener("click", () => {
        if (acceptFunction) {
            try {
                acceptFunction();
            } catch (e) { console.error("Error executing callback in showNotification: " + e); }
        }

        hideNotification();
        playSound("basic_button");
    });

    newDismissButton.addEventListener("click", () => {
        if (dismissFunction) {
            try {
                dismissFunction();
            } catch (e) { console.error("Error executing callback in showNotification: " + e); }
        }

        hideNotification();
        playSound("basic_button");
    });
}

function hideNotification() {
    notificationBar.style.top = "50px";
    notificationBar.style.opacity = "0";
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

// Detect intent to leave or reload website using mouse movements  -----------------------------------------------------------------------------

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
    if (!localStorage.getItem("hideExitPopup")) {
        beforeExitPopup.style.display = "flex";
        expandCostExpanded = false;
        setExplanationExpandState();
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

// Animate all uiWindow elements --------------------------------------------------------------------------

// Function to add the animation class
function handleVisibilityChange(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        } else {
            entry.target.classList.remove('animate');
        }
    });
}

// Options for the IntersectionObserver
const observerOptions = {
    root: null, // Use the viewport as the root
    rootMargin: '0px',
    threshold: 0 // Trigger as soon as even one pixel is visible
};

// Create the observer
const observer = new IntersectionObserver(handleVisibilityChange, observerOptions);

// Start observing all `.uiWindow` elements
document.querySelectorAll('.uiWindow').forEach(element => {
    observer.observe(element);
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
    if (pageBrowserWindow.style.display != "none") {
        document.getElementById("blackBackground").style.visibility = "hidden";
        pageBrowserWindow.style.display = "none";
        document.getElementById("pageBrowserIframe").style.opacity = "0";
        document.getElementById("pageBrowserIframe").src = ""; // unload iframe to save performance
    }
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

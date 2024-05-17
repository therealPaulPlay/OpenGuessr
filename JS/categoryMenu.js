import { resMap, generateNewLocation } from "./main.js";
import { disableResultScreen, shrinkMapIfMobile, socialPopupProbability, toggleCategoryMenu } from "./mainUI.js";
import { setDailyChallengeUI, dailyChallengeUIEnabled, dailyChallengeEnd, checkDailyChallengeCompletion, dailyChallengeTimer, disableDailyChallengeVariableOnly } from "./dailyChallenge.js";
import { setHardMode } from "./hardMode.js";
import { multiplayer, showMultiplayerOverlay, isHost, sendMessageToAll, showMultiplayerRoundResults, autoSkipResult } from "./multiplayer.js";
import { errorPopup } from "./errorHandling.js";
import { justPlayedDailyChallenge } from "./miniMap.js";

//Button Logic / Event listeners / apply correct styling to selected categories -------------------------------------------------------------------------
const Category = {
    STANDARD: "standard",
    CAPITAL: "capital",
    FAMOUS: "famous",
    USA: "usa",
    GERMANY: "germany",
    UK: "uk",
    FRANCE: "france",
    SPAIN: "spain",
    POLAND: "poland",
    CANADA: "canada",
    SWEDEN: "sweden",
    INDIA: "india",
    MEXICO: "mexico",
    ITALY: "italy",
    UKRAINE: "ukraine",
    AUSTRIA: "austria",
    NORWAY: "norway",
    AUSTRALIA: "australia",
    BRASIL: "brasil",
    RUSSIA: "russia",
    SLOVAKIA: "slovakia",
    ROMANIA: "romania",
    DAILY: "daily",
    HARD: "hard",
    MOUNTAIN: "mountain",
    INDOOR: "indoor",
    FINLAND: "finland",
    ISRAEL: "israel",
    CZECHIA: "czechia",
    STADIUM: "stadium",
    WHETHERSPOON: "whetherspoon",
    SKYSCRAPER: "skyscraper",
    RACETRACK: "racetrack"
};

export let mapCategory = Category.STANDARD; // Default category

// Attach event listeners dynamically
for (const category in Category) {
    const button = document.getElementById(`${category.toLowerCase()}Category`);
    if (button) {
        button.addEventListener("click", createCategoryChangeListener(Category[category]));
    } else {
        console.warn(`Element with ID "${category.toLowerCase()}Category" not found. Click listener not attached.`);
    }
}

// Function to create a closure for each category button listener
function createCategoryChangeListener(category) {
    return function () {
        changeCategory(category);
    };
}

export function changeCategory(category) {
    // Disable all category buttons
    const categoryButtons = document.querySelectorAll("[id$='Category']");
    categoryButtons.forEach(button => button.classList.add("categoryDisabled"));

    // Enable the clicked category button
    const clickedButton = document.getElementById(`${category.toLowerCase()}Category`);
    if (clickedButton) {
        clickedButton.classList.remove("categoryDisabled");
    } else {
        console.warn(`Element with ID "${category.toLowerCase()}Category" not found.`);
    }

    // Refresh category if needed
    if (mapCategory !== category) {
        mapCategory = category;
        localStorage.setItem("selectedCategory", category);
    }

    setTimeout(() => {
        toggleCategoryMenu(true);
    }, 300);

    checkGenerationTypeAndGenerate();
}



//Check categories and initiate location generation  ---------------------------------------------------------------------------------------------------------------

export function checkGenerationTypeAndGenerate() {
    try { dailyChallengeTimer.stopTimer(); } catch { }; //has to be in try catch
    setHardMode(false);
    document.getElementById("mapTimer").textContent = "00" + ":" + "00"; //reset the timer visually

    if (!multiplayer) {
        //If multiplayer is disabled
        setDailyChallengeUI(false);
        showMultiplayerOverlay(false);

        //pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "daily" && mapCategory != "hard") {
            generateNewLocation("JSON");
        } else if (mapCategory == "daily") {
            if (checkDailyChallengeCompletion() == "available") {
                setDailyChallengeUI(true);
                generateNewLocation("DAILY");
            } else {
                localStorage.setItem("selectedCategory", "standard");
                window.location.href = "/dailyLeaderboard.html";
            }

        } else if (mapCategory == "standard") {
            generateNewLocation("SDK");
        } else if (mapCategory == "hard") {
            setHardMode(true);
            generateNewLocation("JSON");
        } else {
            console.error("Incorrect mapCategory set in categoryMenu.js under checkGenerationTypeAndGenerate.")
        }
    } else {
        //If multiplayer is enabled
        try {
            disableDailyChallengeVariableOnly(); //disable the daily challenge (will be re-enabled by renunning the location gen after leaving)

            if (isHost) {
                if (mapCategory != "standard" && mapCategory != "daily" && mapCategory != "hard") {
                    generateNewLocation("JSON");
                } else if (mapCategory == "standard") {
                    generateNewLocation("SDK");
                } else {
                    //if the map category is an unsupported multiplayer category, such as daily or hard, switch to standard
                    changeCategory("standard"); //this will re-run checkGenerationTypeAndGenerate
                    setTimeout(function () {
                        errorPopup("Unsupported Multiplayer Map", "This map category is not available for multiplayer and was automatically changed to Standard.", "Map unsupported", false);
                    }, 3500);
                }
            } else {
                generateNewLocation("FROMHOST");
            }
        } catch (error) {
            console.error("Error loading multiplayer location in categoryMenu.js Error: ", error)
        }

    }

}

//Load the map category using localstorage ---------------------------------------------------------------------

function loadMapCategory() {
    let storedSelectedCategory = localStorage.getItem("selectedCategory");

    if (storedSelectedCategory != null)
        mapCategory = storedSelectedCategory;
}

loadMapCategory();
changeCategory(mapCategory);


//Next round / new location -------------------------------------------------------------------------------------
let nextRound = document.getElementById("nextRound");
nextRound.addEventListener("click", transitionToStart);

export function transitionToStart() {

    if (!justPlayedDailyChallenge) { //justPlayedDailyChallenge is true when user has clicked "guess" button & dailyChallengeUIEnabled == true
        document.getElementById("BeforeOverlay").style.opacity = "0";
        document.getElementById("BeforeOverlay").style.visibility = "visible";
        document.getElementById("BeforeOverlay").style.opacity = "100";
        resMap.stop(); //stop the flying animation
        setTimeout(function () { resMap.stop() }, 200)
        checkGenerationTypeAndGenerate();

        setTimeout(disableResultScreen, 200);
        setTimeout(socialPopupProbability, 650);

        //notify peers that the next round has begun
        if (isHost && multiplayer) {
            clearTimeout(autoSkipResult);
            sendMessageToAll("closeResultScreen");
            showMultiplayerRoundResults();
        }

        shrinkMapIfMobile();

    } else {
        dailyChallengeEnd();
    }
}

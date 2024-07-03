import { generateNewLocation } from "./main.js";
import { disableResultScreen, resultScreenEnabled, shrinkMapIfMobile, socialPopupProbability, toggleCategoryMenu, isElementClickable } from "./mainUI.js";
import { setDailyChallengeUI, dailyChallengeEnd, checkDailyChallengeCompletion, dailyChallengeTimer, disableDailyChallengeVariableOnly } from "./dailyChallenge.js";
import { setHardMode } from "./hardMode.js";
import { multiplayer, showMultiplayerOverlay, isHost, sendMessageToAll, showMultiplayerRoundResults, autoSkipResult } from "./multiplayer.js";
import { errorPopup } from "./errorHandling.js";
import { handleMapUnhover, justPlayedDailyChallenge, resetMap } from "./miniMap.js";
import { setCountryGuesserMode } from "./countryGuesser.js";
import { playSound } from "./soundManager.js";
import { toggleStreakWindow } from "./rewardedAds.js";

//Button Logic / Event listeners / apply correct styling to selected categories -------------------------------------------------------------------------
let Category = {
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
    TURKEY: "turkey",
    DAILY: "daily",
    COUNTRY: "country",
    FINLAND: "finland",
    ISRAEL: "israel",
    CZECHIA: "czechia",
    JAPAN: "japan",
    INDONESIA: "indonesia",
    AFRICA: "africa",
    SOUTHAMERICA: "southamerica",
    NORTHAMERICA: "northamerica",
    ASIA: "asia",
    EUROPE: "europe",
    OCEANIA: "oceania"
};

export let mapCategory = Category.STANDARD; // Default category

//Community Categories Generation ----------------------------------------------------------------------------
function loadCommunityCategories() {
    try {
        let mapArray = [];
        mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
        
        //if key doesn't exist yet, add a few default picks
        if (localStorage.getItem("addedCommunityMaps") == null) {
            mapArray = ["Indoor", "Airports", "Bridges", "Racetracks", "Modern Brutalism"];
            localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
        }

        mapArray.forEach((element) => {
            let categoryMenu = document.getElementById("communityMapArea");
            categoryMenu.innerHTML += `<button class="category accountExclusive accountLock communityMap" id="community_${element.toLowerCase()}Category"
            type="button">${element}</button>`;

            //add to categories
            Category["COMMUNITY_" + element.toUpperCase()] = "community_" + element.toLowerCase();
        });

    } catch (error) {
        console.error("Error loading community maps from localstorage: " + error);
    }

    addCommunityCreditTag();
}


function addCommunityCreditTag() {
    let communityCategories = document.getElementsByClassName("communityMap");
    let communityCategoriesArray = Array.from(communityCategories); // Convert to array
    for (let i = 0; i < communityCategoriesArray.length; i++) {
        let removeButtonId = communityCategoriesArray[i].id + "Remove";
        communityCategoriesArray[i].innerHTML += `<img class="specialCategoryInfo" id="${removeButtonId}" alt="remove category" src="/IMG/delete_icon.png">`;
        document.getElementById(removeButtonId).addEventListener("click", (event) => {
            event.stopPropagation();
            removeSelectedMap(communityCategoriesArray[i].textContent);
            communityCategoriesArray[i].remove();
        });
    }
}

function removeSelectedMap(name) {
    try {
        let mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
        const index = mapArray.indexOf(name);
        if (index !== -1) {
            mapArray.splice(index, 1);
            localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
        }
    } catch (error) {
        console.error("Error removing community map: " + error);
    }
}

loadCommunityCategories();

// Attach event listeners dynamically -------------------------------------------------------------

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
        changeCategory(category, true);
        playSound("button_juicy");
    };
}

export function changeCategory(category, regenerate) {
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

    if (regenerate) {
        checkGenerationTypeAndGenerate();
    }
}



//Check categories and initiate location generation  ---------------------------------------------------------------------------------------------------------------

export function checkGenerationTypeAndGenerate() {
    try { dailyChallengeTimer.stopTimer(); } catch { }; //has to be in try catch
    document.getElementById("mapTimer").textContent = "00" + ":" + "00"; //reset the timer visually
    setCountryGuesserMode(false);

    if (!multiplayer) {
        //If multiplayer is disabled
        setDailyChallengeUI(false);
        showMultiplayerOverlay(false);

        //pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "daily" && mapCategory != "country" && !mapCategory.includes("community")) {
            generateNewLocation("JSON");
        } else if (mapCategory == "daily") {
            if (checkDailyChallengeCompletion() == "available") {
                setDailyChallengeUI(true);
                setHardMode(false);
                generateNewLocation("DAILY");
            } else {
                localStorage.setItem("selectedCategory", "standard");
                window.location.href = "/dailyleaderboard.html";
            }

        } else if (mapCategory == "country") {
            setCountryGuesserMode(true);
            generateNewLocation("JSON");

        } else if (mapCategory == "standard") {
            generateNewLocation("SDK");

        } else if (mapCategory.includes("community")) {
            generateNewLocation("COMMUNITY");

        } else {
            console.error("Incorrect mapCategory set in categoryMenu.js under checkGenerationTypeAndGenerate.")
        }
    } else {
        //If multiplayer is enabled
        try {
            disableDailyChallengeVariableOnly(); //disable the daily challenge (will be re-enabled by renunning the location gen after leaving)
            setHardMode(false);

            if (isHost) {
                if (mapCategory != "standard" && mapCategory != "daily" && mapCategory != "country" && !mapCategory.includes("community")) {
                    generateNewLocation("JSON");
                } else if (mapCategory == "standard") {
                    generateNewLocation("SDK");

                } else if (mapCategory.includes("community")) {
                    generateNewLocation("COMMUNITY");
        
                } else {
                    //if the map category is an unsupported multiplayer category, such as daily or hard, switch to standard
                    changeCategory("standard", true); //this will re-run checkGenerationTypeAndGenerate
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
changeCategory(mapCategory, true);


//Next round / new location -------------------------------------------------------------------------------------
let nextRound = document.getElementById("nextRound");
nextRound.addEventListener("click", () => {
    if (resultScreenEnabled) {
        transitionToStart();
        playSound("basic_button");
    }}
);

window.addEventListener("keydown", function(event) {
    if (event.key === " " && isElementClickable(document.getElementById("nextRound")) && resultScreenEnabled) {
        transitionToStart();
        playSound("basic_button");
    }
});

let alreadyTransitioning = false;

export function transitionToStart() {
    if (!alreadyTransitioning) {
        alreadyTransitioning = true;
        setTimeout(() => {
            alreadyTransitioning = false;
        }, 400);

        if (!justPlayedDailyChallenge) { // justPlayedDailyChallenge is true when user has clicked "guess" button & dailyChallengeUIEnabled == true
            document.getElementById("BeforeOverlay").style.visibility = "visible";
            document.getElementById("BeforeOverlay").style.opacity = "100";
            toggleStreakWindow(0, true);
            checkGenerationTypeAndGenerate();
            handleMapUnhover();
            disableResultScreen();
            resetMap();

            setTimeout(socialPopupProbability, 650);

            //notify peers that the next round has begun
            if (isHost && multiplayer) {
                clearTimeout(autoSkipResult);
                sendMessageToAll("closeResultScreen");
                showMultiplayerRoundResults();
            }

            shrinkMapIfMobile();

        } else {
            dailyChallengeEnd(); //go to the daily leaderboard
        }
    } else {
        console.warn("CategoryMenu.js: Already transitioning to start!");
    }
}

import { generateNewLocation } from "./main.js";
import { disableResultScreen, resultScreenEnabled, shrinkMapIfMobile, socialPopupProbability, toggleCategoryMenu, isElementClickable, showPageBrowser } from "./mainUI.js";
import { setHardMode } from "./hardMode.js";
import { multiplayer, showMultiplayerOverlay, isHost, sendMessageToAll, showMultiplayerRoundResults, autoSkipResult } from "./multiplayer.js";
import { errorPopup } from "./errorHandling.js";
import { resetMap } from "./miniMap.js";
import { setCountryGuesserMode } from "./countryGuesser.js";
import { playSound } from "./soundManager.js";
import { toggleStreakWindow } from "./streakAdPopup.js";
import { checkCompetitionRoundStatus, competitionTimer, loadCompetition, playingCompetition } from "./competitionLogic.js";
import { setImageGuessrEnabled } from "./imageGuesser.js";

//Button Logic / Event listeners / apply correct styling to selected categories -------------------------------------------------------------------------

// Seperate countries with spaces using _ !
let Category = {
    STANDARD: "standard",
    CAPITAL: "capital",
    FAMOUS: "famous",
    COUNTRY: "country",
    IMAGE: "image",
    UNITED_STATES: "united_states",
    GERMANY: "germany",
    UNITED_KINGDOM: "united_kingdom",
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
    BRAZIL: "brazil",
    RUSSIA: "russia",
    SLOVAKIA: "slovakia",
    ROMANIA: "romania",
    TURKEY: "turkey",
    FINLAND: "finland",
    ISRAEL: "israel",
    CZECHIA: "czechia",
    JAPAN: "japan",
    INDONESIA: "indonesia",
    AFRICA: "africa",
    SOUTH_AMERICA: "south_america",
    NORTH_AMERICA: "north_america",
    ASIA: "asia",
    EUROPE: "europe",
    OCEANIA: "oceania"
};

export let mapCategory = Category.STANDARD; // Default category

//Community Categories Generation ----------------------------------------------------------------------------
export function loadCommunityCategories() {
    try {
        document.getElementById("communityMapArea").innerHTML = ""; // reset element

        let mapArray = [];
        mapArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];

        //if key doesn't exist yet, add a few default picks
        if (localStorage.getItem("addedCommunityMaps") == null) {
            mapArray = ["Indoor", "Airports", "Bridges", "Racetracks"];
            localStorage.setItem("addedCommunityMaps", JSON.stringify(mapArray));
        }

        mapArray.forEach((element) => {
            let categoryMenu = document.getElementById("communityMapArea");
            categoryMenu.innerHTML += `<button class="category communityMap" id="community_${element.toLowerCase()}Category"
            type="button">${element}</button>`;

            //add to categories
            Category["COMMUNITY_" + element.toUpperCase()] = "community_" + element.toLowerCase();
        });

    } catch (error) {
        console.error("Error loading community maps from localstorage: " + error);
    }
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
attachCategoryEventListeners();

// Attach event listeners dynamically -------------------------------------------------------------
export function attachCategoryEventListeners() {
    for (const category in Category) {
        const button = document.getElementById(`${category.toLowerCase()}Category`);
        if (button) {
            // Remove all event listeners by cloning the element
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            // Add the new event listener
            newButton.addEventListener("click", createCategoryChangeListener(Category[category]));
        } else {
            console.warn(`Element with ID "${category.toLowerCase()}Category" not found. Click listener not attached.`);
        }
    }

    addCommunityCreditTag();
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

    if (regenerate) {
        if (!resultScreenEnabled) {
            resetMap(); // reset map if not on result screen to clear markers + make guess button grey again
        }
        checkGenerationTypeAndGenerate();
        setTimeout(() => {
            toggleCategoryMenu(true);
        }, 200);
    }
}

// Start specific official map from link -------------------------------------------------------------------------------------------------------------------------
let urlParams = new URLSearchParams(window.location.search);

try {
    let mapFromLink = urlParams.get("play-map").toLowerCase();

    if (mapFromLink) {
        if (document.getElementById(`${mapFromLink}Category`)) {
            console.log("Loading category " + mapFromLink);
            changeCategory(mapFromLink);
        } else {
            errorPopup("Map not available", "Unfortunately, this map doesn't exist (yet). It will likely be released in the future! Feel free to search for similar community maps.", "Map not found", false, true);
        }

        history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
    }
} catch { }

//Check categories and initiate location generation  ---------------------------------------------------------------------------------------------------------------

loadCompetition(false);

export function checkGenerationTypeAndGenerate() {
    try { competitionTimer.stopTimer(); } catch { }; // has to be in try catch
    document.getElementById("mapTimer").textContent = "00" + ":" + "00"; // reset the timer visually
    setCountryGuesserMode(false);
    setImageGuessrEnabled(false);

    if (!multiplayer && !playingCompetition) {
        //If multiplayer is disabled
        showMultiplayerOverlay(false);

        //pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "country" && mapCategory != "image" && !mapCategory.includes("community")) {
            generateNewLocation("JSON");

        } else if (mapCategory == "country") {
            setCountryGuesserMode(true);
            generateNewLocation("JSON");

        } else if (mapCategory == "image") {
            setImageGuessrEnabled(true);
            generateNewLocation("JSON");

        } else if (mapCategory == "standard") {
            generateNewLocation("SDK");

        } else if (mapCategory.includes("community")) {
            generateNewLocation("COMMUNITY");

        } else {
            console.error("Incorrect mapCategory set in categoryMenu.js under checkGenerationTypeAndGenerate.")
        }
    } else if (multiplayer) {
        // If multiplayer is enabled
        try {
            setHardMode(false);

            if (isHost) {
                if (mapCategory != "standard" && mapSupportsMultiplayer(mapCategory) && !mapCategory.includes("community")) {
                    generateNewLocation("JSON");
                } else if (mapCategory == "standard") {
                    generateNewLocation("SDK");

                } else if (mapCategory.includes("community")) {
                    generateNewLocation("COMMUNITY");

                } else {
                    //if the map category is an unsupported multiplayer category, such as hard, switch to standard
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

    } else if (playingCompetition) {
        if (checkCompetitionRoundStatus(false)) {
            setHardMode(false);
            generateNewLocation("COMPETITION");
        }
    }
}

// Load the map category using localstorage ---------------------------------------------------------------------

export function loadMapCategory() {
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
    }
}
);

window.addEventListener("keydown", function (event) {
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

        document.getElementById("BeforeOverlay").style.visibility = "visible";
        document.getElementById("BeforeOverlay").style.opacity = "100";
        toggleStreakWindow(0, true);
        disableResultScreen();
        checkGenerationTypeAndGenerate();

        setTimeout(socialPopupProbability, 650);

        //notify peers that the next round has begun
        if (isHost && multiplayer) {
            clearTimeout(autoSkipResult);
            sendMessageToAll("closeResultScreen");
            showMultiplayerRoundResults();
        }

        shrinkMapIfMobile();

    } else {
        console.warn("CategoryMenu.js: Already transitioning to start!");
    }
}

// Check if map is supported for multiplayer --------------------------------------------------------------------------------------

export function mapSupportsMultiplayer(mapCategory) {
    if (mapCategory == "country" || mapCategory == "image") {
        return false;
    } else {
        return true;
    }
}

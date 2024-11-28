import { disableResultScreen, resultScreenEnabled, isElementClickable } from "./mainUI.js";
import { multiplayer, isHost, sendMessageToAll, showMultiplayerRoundResults, autoSkipResult } from "./multiplayer.js";
import { errorPopup } from "$lib/utils/errorHandling";
import { playSound } from "../src/lib/utils/soundManager.js";
import { loadCompetition } from "../src/lib/logic/competitionLogic.js";
import { socialPopupProbability } from "../src/lib/utils/socialPopupProbability.js";
import { toggleStreakRestoreWindow } from "$lib/stores/context-specific/toggleStreakRestoreStore";
import { shrinkMapIfMobile } from "../src/lib/utils/shrinkMinimapIfMobile.js";
import { get } from "svelte/store";

// Button Logic / Event listeners / apply correct styling to selected categories -------------------------------------------------------------------------

// Seperate countries with spaces using _ !
// This is the list of categories to immediately attach event listeners to - this is the only use of this object!


export let mapCategory = "standard"; // Default category

// Country Categories generation (based on object above) -------------------------------------------------------------

let countryCategoryContainer = document.getElementById("expandableCountryArea");

for (const [key, value] of Object.entries(CountryCategories)) {
    const categoryButton = document.createElement("div");
    categoryButton.className = "category countryCategory accountLock";
    categoryButton.setAttribute("type", "button");
    categoryButton.setAttribute("id", value + "Category");
    categoryButton.innerHTML = capitalizeWords(value.replaceAll("_", " "));

    countryCategoryContainer.appendChild(categoryButton);
}

// Add spacer at the end
const categorySpacer = document.createElement("div");
categorySpacer.classList.add("categorySpacer");
countryCategoryContainer.appendChild(categorySpacer);

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
} catch { }


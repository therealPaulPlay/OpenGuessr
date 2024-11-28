// Use this to present the player with a new location. This strongly depends on locationGeneration.js and generateLocation.js and feeds the generator with the right settings
import { timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { stopCompetitionTimer } from "$lib/logic/competitionLogic";
import { setCountryGuesserMode } from "$lib/utils/countryGuesserFunctions";
import { setImageGuesserMode } from "$lib/utils/imageGuesserFunctions";
import { multiplayer, competition, singleplayer } from "$lib/stores/modeStore";
import { generateNewLocation } from "$lib/utils/generateLocation";
import { isHost } from "$lib/stores/context-specific/multiplayerStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { countryMaps, continentMaps } from "$lib/stores/context-specific/officialMapsStore";
import { mapSupportsMultiplayer } from "$lib/utils/doesMapSupportMultiplayer";
import { changeCategory } from "$lib/utils/changeCategory";
import { checkCompetitionRoundStatus } from "$lib/logic/competitionLogic";
import { get } from "svelte/store";

// Check for Play URLs that include a map ---------------------------------------------------------------------------

let checkedForMapLink = false;

function checkLinkMap() {
    checkedForMapLink = true; // Only executes this once for the first generation

    try {
        let urlParams = new URLSearchParams(window.location.search);
        let mapFromLink = urlParams.get("play-map").toLowerCase();

        if (mapFromLink) {
            if (get(countryMaps).includes(mapFromLink) || get(continentMaps).includes(mapFromLink)) {
                changeCategory(mapFromLink);
            } else {
                errorPopup("Map not available", "Unfortunately, this map doesn't exist yet. It will likely be released in the future! Feel free to search for similar community maps.", "Map not found", false, true);
            }
        }

        history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
    } catch { }
}

// Location Generation with correct Type ---------------------------------------------------------------------------------------------------------

export async function checkGenerationTypeAndGenerate() {
    const mapCategory = localStorage.getItem("selectedCategory") || "standard";

    if (!checkedForMapLink) checkLinkMap();

    stopCompetitionTimer();
    timerText.set("00:00"); // Visually reset timer

    setCountryGuesserMode(false);
    setImageGuesserMode(false);

    if (!get(multiplayer) && !get(competition)) {
        singleplayer.set(true);

        // Pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "country_guesser" && mapCategory != "image_guesser" && !mapCategory.includes("community")) {
            await generateNewLocation("JSON");

        } else if (mapCategory == "country_guesser") {
            setCountryGuesserMode(true);
            await generateNewLocation("JSON");

        } else if (mapCategory == "image_guesser") {
            setImageGuesserMode(true);
            await generateNewLocation("JSON");

        } else if (mapCategory == "standard") {
            await generateNewLocation("SDK");

        } else if (mapCategory.includes("community")) {
            await generateNewLocation("COMMUNITY");

        } else {
            console.error("Incorrect mapCategory set in categoryMenu.js under checkGenerationTypeAndGenerate.")
        }
    } else if (get(multiplayer)) {
        singleplayer.set(false); // Don't apply singleplayer settings

        if (get(isHost)) {
            try {
                if (mapCategory && mapCategory != "standard" && mapSupportsMultiplayer(mapCategory) && !mapCategory.includes("community")) {
                    await generateNewLocation("JSON");
                } else if (mapCategory == "standard" || !mapCategory) {
                    await generateNewLocation("SDK");

                } else if (mapCategory.includes("community")) {
                    await generateNewLocation("COMMUNITY");

                } else {
                    // If the map category is an unsupported multiplayer category, such as hard, switch to standard
                    changeCategory("standard", true); // this will re-run checkGenerationTypeAndGenerate
                    setTimeout(function () {
                        errorPopup("Unsupported Multiplayer Map", "This map category is not available for multiplayer and was automatically changed to Standard.", "Map unsupported", false);
                    }, 3500);
                }

            } catch (error) {
                console.error("Error loading multiplayer location in newLocation. Error: ", error)
            }
        } else {
            await generateNewLocation("FROMHOST");
        }

    } else if (get(competition)) {
        singleplayer.set(false); // Don't apply singleplayer settings

        if (checkCompetitionRoundStatus(false)) {
            await generateNewLocation("COMPETITION");
        }
    }
}
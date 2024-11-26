// Use this to present the player with a new location. This strongly depends on locationGeneration.js and generateLocation.js and feeds the generator with the right settings
import { timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { stopCompetitionTimer } from "$lib/logic/competitionLogic";
import { setCountryGuesserMode } from "$lib/utils/countryGuesserFunctions";
import { setImageGuesserMode } from "$lib/utils/imageGuesserFunctions";
import { multiplayer, competition, singleplayer } from "$lib/stores/modeStore";
import { generateNewLocation } from "$lib/utils/generateLocation";
import { isHost } from "$lib/stores/context-specific/multiplayerStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { changeCategory } from "$lib/utils/changeCategory";
import { checkCompetitionRoundStatus } from "$lib/logic/competitionLogic";
import { get } from "svelte/store";

export async function checkGenerationTypeAndGenerate() {
    const mapCategory = localStorage.getItem("selectedCategory") || "standard";

    stopCompetitionTimer();
    timerText.set("00:00"); // Visually reset timer

    setCountryGuesserMode(false);
    setImageGuesserMode(false);

    if (!get(multiplayer) && !get(competition)) {
        singleplayer.set(true);

        // Pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "country" && mapCategory != "image" && !mapCategory.includes("community")) {
            await generateNewLocation("JSON");

        } else if (mapCategory == "country") {
            setCountryGuesserMode(true);
            await generateNewLocation("JSON");

        } else if (mapCategory == "image") {
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
        // If multiplayer is enabled
        singleplayer.set(false);

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
        singleplayer.set(false);

        if (checkCompetitionRoundStatus(false)) {
            await generateNewLocation("COMPETITION");
        }
    }
}
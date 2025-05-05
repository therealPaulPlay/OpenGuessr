// Use this to present the player with a new location. This strongly depends on locationGeneration.js and generateLocation.js and feeds the generator with the right settings
import { timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { stopCompetitionTimer } from "$lib/logic/competitionLogic";
import { setCountryGuesserMode } from "$lib/utils/countryGuesserFunctions";
import { setImageGuesserMode } from "$lib/utils/imageGuesserFunctions";
import { multiplayer, competition, singleplayer } from "$lib/stores/modeStore";
import { generateNewLocation } from "$lib/utils/generateLocation";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { countryMaps, continentMaps } from "$lib/stores/context-specific/officialMapsStore";
import { changeCategory } from "$lib/utils/changeCategory";
import { checkCompetitionRoundStatus } from "$lib/logic/competitionLogic";
import { get } from "svelte/store";
import { loadingScreenVisible } from "$lib/stores/uiStore";

// Check for Play URLs that include a map ---------------------------------------------------------------------------

let checkedForMapLink = false;

function checkLinkMap() {
    checkedForMapLink = true; // Only executes this once for the first generation

    try {
        let urlParams = new URLSearchParams(window.location.search);
        let mapFromLink = urlParams.get("play-map").toLowerCase().replaceAll("-", " ");

        if (mapFromLink) {
            if (get(countryMaps).includes(mapFromLink) || get(continentMaps).includes(mapFromLink)) {
                changeCategory(mapFromLink);
            } else {
                errorPopup("Map not available", "Unfortunately, this map doesn't exist yet. It will likely be released in the future! Feel free to search for similar community maps.", "Map not found", false, true);
            }
        }
    } catch { }
}

// Location Generation with correct Type ---------------------------------------------------------------------------------------------------------
let queue = Promise.resolve(); // Qeue handler

// Function to add a task to the queue
export async function checkGenerationTypeAndGenerate() {
  // Create a new promise that will only execute after the current queue is done
  queue = queue.then(async () => {
    try {
      // The actual function logic
      loadingScreenVisible.set(true); // Show loading screen
      if (!checkedForMapLink) checkLinkMap();
      const mapCategory = localStorage.getItem("selectedCategory") || "standard";
      // Competition timer reset
      stopCompetitionTimer();
      // Reset Mode specific UI
      setCountryGuesserMode(false);
      setImageGuesserMode(false);
      
      if (get(singleplayer)) {
        // Pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "country guessr" && mapCategory != "image guessr" && !mapCategory.includes("community")) {
          await generateNewLocation("JSON");
        } else if (mapCategory == "country guessr") {
          setCountryGuesserMode(true);
          await generateNewLocation("JSON");
        } else if (mapCategory == "image guessr") {
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
        if (get(socket)?.isHost) {
          try {
            if (mapCategory && mapCategory != "standard" && !mapCategory.includes("community")) {
              await generateNewLocation("JSON");
            } else if (mapCategory == "standard" || !mapCategory) {
              await generateNewLocation("SDK");
            } else if (mapCategory.includes("community")) {
              await generateNewLocation("COMMUNITY");
            }
          } catch (error) {
            console.error("Error loading multiplayer location in newLocation. Error: ", error)
          }
        } else {
          await generateNewLocation("FROMHOST");
        }
      } else if (get(competition)) {
        if (checkCompetitionRoundStatus()) await generateNewLocation("COMPETITION");
      }
    } catch (error) {
      console.error("Error in generation queue:", error);
    }
  });
  
  // Wait for the task to complete before returning
  return queue;
}
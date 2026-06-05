// Use this to present the player with a new location. This strongly depends on locationGeneration.js and generateLocation.js and feeds the generator with the right settings
import { enableImageGuessr } from "$lib/utils/imageGuesserFunctions";
import { multiplayer, competition, singleplayer, countryGuessr, imageGuessr } from "$lib/stores/modeStore";
import { generateNewLocation } from "$lib/utils/generateLocation";
import { multiplayerMap } from "$lib/stores/context-specific/multiplayerStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { countryMaps, continentMaps, defaultMap, tutorialMap } from "$lib/stores/context-specific/officialMapsStore";
import { changeMap } from "$lib/utils/changeMap";
import { checkCompetitionRoundStatus } from "$lib/logic/competitionLogic";
import { get } from "svelte/store";
import { loadingScreenVisible } from "$lib/stores/uiStore";

// Check for ?play-map= URLs that include a map ---------------------------------------------------------------------------
let checkedForMapLink = false;

function checkLinkMap() {
  checkedForMapLink = true; // Only executes this once for the first generation

  try {
    let urlParams = new URLSearchParams(window.location.search);
    let mapFromLink = urlParams.get("play-map").replaceAll("-", " ").replaceAll("_", " ");

    if (mapFromLink) {
      if (get(countryMaps).includes(mapFromLink) || get(continentMaps).includes(mapFromLink)) changeMap(mapFromLink);
      else errorPopup("Map not available", "Unfortunately, this map doesn't exist. Feel free to search for similar community maps.", "Map not found!");
    }
  } catch { }
}

// Check if selected map is tutorial (should reset to default if persisted on new pageload) -----------------------------------------------------
let checkedForTutorialMap = false;

function checkTutorialMap() {
  checkedForTutorialMap = true;
  // This happens if a user reloads in the middle of the tutorial (we don't want to keep the map as Tutorial)
  if (localStorage.getItem("selectedMap") == get(tutorialMap)) changeMap(get(defaultMap));
}

// Location Generation with correct Type ---------------------------------------------------------------------------------------------------------
let queue = Promise.resolve(); // Qeue handler

function disableMapSpecifics() {
  countryGuessr.set(false);
  imageGuessr.set(false);
}

function setMapSpecifics(map) {
  if (map == "Country Guessr") countryGuessr.set(true);
  if (map == "Image Guessr") {
    imageGuessr.set(true);
    enableImageGuessr(true);
  }
}

export async function checkGenerationTypeAndGenerate() {
  if (!checkedForMapLink) checkLinkMap();
  if (!checkedForTutorialMap) checkTutorialMap();

  // Create a new promise that will only execute after the current queue is done
  queue = queue.then(async () => {
    try {
      loadingScreenVisible.set(true); // Show loading screen
      const map = get(multiplayer) ? get(multiplayerMap) : (localStorage.getItem("selectedMap") || get(defaultMap));

      // Disable map-related modes (will be enabled later based on the map choice)
      disableMapSpecifics();

      // Singleplayer
      if (get(singleplayer)) {
        setMapSpecifics(map);
        await generateNewLocation("MAP");
      }

      // Multiplayer
      if (get(multiplayer)) {
        setMapSpecifics(map);
        generateNewLocation("MULTIPLAYER");
      }

      // Competition
      if (get(competition) && checkCompetitionRoundStatus()) await generateNewLocation("COMPETITION");

    } catch (error) {
      console.error("Error in location generation queue:", error);
    }
  });

  // Wait for the task to complete before returning
  return queue;
}
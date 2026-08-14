import { resultScreenEnabled, distanceText, motivationText, lastDistance } from "$lib/stores/context-specific/resultScreenStore";
import { calculateDistances, motivationalResultMessage, formatDistance } from "$lib/utils/distanceFunctions";
import { countryGuessr, singleplayer } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { loadResultScreenXP } from "$lib/logic/resultScoreLogic";
import { resetMap } from "$lib/logic/miniMap";
import { loadResultMap } from "$lib/logic/resultMap";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuessrFunctions";
import { earnedExperience } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";
import { showSlideup } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { supporterSlideupProbability } from "./showSupporterSlideup";
import { currentLocationHeading, currentLocationLatitude, currentLocationLongitude, currentLocationPanoramaId, currentLocationPitch } from "$lib/stores/locationStore";
import { checkDisplayFullscreenCelebration } from "./resultFullscreenCelebration";
import { mapExpanded, mapHovered, guessLat, guessLon } from "$lib/stores/context-specific/mapStore";
import { saveRoundToLog } from "./saveRoundToLog";
import { tutorial } from "$lib/stores/context-specific/tutorialStore";
import { discordSlideupProbability } from "./showDiscordSlideup";
import { isAuthenticated } from "$lib/stores/accountStore";

export async function enableResultScreen() {
    if (get(resultScreenEnabled)) return;
    resultScreenEnabled.set(true);

    // Obtain contents
    const distance = calculateDistances(get(guessLat), get(guessLon));
    lastDistance.set(distance);
    motivationText.set(motivationalResultMessage(distance));
    distanceText.set(get(countryGuessr) ? (checkIfGuessWasCorrect() ? "Correct!" : "Wrong!") : formatDistance(distance));

    // Reset the map (without changing its size or resetting the user guess) before loading the result map
    resetMap(true, true);

    // Save round to log
    saveRoundToLog(distance, [get(currentLocationLatitude), get(currentLocationLongitude), { heading: get(currentLocationHeading), pitch: get(currentLocationPitch), panoramaId: get(currentLocationPanoramaId) }]);

    // Load result on the map
    loadResultMap(get(guessLat), get(guessLon), get(currentLocationLatitude), get(currentLocationLongitude));
    playSound("confirm");

    // CTAs
    if (!get(tutorial) && get(isAuthenticated)) discordSlideupProbability(); // Not shown in tutorial, and only to authed users
    if (!get(tutorial) && get(singleplayer)) supporterSlideupProbability(); // Not shown in tutorial, and only in singleplayer (checkout flow would take too long for mid-multiplayer or comp)

    // Load XP
    await loadResultScreenXP(distance);
    checkDisplayFullscreenCelebration();
}

export function disableResultScreen() {
    if (!get(resultScreenEnabled)) return;
    resultScreenEnabled.set(false);

    // UI resets
    showSlideup.set(false);
    earnedExperience.set(0); // Reset per-round earned XP

    // Map resets
    if (window.matchMedia("(orientation: portrait) and (max-width: 800px)").matches) mapExpanded.set(false); // On mobile, collapse map
    mapHovered.set(false); // Revoke map hover state
    resetMap(); // Reset the map for the next round
}
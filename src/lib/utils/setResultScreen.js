import { resultScreenEnabled, distanceText, motivationText } from "$lib/stores/context-specific/resultScreenStore";
import { calculateDistances, motivationalResultMessage, formatDistance } from "$lib/utils/distanceFunctions";
import { countryGuessr } from "$lib/stores/modeStore";
import { selectedCountryGuesserCountry } from "$lib/stores/context-specific/countryGuessrStore";
import { refreshPlacements } from "$lib/utils/ads";
import { playSound } from "$lib/utils/soundManager";
import { loadResultScreenXP } from "$lib/logic/resultScoreLogic";
import { resetMap } from "$lib/logic/miniMap";
import { loadResultMap } from "$lib/logic/resultMap";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuessrFunctions";
import { earnedExperience } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";
import { shrinkMapIfMobile } from "./shrinkMinimapIfMobile";
import { timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { showSlideup } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { supporterSlideupProbability } from "./showSupporterSlideup";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { checkDisplayFullscreenCelebration } from "./resultFullscreenCelebration";

export async function enableResultScreen(guessLat = 0, guessLong = 0) {
    if (!get(resultScreenEnabled)) {
        resultScreenEnabled.set(true);

        // Obtain contents
        const distance = calculateDistances(guessLat, guessLong);
        const motivationalMessage = motivationalResultMessage(distance);
        const resultString = formatDistance(distance);

        // Reset the map, before loading the result map
        resetMap(true);

        motivationText.set(motivationalMessage);
        distanceText.set(resultString);

        if (get(countryGuessr)) {
            if (checkIfGuessWasCorrect()) distanceText.set("Correct!");
            else distanceText.set("Wrong!");
        }

        // Load result on the map
        loadResultMap(guessLat, guessLong, get(currentLocationLatitude), get(currentLocationLongitude));
        playSound("confirm");
        refreshPlacements();

        // Load XP
        await loadResultScreenXP(distance);
        if (!get(showSlideup)) supporterSlideupProbability();
        checkDisplayFullscreenCelebration();
    }
}

export function disableResultScreen() {
    if (get(resultScreenEnabled)) {
        resultScreenEnabled.set(false);
        refreshPlacements();

        // UI resets
        shrinkMapIfMobile();
        showSlideup.set(false);
        timerText.set("00:00"); // Reset timer text

        earnedExperience.set(0); // Reset earned experience
        resetMap(); // Reset the map for the next round
    }
}
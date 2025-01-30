import { resultScreenEnabled, distanceText, motivationText } from "$lib/stores/context-specific/resultScreenStore";
import { calculateDistances, compareDistances } from "$lib/utils/distanceFunctions";
import { countryGuesser } from "$lib/stores/modeStore";
import { selectedCountryGuesserCountry } from "$lib/stores/context-specific/countryGuesserStore";
import { refreshPlacements } from "$lib/utils/ads";
import { playSound } from "$lib/utils/soundManager";
import { loadResultScreenXP } from "$lib/logic/resultScoreLogic";
import { resetMap } from "$lib/logic/miniMap";
import { loadResultMap } from "$lib/logic/resultMap";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuesserFunctions";
import { earnedExperience } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";
import { shrinkMapIfMobile } from "./shrinkMinimapIfMobile";
import { toggleStreakRestoreWindow } from "$lib/stores/context-specific/toggleStreakRestoreStore";
import { timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";

export function enableResultScreen(guessLat = 0, guessLong = 0) {
    if (!get(resultScreenEnabled)) {
        resultScreenEnabled.set(true);

        // Obtain contents
        const distance = calculateDistances(guessLat, guessLong);
        const resultStrings = compareDistances(distance) || {};
        let resultString = resultStrings.resultAsString;
        let extraMessage = resultStrings.extraMsg;

        loadResultScreenXP(distance);

        // Reset the map, before loading the result map
        resetMap(true);

        distanceText.set(resultString);
        motivationText.set(extraMessage);

        if (get(countryGuesser)) {
            if (checkIfGuessWasCorrect()) {
                distanceText.set("Correct!");
                motivationText.set("The country is " + get(selectedCountryGuesserCountry) + ".");
            } else {
                distanceText.set("Wrong!");
                motivationText.set("The country was " + get(selectedCountryGuesserCountry) + ".");
            }
        }

        // Load result on the map
        loadResultMap(guessLat, guessLong);
        playSound("confirm");
        refreshPlacements();
    }
}

export function disableResultScreen() {
    if (get(resultScreenEnabled)) {
        resultScreenEnabled.set(false);
        refreshPlacements();

        // UI resets
        shrinkMapIfMobile();
        get(toggleStreakRestoreWindow)(0, true);
        timerText.set("00:00"); // Reset timer text

        earnedExperience.set(0); // Reset the earned experience, to trigger a new "tick up" animation on the next result load
        resetMap(); // Reset the map for the next round
    }
}
import { resultScreenEnabled, distanceText, motivationText } from "$lib/stores/context-specific/resultScreenStore";
import { calculateDistances, compareDistances } from "$lib/utils/distanceFunctions";
import { countryGuesser } from "$lib/stores/modeStore";
import { selectedCountryGuesserCountry } from "$lib/stores/context-specific/countryGuesserStore";
import { refreshPlacements } from "$lib/utils/ads";
import { playSound } from "$lib/utils/soundManager";
import { get } from "svelte/store";
// !TODO !CHANGE import resetMap() here
// !TODO !CHANGE import loadResultMap() here
// !TODO !CHANGE import loadResultScreenXP here

export function enableResultScreen(guessLat, guessLong) {
    if (!get(resultScreenEnabled)) {

        // Error proofing in case they are not defined
        guessLat = guessLat || 0;
        guessLong = guessLong || 0;

        // Obtain contents
        const distance = calculateDistances(guessLat, guessLong);
        const resultStrings = compareDistances(distance);
        let resultString = resultStrings.resultAsString;
        let extraMessage = resultStrings.extraMsg;

        refreshPlacements();
        loadResultScreenXP(distance);

        // Reset the map, before loading the result map
        resetMap();

        distanceText.set(resultString);
        motivationText.set(extraMessage);

        if (get(countryGuesser)) {
            if (checkIfGuessWasCorrect()) {
                document.getElementById("distanceText").innerText = "Correct!";
                document.getElementById("motivationText").innerText = "The country is " + get(selectedCountryGuesserCountry) + ".";
            } else {
                document.getElementById("distanceText").innerText = "Wrong!";
                document.getElementById("motivationText").innerText = "The country was " + get(selectedCountryGuesserCountry) + ".";
            }
        }

        // Load result on the map
        loadResultMap(guessLat, guessLong);

        playSound("confirm");

        resultScreenEnabled.set(true);
    } else {
        console.error("Result screen already enabled!");
    }
}

export function disableResultScreen() {
    if (get(resultScreenEnabled)) {
        resultScreenEnabled.set(false);
        refreshPlacements();

        resetMap(); // Reset the map for the next round
    } else {
        console.warn("Result screen already disabled.");
    }
}
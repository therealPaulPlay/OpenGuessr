// Gamemode where you guess the country (not on the map)
import { countryGuessrCountriesArray, selectedCountryField, selectedCountryGuesserCountry } from "$lib/stores/context-specific/countryGuessrStore";
import { get } from "svelte/store";
import { countryGuessr, singleplayer } from "$lib/stores/modeStore";

let correctCountryIndex = null; // 1-6

export function checkIfGuessWasCorrect() {
    return correctCountryIndex == get(selectedCountryField);
}

export async function setCountryGuesserCountry(country) {
    if (!countryCodes) await loadCountryCodes();

    selectedCountryGuesserCountry.set(country);// This can be "South Africa", "United States", "India" and so on
    selectedCountryField.set(0); // Clear country field selection
    countryGuessrCountriesArray.set([]); // Clear countries array

    try {
        let takenLocations = []; // To avoid duplicates amongst the 6 random / wrong ones (one of them will be replaced by the correct one)

        for (let i = 1; i <= 6; i++) {
            let randomCountryIndex = Math.floor(Math.random() * Object.keys(countryCodes).length);
            let countryObject = {};

            // Avoid duplicates and avoid a random country matching the corect country
            while (Object.keys(countryCodes)[randomCountryIndex] == get(selectedCountryGuesserCountry) || takenLocations.includes(Object.keys(countryCodes)[randomCountryIndex])) {
                randomCountryIndex = Math.floor(Math.random() * Object.keys(countryCodes).length);
            }

            const countryName = Object.keys(countryCodes)[randomCountryIndex];
            countryObject.name = countryName.length > 17 ? countryName.slice(0, 14) + "..." : countryName;
            countryObject.flag = countryCodes[countryName];

            takenLocations.push(countryName);
            countryGuessrCountriesArray.update((value) => {
                value.push(countryObject);
                return value;
            });
        }

        // Now make one of them the actual answer (index 0-5)
        correctCountryIndex = Math.floor(Math.random() * 6);
        let correctCountryObject = {};

        const countryName = get(selectedCountryGuesserCountry);
        correctCountryObject.name = countryName.length > 17 ? countryName.slice(0, 14) + "..." : countryName;
        correctCountryObject.flag = countryCodes[countryName];

        countryGuessrCountriesArray.update((value) => {
            value[correctCountryIndex] = correctCountryObject;
            return value;
        });

    } catch (error) {
        console.error("Error generating random category options in countryGuesser.js: " + error);
    }
}

// Codes --------------------------------------------------------------------------------------------------------
let countryCodes;

async function loadCountryCodes() {
    try {
        const countryCodesResponse = await fetch("/json/country-codes/countryCodes.json");
        countryCodes = await countryCodesResponse.json().then((response) => response.countryCodes);
    } catch (error) {
        console.error("Error loading country codes:", error);
    }
}

// If the mode isn't singleplayer, disable ---------------------
// While countryGuessr is being disabled in the map generation, in a multiplayer game that hasn't started yet it'd still show the country picker
singleplayer.subscribe((value) => {
    if (!value) countryGuessr.set(false);
});
// Gamemode where you guess the country (not on the map)
import { countryGuessrCountriesArray, selectedCountryFieldIndex, selectedCountryGuesserCountryCode } from "$lib/stores/context-specific/countryGuessrStore";
import { get } from "svelte/store";
import { countryGuessr, singleplayer } from "$lib/stores/modeStore";
import { getCountryName } from "$lib/utils/getCountryName";

let correctCountryIndex = null; // 1-6

export function checkIfGuessWasCorrect() {
    return correctCountryIndex == get(selectedCountryFieldIndex);
}

export async function setCountryGuesserCountry(country) {
    if (!countryCodes) await loadCountryCodes();

    selectedCountryGuesserCountryCode.set(country); // ISO code of the correct country, e.g. "ZA", "US", "IN"
    selectedCountryFieldIndex.set(0); // Clear country field selection
    countryGuessrCountriesArray.set([]); // Clear countries array

    try {
        let takenLocations = []; // To avoid duplicates amongst the 6 random / wrong ones (one of them will be replaced by the correct one)

        for (let i = 1; i <= 6; i++) {
            let randomCountryIndex = Math.floor(Math.random() * countryCodes.length);

            // Avoid duplicates and avoid a random country matching the corect country
            while (countryCodes[randomCountryIndex] == get(selectedCountryGuesserCountryCode) || takenLocations.includes(countryCodes[randomCountryIndex])) {
                randomCountryIndex = Math.floor(Math.random() * countryCodes.length);
            }

            const code = countryCodes[randomCountryIndex];
            takenLocations.push(code);

            const name = getCountryName(code) || "Unknown";
            countryGuessrCountriesArray.update((value) => {
                value.push({
                    name: name.length > 17 ? name.slice(0, 14) + "..." : name,
                    flag: code.charAt(0).toUpperCase() + code.slice(1).toLowerCase(), // ISO -> svelte-flag-icons key
                });
                return value;
            });
        }

        // Now make one of them the actual answer (index 0-5)
        correctCountryIndex = Math.floor(Math.random() * 6);

        const correctCode = get(selectedCountryGuesserCountryCode);
        const correctName = getCountryName(correctCode) || "Unknown";
        countryGuessrCountriesArray.update((value) => {
            value[correctCountryIndex] = {
                name: correctName.length > 17 ? correctName.slice(0, 14) + "..." : correctName,
                flag: correctCode.charAt(0).toUpperCase() + correctCode.slice(1).toLowerCase(),
            };
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
        const countryCodesResponse = await fetch("/json/country-codes/country-codes.json");
        countryCodes = await countryCodesResponse.json();
    } catch (error) {
        console.error("Error loading country codes:", error);
    }
}

// If the mode isn't singleplayer, disable ---------------------
// While countryGuessr is being disabled in the map generation, in a multiplayer game that hasn't started yet it'd still show the country picker
singleplayer.subscribe((value) => {
    if (!value) countryGuessr.set(false);
});
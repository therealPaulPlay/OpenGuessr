// Gamemode where you guess the country (not on the map)
import { mapVisible } from "$lib/stores/context-specific/mapStore";
import { multiplayer, countryGuessr } from "$lib/stores/modeStore";
import { selectedCountryField, selectedCountryGuesserCountry } from "$lib/stores/context-specific/countryGuesserStore";
import { get } from "svelte/store";

let correctCountryField = null; // 1-6

export function setCountryGuesserMode(enabled) {
    if (enabled) {
        countryGuessr.set(true);
        
        // hide map
        if (!get(multiplayer)) {
            mapVisible.set(false);
        }

    } else {
        countryGuessr.set(false);

        // show map
        if (!get(multiplayer)) {
            mapVisible.set(true);
        }
    }
}

export function checkIfGuessWasCorrect() {
    if (correctCountryField == get(selectedCountryField)) {
        return true;
    } else {
        return false;
    }
}

export async function setCountryGuesserCountry(country) {
    if (!countryEmojis) await loadCountryEmojis();

    selectedCountryGuesserCountry.set(country);// This can be "South Africa", "United States", "India" and so on. Data was received by Nominatium API (which cannot be used in prod)
    selectedCountryField.set(0); // Clear country field selection

    try {
        if (get(countryGuessr)) {
            let takenLocations = []; // To avoid duplicates amongst the 6 random / wrong ones (one of them will be replaced by the correct one)
            for (let i = 1; i <= 6; i++) {
                let countryItem = document.getElementById("countryTag" + i);
                let countryFlag = document.getElementById("countryFlag" + i);
                let randomCountryIndex = Math.floor(Math.random() * Object.keys(countryEmojis).length);

                // Avoid duplicates and avoid a random country matching the corect country
                while (Object.keys(countryEmojis)[randomCountryIndex] == get(selectedCountryGuesserCountry) || takenLocations.includes(Object.keys(countryEmojis)[randomCountryIndex])) {
                    randomCountryIndex = Math.floor(Math.random() * Object.keys(countryEmojis).length);
                }

                const countryName = Object.keys(countryEmojis)[randomCountryIndex];

                countryItem.textContent = countryName;
                countryFlag.textContent = countryEmojis[countryName];

                takenLocations.push(countryName);

                if (countryName.length > 17) {
                    countryItem.textContent = countryName.slice(0, 14) + "...";
                }
            }

            // Now make one of them the actual answer (1-6)
            correctCountryField = Math.floor(Math.random() * 6) + 1;
            let countryItem = document.getElementById("countryTag" + correctCountryField);
            let countryFlag = document.getElementById("countryFlag" + correctCountryField);

            const countryName = get(selectedCountryGuesserCountry);

            countryItem.textContent = countryName;
            countryFlag.textContent = countryEmojis[countryName];

            if (countryName.length > 17) {
                countryItem.textContent = countryName.slice(0, 14) + "...";
            }

        }
    } catch (error) {
        console.error("Error generating random category options in countryGuesser.js: " + error);
    }
}

// Country emojis --------------------------------------------------------------------------------------------------------
let countryEmojis;

async function loadCountryEmojis() {
    try {
        const countryEmojisResponse = await fetch("/json/country-emojis/countryEmojis.json");
        countryEmojis = await countryEmojisResponse.json().then((response) => response.countryEmojis);
    } catch (error) {
        console.error("Error loading country emojis:", error);
    }
}
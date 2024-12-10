import { errorPopup } from "$lib/utils/errorHandling";
import { coordsFromHost } from "$lib/stores/context-specific/multiplayerStore";
import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import { currentlyLoadedLocationsArray } from "$lib/stores/locationStore.js";
import { loadingScreenVisible } from "$lib/stores/uiStore.js";
import { get } from "svelte/store";

// This is THE function to get locations (all others here are NOT export) - not the functino to start a new round! (look for newLocation.js for that)
export async function getLocationCoordinates(type) {

    // Show loading screen
    loadingScreenVisible.set(true);

    if (type == "JSON") {
        return await getJSONCoords(localStorage.getItem("selectedCategory"));
    } else if (type == "SDK") {
        return await getCoordsFromLocationServer();
    } else if (type == "FROMHOST") {
        return get(coordsFromHost);
    } else if (type == "COMMUNITY") {
        return await getCommunityMapCoordinates();
    } else if (type == "COMPETITION") {
        return await getCompetitionCoordinates();
    } else {
        console.error("Incorrect Location type set in locationGeneration.js");
    }
}

let loadedMapCategory;
let previousGuessesIndexes = [];

// Get Location from JSON (Legacy/Custom Map creation method) ----------------------------------------------------------------------------------------------------

// Load location JSON files
async function getJSONCoords(category) {
    if (loadedMapCategory !== category) {
        try {
            let response = null;
            loadedMapCategory = category;
            previousGuessesIndexes = [];

            response = await fetch("/json/" + category + "Locations.json");

            if (!response.ok) {
                throw new Error("JSON fetch failed.");
            }

            const jsonResponse = await response.json();
            currentlyLoadedLocationsArray.set(jsonResponse.locations);
            return pickRandomLocations();

        } catch (error) {
            //choose standard and instantly reload (if categories get renamed / get deleted-> this happens)
            localStorage.setItem("selectedCategory", "standard");
            window.location.reload();
            console.error(error);
        }
    } else {
        return pickRandomLocations();
    }
}


// Get Locations from google maps js API node.js SERVER (new method - unlimited locations) -------------------------------------------------------------------------------

async function getCoordsFromLocationServer() {
    if (loadedMapCategory !== "standard") {
        try {
            previousGuessesIndexes = [];
            loadedMapCategory = "standard";
            let locationEndpoint = "https://locations.openguessr.com/locations";

            // Create an AbortController for the timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); // timeout

            try {
                const response = await fetch(locationEndpoint, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                });

                // Clear the timeout since we got a response
                clearTimeout(timeoutId);

                // Check if the response is successful
                if (response.ok) {
                    const data = await response.json();
                    const standardLocations = data.locations;
                    currentlyLoadedLocationsArray.set(standardLocations);
                    return pickRandomLocations();
                } else {
                    console.error("Location fetch failed. Server returned error:", response.status);
                    return await loadBackupLocations(response.status);
                }
            } catch (error) {
                // Clear the timeout in case of error
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    console.error("Request timed out.");
                    return await loadBackupLocations("Request timeout");
                }
                throw error; // Re-throw other errors to be caught by outer try-catch
            }
        } catch (error) {
            console.error("Error occurred while fetching locations from server: ", error);
            return await loadBackupLocations(error);
        }
    } else {
        return pickRandomLocations();
    }
}

// in case the location server does not respond, load the backup, formerly daily locations (just totally random locations) instead
async function loadBackupLocations(error) {
    console.log("Loading backup locations.");
    errorPopup("Location server error", "Loading local backup locations instead. ", "Error: " + error);

    return await getJSONCoords("backup");
}

// Get community map coordinates ---------------------------------------------------------------------------

async function getCommunityMapCoordinates() {

    if (loadedMapCategory !== localStorage.getItem("selectedCategory")) {
        try {
            const response = await fetch("https://maps.openguessr.com/maps/" + localStorage.getItem("selectedCategory").replace("community_", ""), {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            // Check if the response is successful
            if (response.ok) {
                const data = await response.json();
                loadedMapCategory = localStorage.getItem("selectedCategory");
                previousGuessesIndexes = [];
                currentlyLoadedLocationsArray.set(data.map_data.locations); // the array is in locations: {}
                return pickRandomLocations(); // pick one new location for playing

            } else {
                console.error("Community map fetch failed. Server returned error:", response.status);
                if (response.status == 404) {
                    errorPopup("Community map was deleted", "This map was likely deleted and cannot be found.", response.status, true);
                } else {
                    errorPopup("Error loading community map", "An error occured on the maps server.", response.status, true);
                }
                return null;
            }
        } catch (error) {
            console.error("Error occurred while fetching map from server: ", error);
            errorPopup("Error loading community map", "The maps server can't be reached.", error, true);
            return null;
        }
    } else {
        return pickRandomLocations(); // pick one new location for playing
    }
}

// Universal function to pick random coordinates ---------------------------------------------------------------------------

function pickRandomLocations() {
    let resultLocationsArray = [];
    let guessIndex;

    try {

        do {
            guessIndex = Math.floor(Math.random() * get(currentlyLoadedLocationsArray)?.length);
        } while (previousGuessesIndexes.includes(guessIndex));

        previousGuessesIndexes.unshift(guessIndex); // add guessIndex at the front of the array

        if (previousGuessesIndexes.length > previousGuessesIndexes.length / 2) {
            previousGuessesIndexes.pop(); // if the array is longer than half of the total amount, pop last one out
        }

        const resultLat = Number(get(currentlyLoadedLocationsArray)[guessIndex][0]);
        const resultLong = Number(get(currentlyLoadedLocationsArray)[guessIndex][1]);
        const additionalProperty = get(currentlyLoadedLocationsArray)[guessIndex][2]; // only available for certain modes (like country guesser, image guesser..). This could be the country, the image URL etc.

        resultLocationsArray = [resultLat, resultLong, additionalProperty];
    } catch (error) {
        console.error("Error picking random locations in locationGeneration.js: " + error);
    }

    return resultLocationsArray;
}

// Get Competition coordinates ---------------------------------------------------------------------------------------------

async function getCompetitionCoordinates() {
    let resultLocationsArray = [];

    try {
        const resultLat = get(competitionData)?.locations[get(competitionRound)][0];
        const resultLong = get(competitionData)?.locations[get(competitionRound)][1];

        resultLocationsArray = [resultLat, resultLong];
    } catch (error) {
        console.error("Error in locationGeneration.js in getCompetitionCoordinates: " + error);
    }

    return resultLocationsArray;
}
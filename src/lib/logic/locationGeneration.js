import { errorPopup } from "$lib/utils/errorHandling";
import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import { currentlyLoadedLocationsArray } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { peer } from "$lib/stores/context-specific/multiplayerStore";
import { changeCategory } from "$lib/utils/changeCategory";

// This is THE function to get locations (all others here are NOT export) - not the functino to start a new round! (look for newLocation.js for that)
export async function getLocationCoordinates(type) {
    if (type == "JSON") {
        return await getJSONCoords(localStorage.getItem("selectedCategory"));
    } else if (type == "SDK") {
        return await getCoordsFromLocationServer();
    } else if (type == "FROMHOST") {
        return get(peer)?.getStorage?.location;
    } else if (type == "COMMUNITY") {
        return await getCommunityMapCoordinates();
    } else if (type == "COMPETITION") {
        return await getCompetitionCoordinates();
    } else {
        console.error("Incorrect Location type set in locationGeneration.js");
    }
}

let loadedMapCategory; // Exclusive to location generation, not a general variable!
let previousGuessesIndexes = [];

// Get Location from JSON (Legacy/Custom Map creation method) ----------------------------------------------------------------------------------------------------

// Load location JSON files
async function getJSONCoords(category) {
    if (loadedMapCategory !== category) {
        try {
            let response = null;
            loadedMapCategory = category;
            previousGuessesIndexes = [];

            response = await fetch("/json/" + category.replaceAll(" ", "_") + "Locations.json");
            if (!response.ok) throw new Error("JSON fetch failed.");

            const jsonResponse = await response.json();
            currentlyLoadedLocationsArray.set(jsonResponse.locations);
            return pickRandomLocations();

        } catch (error) {
            console.error(error);
            // Choose standard and refresh (happens e.g. if categories are renamed)
            changeCategory("standard", true);
            console.warning("Switching to standard as category wasn't found...");
        }
    } else {
        return pickRandomLocations();
    }
}

// Get Locations from google maps js API node.js SERVER (new method - unlimited locations) -------------------------------------------------------------------------------

const locationEndpoint = "https://locations.openguessr.com/locations-batch";
const locationLengthEndpoint = "https://locations.openguessr.com/location-length";
let cachedLocations = [];

async function getCoordsFromLocationServer() {
    try {
        if (loadedMapCategory !== "standard") {
            previousGuessesIndexes = [];
            loadedMapCategory = "standard";
            currentlyLoadedLocationsArray.set([]); // Empty for default boundaries
        }

        // If cache is empty, fetch 5 new locations
        if (cachedLocations.length === 0) {
            const totalAmount = await getStandardLocationAmount();
            const indexes = Array.from({ length: 5 }, () => getUniqueLocationIndex(totalAmount));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500); // Abort slow requests

            try {
                const response = await fetch(`${locationEndpoint}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ indexes }),
                    signal: controller.signal
                });

                if (response.ok) {
                    const data = await response.json();
                    cachedLocations = data.locations;
                } else {
                    throw new Error("Location fetch failed. Server returned error: " + response.status);
                }
            } finally {
                clearTimeout(timeoutId);
            }
        }

        // Return and remove one location from cache
        if (cachedLocations.length > 0) {
            const location = cachedLocations.shift();
            const resultLat = Number(location[0]);
            const resultLong = Number(location[1]);
            return [resultLat, resultLong];
        } else {
            throw new Error("No locations available in cache!");
        }
    } catch (error) {
        console.error("Error occurred while fetching locations from server: ", error);
        return await loadBackupLocations(error);
    }
}

let standardLocationAmount;

async function getStandardLocationAmount() {
    if (!standardLocationAmount) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // timeout

        try {
            const response = await fetch(locationLengthEndpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });

            // Clear the timeout since we got a response
            clearTimeout(timeoutId);

            // Check if the response is successful
            if (response.ok) {
                const data = await response.json();
                standardLocationAmount = Number(data?.length);
            } else {
                throw new Error("Standard location amount returned not-okay status: " + response.status);
            }
        } catch (error) {
            throw new Error("Error occured fetching standard location amount: " + error); // Re-throw
        } finally {
            clearTimeout(timeoutId);
        }
    }

    return standardLocationAmount;
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
            const response = await fetch("https://accounts.openguessr.com/maps/" + localStorage.getItem("selectedCategory").replace("community_", ""), {
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
                if (response.status == 404) errorPopup("Community map was deleted", "This map was likely deleted and cannot be found.", response.status, true);
                if (response.status != 404) errorPopup("Error loading community map", "An error occured on the maps server.", response.status, true);
                return [];
            }
        } catch (error) {
            console.error("Error occurred while fetching map from server: ", error);
            errorPopup("Error loading community map", "The maps server can't be reached.", error, true);
            return [];
        }
    } else {
        return pickRandomLocations(); // pick one new location for playing
    }
}

// Universal function to pick random coordinates ---------------------------------------------------------------------------

function pickRandomLocations() {
    try {
        let guessIndex = getUniqueLocationIndex(get(currentlyLoadedLocationsArray)?.length);

        const resultLat = Number(get(currentlyLoadedLocationsArray)[guessIndex][0]);
        const resultLong = Number(get(currentlyLoadedLocationsArray)[guessIndex][1]);
        const additionalProperty = get(currentlyLoadedLocationsArray)[guessIndex][2]; // only available for certain modes (like country guessr, image guessr..). This could be the country, the image URL etc.
        return [resultLat, resultLong, additionalProperty];
    } catch (error) {
        console.error("Error picking random locations in locationGeneration.js: " + error);
        return [];
    }
}

function getUniqueLocationIndex(locationAmount) {
    let index;
    do {
        index = Math.floor(Math.random() * locationAmount);
    } while (previousGuessesIndexes.includes(index));

    previousGuessesIndexes.unshift(index); // add guessIndex at the front of the array

    // if the array is longer than half of the total amount, pop last one out
    if (previousGuessesIndexes.length > locationAmount / 2) previousGuessesIndexes.pop();
    return index;
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
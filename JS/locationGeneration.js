import { errorPopup } from "./errorHandling.js";
import { generateNewLocation } from "./main.js";
import { coordsFromHost } from "./multiplayer.js";
import { mapCategory } from "./categoryMenu.js";
import { Loader } from "@googlemaps/js-api-loader";
import { getDailyChallengeIndex } from "./userAPI.js";

//This is THE function to GET LOCATIONS (all others here are NOT export)
export async function getLocationCoordinates(type) {

    //show loading screen
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";

    if (type == "JSON") {
        try { return await getCoordsFromJSON(); } catch (err) { console.error("Error generating from JSON in locationGeneration.js: " + err); }
    } else if (type == "SDK" && type != "DAILY") {
        return await getCoordsFromGoogle();
    } else if (type == "DAILY") {
        return await getCoordsFromServerDaily();
    } else if (type == "FROMHOST") {
        return coordsFromHost;
    } else {
        console.error("Incorrect Location type set in locationGeneration.js");
    }
}


//Get Location from JSON (Legacy/Custom Map creation method) ----------------------------------------------------------------------------------------------------
let listOfLocations = [];
let jsonResponse;
let lastGuessesIndexes = []; //to prevent repetition
let currentlyLoadedJson;


//Load location JSON files
async function loadLocationJSON(jsonName) {
    if (currentlyLoadedJson != jsonName) {
        try {
            let response = await fetch("./JSON/" + jsonName + "Locations.json");

            if (!response.ok) {
                throw new Error("JSON fetch failed.");
            }

            jsonResponse = await response.json();
            currentlyLoadedJson = jsonName; //set currently loaded json to the new one
            lastGuessesIndexes = []; //reset previously played indexes
            listOfLocations = jsonResponse;

        } catch (error) {
            errorPopup("JSON error", "There was an error loading the location json file.", "JSON Fetch failed.", true);
            console.error(error);
        }
    }
}

let guessIndex;

//This will be called in main.js when a new location is being generated
async function getCoordsFromJSON() {

    let resultLocationsArray;

    if (currentlyLoadedJson != mapCategory) {
        await loadLocationJSON(mapCategory);
    }

    try {

        //to prevent a crashes if the json has too few locations
        if (listOfLocations.length < 15) {
            lastGuessesIndexes = [];
            console.warn("Loaded json has too few locations!");
        }

        do {
            guessIndex = Math.floor(Math.random() * listOfLocations.length);
        } while (lastGuessesIndexes.includes(guessIndex));

        lastGuessesIndexes.unshift(guessIndex); //add guessIndex at the front of the array

        if (lastGuessesIndexes.length > 10) {
            lastGuessesIndexes.pop(); //if the array is longer than 10, pop the last entry out
        }

        const resultLat = listOfLocations[guessIndex][0];
        const resultLong = listOfLocations[guessIndex][1];
        const country = listOfLocations[guessIndex][2]; //only available for certain modes (like country guesser)

        resultLocationsArray = [resultLat, resultLong, country];
    } catch (error) {
        console.error("Error in locationGeneration.js during JSON Gen: " + error);
    }

    return resultLocationsArray;
}


//Get Locations from google maps js API (new method - unlimited locations) -------------------------------------------------------------------------------

// not using any apiKey!
const loader = new Loader({
    version: "weekly",
    libraries: ["streetView"]
});

let streetViewService;

// Return a promise that resolves when streetViewService is initialized
const initStreetViewService = () => {
    return new Promise((resolve, reject) => {
        loader.load().then(() => {
            // Initialize streetViewService
            streetViewService = new google.maps.StreetViewService();
            resolve();
        }).catch(error => {
            console.error("Error loading Google Maps API:", error);
            reject(error);
        });
    });
};

initStreetViewService().then(() => {
    getCoordsFromGoogle();
});

async function getLocationData(latitude, longitude, radius) {
    // Wait for streetViewService to be initialized
    await initStreetViewService();

    if (!streetViewService) {
        console.error("StreetViewService is not initialized.");
        return null;
    }

    return new Promise((resolve, reject) => {
        streetViewService.getPanorama({
            location: { lat: latitude, lng: longitude },
            preference: google.maps.StreetViewPreference.BEST, // Prioritize locations closer to roads and cities
            radius: radius,
            sources: [google.maps.StreetViewSource.OUTDOOR]
        }, (data, status) => {
            if (status === "OK") {
                const location = data.location.latLng;

                const resultLat = location.lat();
                const resultLng = location.lng();
                const resultLocationsArray = [resultLat, resultLng];
                resolve(resultLocationsArray);
            } else {
                reject(status);
            }
        });
    });
}

async function getCoordsFromGoogle(retryCount = 0) {
    // Randomize latitude and longitude coordinates
    const { lat, lng } = getRandomSphericalCoordinates();
    const searchRadius = 50000; // Adjust radius as needed

    try {
        // Attempt to get location data
        const resultLocationsArray = await getLocationData(lat, lng, searchRadius);
        return resultLocationsArray;
    } catch (error) {
        if (error === "ZERO_RESULTS") {
            // Retry if ZERO_RESULTS is returned
            if (retryCount < 1000) {
                return await getCoordsFromGoogle(retryCount + 1);
            } else {
                console.error("Maximum retry limit reached.");
                errorPopup("No location found.", "Reload the page or switch to a different category", "Google SDK failed to find a location", false);
                return null;
            }
        } else {
            console.error("Error getting coordinates from Google:", error);
            return null;
        }
    }
}

function getRandomSphericalCoordinates() {
    const latRadians = Math.acos(2 * Math.random() - 1) - Math.PI / 2;

    const lngRadians = 2 * Math.PI * Math.random() - Math.PI;

    const lat = (180 / Math.PI) * latRadians;
    const lng = (180 / Math.PI) * lngRadians;

    return { lat, lng };
}

//Get coords from Server for Daily Challenge -----------------------------------------------------------------------------------------------------------------------

async function getCoordsFromServerDaily() {
    //Load location JSON files
    try {
        let response = await fetch("./JSON/dailyLocations.json");

        jsonResponse = await response.json();
        listOfLocations = jsonResponse;

    } catch (error) {
        errorPopup("JSON error", "There was an error loading the location json file.", "JSON Fetch failed.", true);
        console.error(error);
    }

    try {
        let dailyChallengeCoordinatesIndex = await getDailyChallengeIndex(listOfLocations.length);

        const resultLat = listOfLocations[dailyChallengeCoordinatesIndex][0];
        const resultLong = listOfLocations[dailyChallengeCoordinatesIndex][1];

        let resultLocationsArray = [resultLat, resultLong];

        return resultLocationsArray;
    } catch {
        errorPopup("Challenge API Error", "There was an error fetching the daily challenge location", "Challenge Fetch failed.", true);
        return null;
    }
}
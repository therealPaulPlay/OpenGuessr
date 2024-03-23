import { errorPopup } from "./errorHandling.js";
import { generateNewLocation } from "./main.js";

export async function getLocationCoordinates(type) {
    //show loading screen
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";

    if (type == "JSON") {
        return getCoordsFromJSON();
    } else {
        return await getCoordsFromGoogle();
    }
}


//Get Location from JSON (Legacy/Custom Map creation method) ----------------------------------------------------------------------------------------------------
let listOfLocations;
let jsonResponse;


//Load location JSON files
export async function loadLocationJSON(jsonName) {
    try {
        let response = await fetch("./JSON/" + jsonName + "Locations.json");
        if (!response.ok) {
            throw new Error("JSON fetch failed.");
        }
        
        jsonResponse = await response.json();
        listOfLocations = jsonResponse;
        
        generateNewLocation("JSON");

    } catch (error) {
        errorPopup("JSON error", "There was an error loading the location json file.", "JSON Fetch failed.", true);
        console.error(error); 
    }
}

let lastGuessIndex = null;
let guessIndex;

//This will be called in main.js when a new location is bein generated
function getCoordsFromJSON() {
    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length); 
    } while (lastGuessIndex === guessIndex);
    
    lastGuessIndex = guessIndex;

    const resultLat = listOfLocations[guessIndex][0];
    const resultLong = listOfLocations[guessIndex][1];

    let resultLocationsArray = [resultLat, resultLong];
    return resultLocationsArray;
}


//Get Locations from google maps js API (new method - unlimited locations) -------------------------------------------------------------------------------

import { Loader } from "@googlemaps/js-api-loader";

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
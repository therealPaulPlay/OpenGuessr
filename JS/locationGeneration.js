export async function getLocationCoordinates(type) {
    if (type == "JSON") {
        return getCoordsFromJSON();
    } else {
        return await getCoordsFromGoogle();
    }
}


//Get Location from JSON (Legacy/Custom Map creation method) ---------------------------------------------------------------------------------
let lastGuessIndex = null;
let guessIndex;

function getCoordsFromJSON() {
    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length); 
    } while (lastGuessIndex === guessIndex);
    
    lastGuessIndex = guessIndex;

    let resultLocationsArray = [listOfLocations[guessIndex][0], listOfLocations[guessIndex][1]];

    return resultLocationsArray;
}


//Get Locations from google maps js API (new method - unlimited locations) -------------------------------------------------------------------------------

import { Loader } from "@googlemaps/js-api-loader";

// not using any apiKey!
const loader = new Loader({
    version: "weekly",
    libraries: ["maps", "streetView", "core"]
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
/* These imports are being handled and performed by Webpack. Note that errorHandling.js is still being included
for signupScreen.js only. LoadMap and AccountLogic are both not being included in the build folder as they are part
of the bundled main.js. */

import { resultScreenEnabled } from './mainUI.js';
import { getLocationCoordinates } from '../src/lib/logic/locationGeneration.js';
import { applySingleplayerSettings } from './singleplayerOptions.js';
import { multiplayer, startMultiplayerRound, isHost } from './multiplayer.js';
import { checkIfGuessWasCorrect, countryGuesserMode, setCountryGuesserCountry } from './countryGuesser.js';
import { checkStartCompetitionRound } from './competitionLogic.js';
import { imageGuesserEnabled, loadImageFromUrl } from './imageGuesser.js';

// default coords of the location
export let currentStreetviewLat = 0;
export let currentStreetviewLong = 0;

// Coordinates to country --------------------------------------------------------------------------

let gridData = null;

async function loadDataset() {
    const response = await fetch("./JSON/countries.json");
    gridData = await response.json();
}

loadDataset();

export function getCountryFromCoords(lat, lon) {
    try {
        const gridSize = gridData.grid_size;
        const latIndex = Math.floor(lat / gridSize);
        const lonIndex = Math.floor(lon / gridSize);
        const key = `${latIndex},${lonIndex}`;
        return gridData.data[key] || "Unknown";
    } catch (error) {
        console.error("Error getting country from coords: " + error);
        return "Uknknown";
    }
}

// Load new location (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------

export async function generateNewLocation(type) {
    let newLocationArray;

    try {
        newLocationArray = await getLocationCoordinates(type);
    } catch (error) {
        console.error("Invalid location generation type in main.js / generateNewLocation. Error: " + error);
    }

    try {
        currentStreetviewLat = Number(newLocationArray[0]);
        currentStreetviewLong = Number(newLocationArray[1]);

        if (countryGuesserMode && !multiplayer) {
            setCountryGuesserCountry(newLocationArray[2]);
        }

        if (imageGuesserEnabled && !multiplayer) {
            loadImageFromUrl(newLocationArray[2]);
        }

    } catch {
        console.error("The coordinates to load the iframe from are not defined. " + "Lat: " + currentStreetviewLat + " Long: " + currentStreetviewLong);
    }

    loadIframe(currentStreetviewLat, currentStreetviewLong);

    if (multiplayer && isHost) {
        startMultiplayerRound(currentStreetviewLat, currentStreetviewLong);
    }

}

//Calculate distance to the target destination on result screen & display motivational message ---------------------------------------------------------------------
let veryCloseDistances;
let closeDistances;
let farDistances;
let extraMsg;

//Haversine formula, takes spherical nature of planet into account
export function calculateDistances(mapsLat, mapsLong) {
    const R = 6371; // Radius of the Earth in km
    const lat1 = currentStreetviewLat * Math.PI / 180; // Convert degrees to radians
    const lon1 = currentStreetviewLong * Math.PI / 180;
    const lat2 = mapsLat * Math.PI / 180;
    const lon2 = mapsLong * Math.PI / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers

    return distance;
}

export function compareDistances(distance) {
    // compares how big the distance is and enables result screen with a message.
    if (!resultScreenEnabled) {

        let resultAsString;

        veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Do you have an A in geography?", "Wow.", "Time for a screenshot.", "Seriously impressive."];
        closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!", "Yup, that was impressive.", "That's how it's done!"];
        farDistances = ["Distance is relative. Here, relatively big.", "You'll get it next time!", "At least it was on the correct planet.", "It could have been worse."];

        // motivational quotes
        if (distance < 5) {
            extraMsg = veryCloseDistances[Math.floor(Math.random() * veryCloseDistances.length)];
        } else if (distance < 1000) {
            extraMsg = closeDistances[Math.floor(Math.random() * closeDistances.length)];
        } else {
            extraMsg = farDistances[Math.floor(Math.random() * farDistances.length)];
        }

        // distance number formatting (km or m)
        resultAsString = formatDistance(distance);

        if (countryGuesserMode && !multiplayer) {
            if (checkIfGuessWasCorrect()) {
                extraMsg = veryCloseDistances[Math.floor(Math.random() * veryCloseDistances.length)];
            } else {
                extraMsg = farDistances[Math.floor(Math.random() * farDistances.length)];
            }
        }

        return { resultAsString: resultAsString, extraMsg: extraMsg };
    }
}

// This function neatly formats a distance in meters into a readable string (e.g. 500 km or 15 miles)
export function formatDistance(distance) {
    let finalResult;
    let resultString;
    
    const distanceUnit = localStorage.getItem("distanceUnit") || "kilometers";

    distance = Number(distance); // For error prevention

    if (distance < 5) {
        finalResult = Math.round(distance * 1000);
        if (distanceUnit == "miles") {
            finalResult = Math.round(finalResult * 1.09361);
        }
        finalResult = finalResult.toLocaleString();

        if (distanceUnit == "miles") {
            resultString = finalResult + " yards";
        } else {
            resultString = finalResult + " m";
        }
    }
    else {
        finalResult = Math.round(distance * 10) / 10;
        if (distanceUnit == "miles") {
            finalResult = Math.round(finalResult * 0.621371 * 10) / 10;
        }

        finalResult = finalResult.toLocaleString();

        if (distanceUnit == "miles") {
            resultString= finalResult + " miles";
        } else {
            resultString = finalResult + " km";
        }
    }

    return resultString;
}

// Clamp function (Global) ----------------------------------------------------------------------------------------------------------------------
export function clamp(num, min, max) {
    return num <= min
        ? min
        : num >= max
            ? max
            : num
}

// Load the Main StreetView Iframe -------------------------------------------------------------------------------------------------------------
let loadingLink = "/loader.html";

export function loadIframe(lat, long) {
    let streetviewAPIKey = "AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs";

    if (!imageGuesserEnabled || multiplayer) {
        loadingLink = "https://www.google.com/maps/embed/v1/streetview?location=" + lat + "," + long + "&key=" + streetviewAPIKey + "&fov=90"; //API key (last part of URL)
    } else {
        loadingLink = "";
    }

    let initialIframeLoad = true;

    // Reference to the iframe
    const iframe = document.getElementById("PanoramaIframe");

    // Define a function to handle iframe load event
    const handleLoad = () => {
        if (initialIframeLoad) {
            applySingleplayerSettings(); // Check if the user is playing hard mode + apply changes if yes
            checkStartCompetitionRound(); // Check if currently playing competition and start timer + new round if so 
        }

        initialIframeLoad = false;

        setTimeout(function () {
            const beforeOverlay = document.getElementById("BeforeOverlay");
            beforeOverlay.style.opacity = "0";
            beforeOverlay.style.visibility = "hidden";
        }, 300);
    };

    // add new load listener and delete old one - on load: fade out overlay
    iframe.removeEventListener('load', handleLoad);
    iframe.addEventListener('load', handleLoad);

    iframe.setAttribute("src", loadingLink);
}

export function reloadIframe() {
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("PanoramaIframe").setAttribute("src", loadingLink);
    window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = "0"; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 400);

}

// External script loader --------------------------------------------------------------------------------------------------------------

// Generic script loader and initializer
export function loadAndInitializeLibrary(url, globalVar, initFunction) {
    return new Promise((resolve, reject) => {
        if (window[globalVar]) {
            resolve(initFunction(window[globalVar]));
        } else {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                try {
                    resolve(initFunction(window[globalVar]));
                } catch (error) {
                    reject(new Error(`Failed to initialize ${globalVar}: ${error.message}`));
                }
            };
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        }
    });
}
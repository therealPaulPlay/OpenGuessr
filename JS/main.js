/*these imports are being handled and performed by Webpack. Note that errorHandling.js is still being included
for signupScreen.js only. LoadMap and AccountLogic are both not being included in the build folder as they are part
of the bundled main.js. */

import { resetMap, getMapSource, mapsJWTToken, colorArray } from './miniMap.js';
import { loadResultScreenXP, selectedPinIndex } from "./accountLogic.js";
import { resultScreenEnabled, enableResultScreen, distanceUnit } from './mainUI.js';
import { getLocationCoordinates } from './locationGeneration.js';
import { dailyChallengeCheckTimer, dailyChallengeUIEnabled, dailyChallengeTimer } from "./dailyChallenge.js";
import { checkHardModeTimeout } from './hardMode.js';
import { multiplayer, startMultiplayerRound, isHost, multiplayerGuessesLocationsArray } from './multiplayer.js';
import { checkIfGuessWasCorrect, countryGuesserMode, setCountryGuesserCountry } from './countryGuesser.js';
import { playSound } from './soundManager.js';

//default coords of the location
export let currentStreetviewLat = 0;
export let currentStreetviewLong = 0;

//clamp function 
export function clamp(num, min, max) {
    return num <= min
        ? min
        : num >= max
            ? max
            : num
}

//Coordinates to country --------------------------------------------------------------------------

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

//Load new location (called in categoryMenu.js afer loading the category) ---------------------------------------------------------------------------------------------------

export async function generateNewLocation(type) {
    resetMap();

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
let destinationMarker;

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

    compareDistances(distance);
}

function compareDistances(distance) {
    //compares how big the distance is and enables result screen with a message.
    if (!resultScreenEnabled) {

        let finalResult;
        let resultAsString;

        veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Let me guess; you have an A in geography?", "Wow."]
        closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!"];
        farDistances = ["It was a good guess.", "You'll get it next time!", "At least it was on the correct planet, right?", "Not bad, not great."];

        //motivational quotes
        if (distance < 100 && !(distance < 5)) {
            extraMsg = closeDistances[Math.floor(Math.random() * closeDistances.length)];
        }
        else {
            extraMsg = farDistances[Math.floor(Math.random() * farDistances.length)];
        }

        //distance number formatting (km or m)
        if (distance < 5) {
            finalResult = Math.round(distance * 1000);
            if (distanceUnit == "miles") {
                finalResult = Math.round(finalResult * 1.09361);
            }
            finalResult = finalResult.toLocaleString();

            if (distanceUnit == "miles") {
                resultAsString = finalResult + " yards";
            } else {
                resultAsString = finalResult + " m";
            }

            extraMsg = veryCloseDistances[Math.floor(Math.random() * veryCloseDistances.length)];
        }
        else {
            finalResult = Math.round(distance * 10) / 10;
            if (distanceUnit == "miles") {
                finalResult = Math.round(finalResult * 0.621371 * 10) / 10;
            }

            finalResult = finalResult.toLocaleString();

            if (distanceUnit == "miles") {
                resultAsString = finalResult + " miles";
            } else {
                resultAsString = finalResult + " km";
            }
        }

        if (dailyChallengeUIEnabled) {
            extraMsg = "You took " + (120 - dailyChallengeTimer.getRemainingTime()) + "s to guess. The time is part of the XP calculation." //show timer data in extra message on result screen for daily challenge
        }

        if (countryGuesserMode && !multiplayer) {
            if (checkIfGuessWasCorrect()) {
                extraMsg = veryCloseDistances[Math.floor(Math.random() * veryCloseDistances.length)];
            } else {
                extraMsg = farDistances[Math.floor(Math.random() * farDistances.length)];
            }
        }

        loadResultScreenXP(distance);
        enableResultScreen(resultAsString, extraMsg);
    }
}

//Load result Map (resMap) ------------------------------------------------------------------------------------------------

// Initialize the map outside of the function
mapkit.init({
    authorizationCallback: function (done) {
        done(mapsJWTToken);
    },
    language: "en-US" // can only be changed on page load / initialization
});

// Create the map object outside of the function
export let resMap = new mapkit.Map("resultMap");

resMap.showsZoomControl = false;
resMap.showsMapTypeControl = false;
resMap._allowWheelToZoom = true;

// Function to clear markers and polylines
function clearMap() {
    resMap.annotations.forEach(annotation => resMap.removeAnnotation(annotation));
    resMap.overlays.forEach(overlay => resMap.removeOverlay(overlay));
}

export let animateMap;

// Load the result map
export function loadResultMap(playersLat, playersLong) {
    // Clear markers and polylines
    clearMap();
    try { clearInterval(animateMap)} catch(error) { console.warn("Couldn't clear interval in main.js: " + error)};
    let curLatLng;

    // default values in case there was an error / not defined
    if (playersLat == null || playersLat == undefined || isNaN(playersLat)) {
        playersLat = 0;
        playersLong = 0;
    }

    try {
        curLatLng = new mapkit.Coordinate(currentStreetviewLat, currentStreetviewLong);
    } catch (err) {
        console.error("Error setting curLatLng: " + err);
    }

    let playerLatLng;
    let polyList;

    // this places the "correct" marker that actually reflects the target location
    try {

        destinationMarker = new mapkit.MarkerAnnotation(curLatLng, {
            color: "white",
            glyphColor: "#18d95b",
            glyphImage: { 1: `./IMG/result_marker.png` },
        });
        resMap.addAnnotation(destinationMarker);

    } catch (error) {
        console.error("Error placing the destination marker: " + error);
    }

    if (!countryGuesserMode || multiplayer) {
        playerLatLng = new mapkit.Coordinate(playersLat, playersLong);
        polyList = [curLatLng, playerLatLng];

        // this places the Player Marker (where the player thinks the location is)

        const playerMarker = new mapkit.MarkerAnnotation(playerLatLng, {
            color: "white",
            glyphColor: colorArray[selectedPinIndex],
            glyphImage: { 1: `./IMG/apple_your_marker${selectedPinIndex}.png` },
        });

        resMap.addAnnotation(playerMarker);
        // this draws the line to the goal
        const polyline = new mapkit.PolylineOverlay(polyList);
        resMap.addOverlay(polyline);
    }

    // pins of other players
    if (multiplayer) {
        multiplayerGuessesLocationsArray.forEach(function (element) {
            let newMarkerLat = element[0];
            let newMarkerLong = element[1];
            let newMarkerPinIndex = element[2];

            // checks for edge cases
            if (newMarkerLat == null || newMarkerLong == null || isNaN(newMarkerLat)) {
                newMarkerLat = 0;
                newMarkerLong = 0;
            }

            if (newMarkerPinIndex == null) {
                newMarkerPinIndex = 0;
                console.error("Provided maker pin index form peer is null");
            }

            // only place the multiplayer marker if it isn't your marker!
            if (newMarkerLat != playersLat || newMarkerLong != playersLong) {
                const multiplayerLatLng = new mapkit.Coordinate(Number(newMarkerLat), Number(newMarkerLong));
                const multiplayerMarker = new mapkit.MarkerAnnotation(multiplayerLatLng, {
                    color: "#e3e3e3",
                    glyphColor: colorArray[newMarkerPinIndex],
                    glyphImage: { 1: `./IMG/apple_your_marker${newMarkerPinIndex}.png` },
                });
                resMap.addAnnotation(multiplayerMarker);
                const multiplayerPolyList = [curLatLng, multiplayerLatLng]; // takes the cur lat lng from the guess (the destination) + the current guess from other player
                const multiplayerPolyline = new mapkit.PolylineOverlay(multiplayerPolyList);
                resMap.addOverlay(multiplayerPolyline);
            }
        });
    }

    if (countryGuesserMode) {
        //only center the destination marker, there is no player marker
        try {
            resMap.region = new mapkit.CoordinateRegion(
                new mapkit.Coordinate(currentStreetviewLat - 8, currentStreetviewLong), // -8 to move the view up sligthly for phones
                new mapkit.CoordinateSpan(50, 50)
            );
        } catch (e) {
            console.error("Error creating region for country guessr in main.js: " + e);
        }
    }

    if (!countryGuesserMode || multiplayer) {
        // Calculate the center coordinate between the guess marker and the destination marker
        const centerLat = (currentStreetviewLat + playersLat) / 2;
        const centerLong = (currentStreetviewLong + playersLong) / 2;
    
        // Calculate the span to include both markers on the map
        const spanLat = Math.abs(currentStreetviewLat - playersLat) * 3; // Adjust padding as needed
        const spanLong = Math.abs(currentStreetviewLong - playersLong) * 3; 
    
        // Calculate the distance between the two points
        const distance = Math.sqrt(Math.pow((currentStreetviewLat - playersLat), 2) + Math.pow((currentStreetviewLong - playersLong), 2));
    
        const minDistance = 0;
        const maxDistance = 5000; // Maximum distance for zooming (5000km)
        const minZoomLevel = 0;
        const maxZoomLevel = 10; 
        const zoomScaleFactor = 200;
    
        // Calculate the zoom level with scaling
        let zoomLevel = minZoomLevel + (maxZoomLevel - minZoomLevel) * (distance - minDistance) / (maxDistance - minDistance);
        zoomLevel *= zoomScaleFactor;
    
        let region;
    
        try {
            region = new mapkit.CoordinateRegion(
                new mapkit.Coordinate(centerLat, centerLong),
                new mapkit.CoordinateSpan(spanLat, spanLong)
            );
        } catch (e) {
            console.error("Error creating region in main.js: " + e);
            console.log(centerLat + " and long: " + centerLong);
        }
    
        // Set the initial region without animation
        resMap.region = region;
    
        // Animate to the result marker with a slight zoom in after a delay
        animateMap = setTimeout(() => {
            const resultRegion = new mapkit.CoordinateRegion(
                new mapkit.Coordinate(currentStreetviewLat, currentStreetviewLong),
                new mapkit.CoordinateSpan(zoomLevel, zoomLevel)
            );
            resMap.setRegionAnimated(resultRegion, true);
        }, 1500);
    }         
}

//Open map locations on google maps --------------------------------------------------------------------------------------------------

document.getElementById("endScreenOpenLocation").addEventListener("click", openLocationOnMap);

function openLocationOnMap() {
    playSound("basic_button");
    window.open("https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + currentStreetviewLat + "," + currentStreetviewLong, '_blank').focus();
}

//Load the Main StreetView Iframe -------------------------------------------------------------------------------------------------------------
let loadingLink = "/loader.html";

export function loadIframe(lat, long) {
    loadingLink = "https://www.google.com/maps/embed/v1/streetview?location=" + lat + "," + long + "&key=AIzaSyDpIxJVFjMHOYsOv14lVN9Imlsh6pYI7z0&fov=90"; //API key (last part of URL)
    let initialIframeLoad = true;

    // Reference to the iframe
    const iframe = document.getElementById("GuesserWindow");

    // Define a function to handle iframe load event
    const handleLoad = () => {
        if (initialIframeLoad) {
            dailyChallengeCheckTimer(); //check if daily challenge is active and start timer
            checkHardModeTimeout(); //Check if the user is playing hard mode + apply changes if yes
        }

        initialIframeLoad = false;

        setTimeout(function () {
            const beforeOverlay = document.getElementById("BeforeOverlay");
            beforeOverlay.style.opacity = "0";
            beforeOverlay.style.visibility = "hidden";
        }, 200);
    };

    //add new load listener and delete old one - on load: fade out overlay
    iframe.removeEventListener('load', handleLoad);
    iframe.addEventListener('load', handleLoad);

    iframe.setAttribute("src", loadingLink);
}

export function reloadIframe() {
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("GuesserWindow").setAttribute("src", loadingLink);
    window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = "0"; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 400);

}



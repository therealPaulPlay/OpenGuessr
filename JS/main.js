/*these imports are being handled and performed by Webpack. Note that errorHandling.js is still being included
for signupScreen.js only. LoadMap and AccountLogic are both not being included in the build folder as they are part
of the bundled main.js. */

import { resetMap, map, addedMarkers, handleMapUnhover, initializeMapIfNotAlready } from './miniMap.js';
import { loadResultScreenXP } from "./accountLogic.js";
import { selectedPinIndex } from './profileView.js';
import { resultScreenEnabled, enableResultScreen, distanceUnit } from './mainUI.js';
import { getLocationCoordinates } from './locationGeneration.js';
import { checkHardModeTimeout } from './hardMode.js';
import { multiplayer, startMultiplayerRound, isHost, multiplayerGuessesLocationsArray } from './multiplayer.js';
import { checkIfGuessWasCorrect, countryGuesserMode, setCountryGuesserCountry } from './countryGuesser.js';
import { playSound } from './soundManager.js';
import { checkStartCompetitionRound } from './competitionLogic.js';
import { imageGuesserEnabled, loadImageFromUrl } from './imageGuesser.js';

//default coords of the location
export let currentStreetviewLat = 0;
export let currentStreetviewLong = 0;

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

    compareDistances(distance);
}

function compareDistances(distance) {
    playSound("confirm");

    //compares how big the distance is and enables result screen with a message.
    if (!resultScreenEnabled) {

        let finalResult;
        let resultAsString;

        veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Do you have an A in geography?", "Wow.", "Time for a screenshot.", "Seriously impressive."];
        closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!", "Yup, that was impressive.", "That's how it's done!"];
        farDistances = ["Distance is relative. Here, relatively big.", "You'll get it next time!", "At least it was on the correct planet.", "It could have been worse."];

        //motivational quotes
        if (distance < 1000 && !(distance < 5)) {
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

export async function loadResultMap(playersLat, playersLong) {
    setTimeout(() => {
        handleMapUnhover();
    }, 250);

    await initializeMapIfNotAlready();
    
    // Default values in case there was an error / not defined
    if (playersLat == null || playersLat == undefined) {
        playersLat = 0;
        playersLong = 0;
    }

    // Reset the map if it already exists - important for going to the next round
    resetMap();

    // Add CSS class to the map container to style the map
    document.getElementById("mapHolder").classList.add("mapHolderToResult");
    document.getElementById("map").classList.add("mapFullOpacity");

    if (!map) {
        console.error("Map not properly inizialized - exiting result map load function.");
        return;
    }
    
    // Set map center to the currentStreetviewLat and currentStreetviewLong
    map.setCenter({ lat: currentStreetviewLat, lng: currentStreetviewLong });
    map.setZoom(3);

    // Define custom icons for markers
    let yourIcon = {
        url: './IMG/your_marker' + selectedPinIndex + '.png',
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 34),
        scaledSize: new google.maps.Size(35, 35)
    };

    let greenIcon = {
        url: './IMG/result_marker.png',
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 34),
        scaledSize: new google.maps.Size(35, 35)
    };

    // Create LatLng objects for current and player positions
    let curLatLng = new google.maps.LatLng(currentStreetviewLat, currentStreetviewLong);
    let playerLatLng;
    let pointList;

    // Check if in multiplayer mode or country guesser mode
    if (!countryGuesserMode || multiplayer) {
        playerLatLng = new google.maps.LatLng(playersLat, playersLong);
        pointList = new google.maps.LatLngBounds();
        pointList.extend(curLatLng);
        pointList.extend(playerLatLng);

        // Place the player marker (where the player thinks the location is)
        let playerMarker = new google.maps.Marker({
            position: playerLatLng,
            map: map,
            icon: yourIcon
        });

        addedMarkers.push(playerMarker);

        // Create InfoWindow for playerMarker
        let playerInfoWindow = new google.maps.InfoWindow({
            content: "You" // Replace with dynamic content if needed
        });

        // Open InfoWindow when marker is clicked
        playerMarker.addListener('click', function() {
            playerInfoWindow.open(map, playerMarker);
        });

        let polyline = new google.maps.Polyline({
            path: [curLatLng, playerLatLng],
            map: map,
            strokeWeight: 1,
            strokeColor: "black"
        });

        addedMarkers.push(polyline);
    }

    // Handle multiplayer markers
    if (multiplayer) {
        multiplayerGuessesLocationsArray.forEach(function (element) {
            let newMarkerLat = element[0];
            let newMarkerLong = element[1];
            let newMarkerPinIndex = element[2];
            let associatedPlayerName = element[3];

            // Handle edge cases
            if (newMarkerLat == null || newMarkerLong == null || isNaN(newMarkerLat)) {
                newMarkerLat = 0;
                newMarkerLong = 0;
            }

            if (newMarkerPinIndex == null) {
                newMarkerPinIndex = 0;
                console.error("Provided maker pin index form peer is null");
            }

            // Place multiplayer markers if not player's marker
            if (newMarkerLat != playersLat || newMarkerLong != playersLong) {

                let newMultiplayerIcon = {
                    url: "./IMG/your_marker" + newMarkerPinIndex + ".png",
                    size: new google.maps.Size(35, 35),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17.5, 34),
                    scaledSize: new google.maps.Size(35, 35)
                };

                let multiplayerLatLng = new google.maps.LatLng(newMarkerLat, newMarkerLong);

                let multiplayerMarker = new google.maps.Marker({
                    position: multiplayerLatLng,
                    map: map,
                    icon: newMultiplayerIcon,
                });

                addedMarkers.push(multiplayerMarker);

                // Create InfoWindow for multiplayerMarker
                let multiplayerInfoWindow = new google.maps.InfoWindow({
                    content: associatedPlayerName // Replace with dynamic content if needed
                });

                // Open InfoWindow when marker is clicked
                multiplayerMarker.addListener('click', function() {
                    multiplayerInfoWindow.open(map, multiplayerMarker);
                });

                let multiplayerPolyline = new google.maps.Polyline({
                    path: [curLatLng, multiplayerLatLng],
                    strokeColor: "black",
                    strokeWeight: 1,
                    strokeOpacity: 0.25,
                    map: map
                });

                addedMarkers.push(multiplayerPolyline);
            }
        });
    }

    // Fit the map bounds to show all markers and lines (with padding)
    if (!countryGuesserMode || multiplayer) {
        map.fitBounds(pointList, { padding: { top: 150, right: 250, bottom: 150, left: 250 }});
        if (map.getZoom() > 4) {
            map.setZoom(map.getZoom() - 2);
        } else {
            map.setZoom(map.getZoom() - 1);
        }
    }

    // Place the "correct" marker reflecting the target location
    let destinationMarker = new google.maps.Marker({
        position: { lat: currentStreetviewLat, lng: currentStreetviewLong },
        map: map,
        icon: greenIcon
    });

    addedMarkers.push(destinationMarker);

    // Fly to the destination marker after a delay
    setTimeout(flyToDestination, 1500);
}

function flyToDestination() {
    // Check if EndOverlay is fully visible before flying to the destination
    if (document.getElementById("EndOverlay").style.opacity == "1" && map) {
        let currentZoom = map.getZoom();
        let newZoom = Math.min(currentZoom + 2, map.maxZoom || 21); // Adjust 2 to the desired zoom increment and 21 to the max zoom level if you have a custom max

        let latLng = { lat: currentStreetviewLat, lng: currentStreetviewLong };
        
        map.setZoom(newZoom);
        map.setCenter(latLng);
    }
}

//clamp function 
export function clamp(num, min, max) {
    return num <= min
        ? min
        : num >= max
            ? max
            : num
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
    let streetviewAPIKey = "AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs";

    if (!imageGuesserEnabled || multiplayer) {
        loadingLink = "https://www.google.com/maps/embed/v1/streetview?location=" + lat + "," + long + "&key=" + streetviewAPIKey + "&fov=90"; //API key (last part of URL)
    } else {
        loadingLink = "";
    }

    let initialIframeLoad = true;

    // Reference to the iframe
    const iframe = document.getElementById("GuesserWindow");

    // Define a function to handle iframe load event
    const handleLoad = () => {
        if (initialIframeLoad) {
            checkHardModeTimeout(); // Check if the user is playing hard mode + apply changes if yes
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
    document.getElementById("GuesserWindow").setAttribute("src", loadingLink);
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
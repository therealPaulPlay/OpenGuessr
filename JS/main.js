/*these imports are being handled and performed by Webpack. Note that errorHandling.js is still being included
for signupScreen.js only. LoadMap and AccountLogic are both not being included in the build folder as they are part
of the bundled main.js. */

import { resetMap, getMapSource, handleMapUnhover } from './miniMap.js';
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

    return distance;
}

export function compareDistances(distance) {
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

        return { resultAsString: resultAsString, extraMsg: extraMsg};
    }
}

//Load result Map (resMap) ------------------------------------------------------------------------------------------------

export let resMap;

let tileLayer;

function setTileLayer() {
    tileLayer = L.tileLayer(getMapSource(), {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        minZoom: 2,
        detectRetina: true,
    });
}

setTileLayer(); // set initial value for tileLayer

export function setResultMapTileLayer() {
    try {
        if (resMap) {
            resMap.removeLayer(tileLayer);

            setTileLayer();

            tileLayer.addTo(resMap);
        }
    } catch (e) {
        console.error("ResMap TileLayer adding error: " + e);
    }
}

export function loadResultMap(playersLat, playersLong) {
    //this deletes the map only if it already exists - otherwise it will never exist - important for going to the next round
    if (resMap && resMap.remove) {
        resMap.off();
        resMap.remove();
    }

    //this makes it so the map in the result screen is focused on the center between the point
    //and zooming out so both points are visible on the map.
    resMap = document.getElementById("resultMap");
    resMap = L.map('resultMap', { zoomControl: false }).setView([currentStreetviewLat, currentStreetviewLong], 10); // basically only for country guessr
    setResultMapTileLayer();

    if (countryGuesserMode && !multiplayer) {
        resMap.setZoom(3); //set default zoom
    }

    const yourIcon = new L.Icon({
        iconUrl: "./IMG/your_marker" + selectedPinIndex + ".png",
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    const greenIcon = new L.Icon({
        iconUrl: './IMG/result_marker.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    //used to create the line between the points
    let curLatLng = new L.LatLng(currentStreetviewLat, currentStreetviewLong);
    let pointList = null;
    let playerLatLng;
    let polyList;
    let playerMarker;

    if (!countryGuesserMode || multiplayer) {
        playerLatLng = new L.LatLng(playersLat, playersLong);
        polyList = [curLatLng, playerLatLng];
        pointList = new L.LatLngBounds([curLatLng, playerLatLng]);
        playerMarker;

        //this places the Player Marker (where the player thinks the location is)
        playerMarker = new L.Marker(playerLatLng, { icon: yourIcon });
        if (multiplayer) {
            playerMarker.bindTooltip("You",
                {
                    permanent: true,
                    direction: 'right'
                });
        }

        playerMarker.addTo(resMap);

        //this draws the line to the goal
        const polygon = L.polygon(polyList, {
            color: "black", weight: "1", opacity: "0.75"
        }).addTo(resMap);
    }

    //pins of other players
    if (multiplayer) {
        multiplayerGuessesLocationsArray.forEach(function (element) {
            let newMarkerLat = element[0];
            let newMarkerLong = element[1];
            let newMarkerPinIndex = element[2];
            let associatedPlayerName = element[3];

            //checks for edge cases
            if (newMarkerLat == null || newMarkerLong == null || isNaN(newMarkerLat)) {
                newMarkerLat = 0;
                newMarkerLong = 0;
            }

            if (newMarkerPinIndex == null) {
                newMarkerPinIndex = 0;
                console.error("Provided maker pin index form peer is null");
            }

            //only place the multiplayer marker if it isn't your marker!
            if (newMarkerLat != playersLat || newMarkerLong != playersLong) {
                let newMultiplayerIcon = new L.Icon({
                    iconUrl: "./IMG/your_marker" + newMarkerPinIndex + ".png",
                    iconSize: [35, 35],
                    iconAnchor: [17.5, 34],
                    popupAnchor: [1, -34],
                });

                let multiplayerLatLng = new L.LatLng(newMarkerLat, newMarkerLong);

                let multiplayerMarker = new L.Marker(multiplayerLatLng, { icon: newMultiplayerIcon });
                multiplayerMarker.bindTooltip(associatedPlayerName,
                    {
                        permanent: true,
                        direction: 'right'
                    });
                multiplayerMarker.setOpacity(0.6);
                multiplayerMarker.addTo(resMap);

                let multiplayerPolyList = [curLatLng, multiplayerLatLng]; //takes the cur lat lng from the guess (the destination) + the current guess from other player
                const multiplayerPolygon = L.polygon(multiplayerPolyList, {
                    color: "black", weight: "1", opacity: "0.25"
                }).addTo(resMap);
            }
        });
    }

    if (!countryGuesserMode || multiplayer) {
        resMap.fitBounds(pointList, { padding: [150, 250], animate: false });
    }

    //this places the "correct" marker that actually reflects the target location
    destinationMarker = new L.Marker([currentStreetviewLat, currentStreetviewLong], { icon: greenIcon });
    destinationMarker.addTo(resMap);

    setTimeout(flyToDestination, 1500);
}

function flyToDestination() {
    if (document.getElementById("EndOverlay").style.opacity == "1" && resMap) {
        var lat = currentStreetviewLat;
        var lng = currentStreetviewLong;
        var zoom = clamp(resMap.getZoom() + 2, 0, 18);
        var animate = {
            animate: true,
            duration: 1
        };


        // move the marker up a notch on phones
        if (window.innerHeight > window.innerWidth) {  // Check if it's a mobile device in portrait mode
            var mapHeight = resMap.getSize().y; // Get the map's height in pixels
            var offset = mapHeight / 25; // Adjust to place the marker slightly above the center (1/4 of the map's height)
            var targetPoint = resMap.latLngToContainerPoint([lat, lng]); // Convert the lat/lng to container point
            targetPoint.y += offset; // Adjust the point to move it slightly up
            var newLatLng = resMap.containerPointToLatLng(targetPoint); // Convert back to lat/lng

            resMap.flyTo(newLatLng, zoom, animate);
        } else {
            resMap.flyTo([lat, lng], zoom, animate);
        }
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
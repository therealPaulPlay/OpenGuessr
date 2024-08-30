import { loadResultMap, calculateDistances, setResultMapTileLayer } from "./main.js";
import { selectedPinIndex } from "./profileView.js";
import { multiplayer, multiplayerStateToGuessed, peerId, sendTeamMarkers, yourTeam } from "./multiplayer.js";
import { hideToggleMapButtonIfMobile, isElementClickable } from "./mainUI.js";
import { playSound } from "./soundManager.js";
import { competitionTimer, playingCompetition, checkCompetitionRoundStatus } from "./competitionLogic.js";


// Initialize the map with correct provider --------------------------------------------------------------------
const Provider = {
    STANDARD: "0",
    SATELLITE: "1",
    HYBRID: "2",
    TERRAIN: "3"
}

// Leaflet initialization and Tiles --------------------------------------------------------------------------------------
let map = L.map('map', { zoomControl: false }).setView([40.321160, 10.252812], 1.5); //starting position

let mapProvider = ["https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en", "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&hl=en", "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en", "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en"];

let multiplayerMiniMarkers = []; // team markers

// Standard should be the new default!
let providerIndex = Provider.STANDARD;
let storedProviderIndex = localStorage.getItem("providerIndex");

if (storedProviderIndex != null) {
    providerIndex = storedProviderIndex;
}

enableMapTypeButton();

export function getMapSource() {
    return mapProvider[providerIndex];
}

loadMap();
changeMapTypeButtonLabel();

//reset the map - used for going to the next round. 
export function resetMap() {
  if (map) {
    map.removeLayer(marker);
    map.setView(new L.LatLng(20, 0), 2);
  }

    //reset the guess button as well
    hasGuessed = false;
    setConfirmButtonState();
}

// Leaflet Tile Layer Loading and Resetting --------------------------------------------------------------------
let dataLayer;

function loadMap() {
    dataLayer = L.tileLayer(mapProvider[providerIndex], {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        minZoom: 1,
        noWrap: true,
        fakeRetina: true,
    }).addTo(map);

    map.setZoom(2);
}

// Map Type Button Label ----------------------------------------------------------------------------------------

function changeMapTypeButtonLabel() {
    let mapTypeBaseText = "Minimap:";
    switch (providerIndex) {
        case "0": document.getElementById("mapTypeButton").innerHTML = `${mapTypeBaseText} Standard`;
            break;

        case "1": document.getElementById("mapTypeButton").innerHTML = `${mapTypeBaseText} Satellite`;
            break;

        case "2": document.getElementById("mapTypeButton").innerHTML = `${mapTypeBaseText} Hybrid`;
            break;

        case "3": document.getElementById("mapTypeButton").innerHTML = `${mapTypeBaseText} Terrain`;
            break;

        default: document.getElementById("mapTypeButton").innerHTML = `${mapTypeBaseText} Standard`;
            break;
    }
}

function enableMapTypeButton() {
    if (map && document.getElementById("mapTypeButton")) {
        document.getElementById("mapTypeButton").style.pointerEvents = "auto";
        document.getElementById("mapTypeButton").style.opacity = "1";
    }
}

//Set state of the confirm ("guess") button ------------------------------------------------------------------

//indicate whether a guess has been made and the button can be used
let hasGuessed = false;
setConfirmButtonState();

export function setConfirmButtonState() {
    if (hasGuessed) {
        document.getElementById("confirmButton").style.backgroundColor = "red";
        document.getElementById("confirmButton").style.color = "white";
        document.getElementById("confirmButton").style.opacity = "100%"
        document.getElementById("confirmButton").style.pointerEvents = "auto";
        document.getElementById("helpButton").classList.add("helpButtonDisabled");
    }
    else {
        document.getElementById("confirmButton").style.backgroundColor = "rgba(168, 168, 187, 0.3)";
        document.getElementById("confirmButton").style.pointerEvents = "none";
        document.getElementById("helpButton").classList.remove("helpButtonDisabled");
    }
}

export function setConfirmButtonEnabled() {
    hasGuessed = true;
    setConfirmButtonState();
}

//Change map provider / language ---------------------------------------------------------------------
function changeMapType() {
    switch (providerIndex) {
        case Provider.STANDARD:
            providerIndex = Provider.SATELLITE;
            break;
        case Provider.SATELLITE:
            providerIndex = Provider.HYBRID;
            break;
        case Provider.HYBRID:
            providerIndex = Provider.TERRAIN;
            break;
        default:
            providerIndex = Provider.STANDARD;
    }
    localStorage.setItem("providerIndex", providerIndex);

    changeMapTypeButtonLabel();
    map.removeLayer(dataLayer);
    loadMap();
    setResultMapTileLayer();
}

//Placing the marker on the minimap ------------------------------------------------------------------------
export let mapMarkerLat = 0;
export let mapMarkerLong = 0;

let marker = new L.Marker([0, 0]); // define initial marker

function onMapClick(e) {
    //creates markers wherever the user clicks and if it clicks to another position,
    //delete the old one and also save the position in latitudes and longitudes

    hasGuessed = true;
    setConfirmButtonState();
    playSound("pin_drop", "pin");

    if (marker) {
        map.removeLayer(marker);
    }
    //sets the variables from the USER input (this is the one that the user has placed)
    mapMarkerLat = e.latlng.lat;
    mapMarkerLong = e.latlng.lng;

    const yourIcon = new L.Icon({
        iconUrl: "./IMG/your_marker" + selectedPinIndex + ".png",
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    marker = new L.Marker([mapMarkerLat, mapMarkerLong], { icon: yourIcon });
    marker.addTo(map);
    sendTeamMarkers(mapMarkerLat, mapMarkerLong);
}

export function updateMinimapWithTeamMarkers(markerArray) {
    // Track existing marker positions
    let existingMarkerPositions = new Map();

    // Collect positions of current markers
    multiplayerMiniMarkers.forEach(existingMarker => {
        const position = existingMarker.getLatLng(); // this does not work
        existingMarkerPositions.set(`${position.lat},${position.lng}`, existingMarker);
    });

    try {
        // Remove markers that no longer exist in markerArray
        multiplayerMiniMarkers.forEach(existingMarker => {
            const position = existingMarker.getLatLng();
            const markerPositionKey = `${position.lat},${position.lng}`;

            // Check if current marker exists in the updated markerArray
            const markerExists = markerArray.some(element => {
                let miniMarkerLat = element[1];
                let miniMarkerLong = element[2];
                return miniMarkerLat == position.lat && miniMarkerLong == position.lng;
            });

            // If marker doesn't exist in markerArray, remove it
            if (!markerExists) {
                map.removeLayer(existingMarker);
                multiplayerMiniMarkers = multiplayerMiniMarkers.filter(m => m !== existingMarker);
                existingMarkerPositions.delete(markerPositionKey);
            }
        });

        // Add new markers from markerArray that belong to yourTeam
        markerArray.forEach(element => {
            let miniMarkerId = element[0];
            let miniMarkerLat = element[1];
            let miniMarkerLong = element[2];
            let miniMarkerPinIndex = element[3];
            let miniMarkerTeam = element[4];

            // Only add new marker if miniMarkerId is not equal to peerId (meaning the marker is your own marker)
            // and miniMarkerTeam matches yourTeam
            if (miniMarkerId != peerId && miniMarkerTeam === yourTeam) {
                const multiplayerLatLng = new L.LatLng(miniMarkerLat, miniMarkerLong);
                const markerPositionKey = `${multiplayerLatLng.lat},${multiplayerLatLng.lng}`;

                if (!existingMarkerPositions.has(markerPositionKey)) {
                    // Marker doesn't exist, create new marker
                    let newMultiplayerIcon = new L.Icon({
                        iconUrl: "./IMG/your_marker" + miniMarkerPinIndex + ".png",
                        iconSize: [35, 35],
                        iconAnchor: [17.5, 34],
                        popupAnchor: [1, -34]
                    });

                    const newMultiplayerMiniMarker = new L.marker(multiplayerLatLng, { icon: newMultiplayerIcon });
                    newMultiplayerMiniMarker.setOpacity(0.5);
                    newMultiplayerMiniMarker.addTo(map);
                    multiplayerMiniMarkers.push(newMultiplayerMiniMarker);
                    existingMarkerPositions.set(markerPositionKey, newMultiplayerMiniMarker); // Update positions map
                }
            }
        });

    } catch (error) {
        console.error("Error updating minimap with team markers: " + error);
    }
}

//event listeners -----------------------------------------------------------------
//click listener for confirm button

const confirmBTN = document.getElementById("confirmButton");
confirmBTN.addEventListener("click", confirmButtonClicks);

//toggle languages
const languageBTN = document.getElementById("mapTypeButton");
languageBTN.addEventListener("click", () => {
    changeMapType();
    playSound("selection_change");
});

//Reset map scaling when the user "enlarges" it --------------------------------------------------------------
map.on('click', onMapClick);

let useLegacyMouseOver = false;

//this is for legacy browsers that do not support resizeObservers
if (useLegacyMouseOver) {
    map.on('mouseover', onMapHover);
    map.on('mouseout', onMapHover);
}

function onMapHover() {
    map.invalidateSize();
}

try {
    new ResizeObserver(onMapHover).observe(document.getElementById("map"));
} catch (error) {
    console.error("Resize oberser unsupported. Err: " + error);
    useLegacyMouseOver = true;
}

// Enlarge map
const mapHolder = document.getElementById("mapHolder");
let mapResizeTimeout;

function handleMapHover() {
    if (window.matchMedia("(orientation: landscape) and (min-width: 1250px)").matches) {
        clearTimeout(mapResizeTimeout);
        mapHolder.classList.add("mapHover")
    }
}

export function handleMapUnhover() {
    mapResizeTimeout = setTimeout(() => {
        mapHolder.classList.remove("mapHover")
    }, 250);
}

function checkMapmodeindicatorOverflow() {
    let mapModeTextContainer = document.getElementById("mapModeTextContainer");
    let positionInfo = mapModeTextContainer.getBoundingClientRect();
    let width = positionInfo.width;
    if (width < 150 || (width < 235 && document.getElementById("mapModeText").textContent.length > 25) || (width < 280 && document.getElementById("mapModeText").textContent.length > 31)) {
        document.getElementById("mapModeText").classList.add("modetextScroll");
    } else {
        document.getElementById("mapModeText").classList.remove("modetextScroll");
    }
}

try {
    new ResizeObserver(() => { checkMapmodeindicatorOverflow(); }).observe(document.getElementById("mapModeTextContainer"));
} catch (error) {
    console.error("Error setting Resize Observer in miniMap.js: " + error);
}

// Mouse events
document.getElementById("map").addEventListener('mouseenter', handleMapHover);
document.getElementById("map").addEventListener('mouseleave', handleMapUnhover);

// Touch events
document.getElementById("map").addEventListener('touchstart', handleMapHover);
document.getElementById("map").addEventListener('touchend', handleMapUnhover);


//Guess / Confirm function ----------------------------------------------------------------------------------

export function confirmButtonClicks() {
    confirmBTN.style.pointerEvents = "none"; //disable the button (will be re-enabled by setConfirmButtonState)
    playSound("basic_button");

    document.getElementById("nextRoundText").textContent = "Next round";

    if (playingCompetition) {
        try {
            competitionTimer.stopTimer();
        } catch (e) {
            console.warn("Competition timer already stopped: " + e);
        }

        if (!checkCompetitionRoundStatus(true)) {
            document.getElementById("nextRoundText").textContent = "See ranking";
        } else {
            document.getElementById("nextRoundText").textContent = "Next round";
        }
    }

    if (!multiplayer) {
        calculateDistances(mapMarkerLat, mapMarkerLong);
        loadResultMap(mapMarkerLat, mapMarkerLong);
    } else {
        document.getElementById("guessText").textContent = "Waiting";
        document.getElementById("confirmButton").style.pointerEvents = "none";
        document.getElementById("map").style.visibility = "hidden";
        document.querySelectorAll(".mapAttribution").forEach((element) => {
            element.style.visibility = "hidden";
        });
        hasGuessed = false;
        setConfirmButtonState();
        hideToggleMapButtonIfMobile(true);
        document.getElementById("revealCompass").style.visibility = "hidden";

        multiplayerStateToGuessed();
    }
}

//Confirm Button with Spacebar and a few checks
document.getElementById("map").addEventListener("keyup", function (event) {
    if (event.key === " ") {
        if (confirmBTN.style.pointerEvents == "auto" && isElementClickable(document.getElementById("map"))) {
            confirmButtonClicks();
        }
    }
});

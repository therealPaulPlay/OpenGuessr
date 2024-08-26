import { loadResultMap, calculateDistances, setResultMapTileLayer } from "./main.js";
import { selectedPinIndex } from "./profileView.js";
import { multiplayer, multiplayerStateToGuessed, peerId, sendTeamMarkers, yourTeam } from "./multiplayer.js";
import { hideToggleMapButtonIfMobile, isElementClickable, resultScreenEnabled } from "./mainUI.js";
import { playSound } from "./soundManager.js";
import { competitionTimer, playingCompetition, checkCompetitionRoundStatus } from "./competitionLogic.js";
import { errorPopup } from "./errorHandling.js";


// Initialize the map with correct provider --------------------------------------------------------------------
const Provider = {
    STANDARD: "0",
    SATELLITE: "1",
    HYBRID: "2",
    TERRAIN: "3"
}

// Google Maps init --------------------------------------------------------------------------------------

// ensure that the user has not exceeded a certain limit of map loads
async function requestMapLoad() {
    try {
        let headers;

        if (localStorage.getItem("bearer")) {
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("bearer")}`
            };

        } else {
            headers = {
                'Content-Type': 'application/json'
            }
        }

        const mapLimitUrl = "https://accounts.openguessr.com/accounts/maplimit";

        const response = await fetch(mapLimitUrl, {
            method: 'GET',
            headers: headers
        });

        // Check if the response is successful
        if (response.ok) {
            const data = await response.json();
            return true;

        } else {
            const data = await response.json();
            console.error("Map load limit reached: " + data.error);
            errorPopup("Daily map load limit reached", "To prevent extraordinarily high Google API costs, your map load request was denied due to too many refreshes. Become a supporter to increase your limit!", data.error, false, false);
            return false;
        }
    } catch (error) {
        console.error('Error occurred while checking for the map load limit: ' + error);
        return true;
    }
}

export let map;

const worldBounds = {
    north: 90,
    south: -90,
    west: -190,
    east: 190
};

// Standard should be the new default!
let providerIndex = localStorage.getItem("providerIndex") || Provider.STANDARD;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    if (await requestMapLoad()) {
        map = new Map(document.getElementById("map"), {
            center: { lat: 20, lng: 0 },
            zoom: 2,
            streetViewControl: false, // Hide Street View control
            zoomControl: false,       // Hide zoom control
            fullscreenControl: false, // Hide fullscreen control
            mapTypeControl: false,     // Hide map type control
            draggableCursor: "crosshair",
            clickableIcons: false,
            restriction: {
                latLngBounds: worldBounds,
                strictBounds: true, // Enforce the restriction
            },
        });

        map.setMapTypeId(getMapType(providerIndex)); // Set the map type on the actual map
        changeMapTypeButtonLabel();
    }
}

await initMap();

let multiplayerMiniMarkers = []; // team markers

export let addedMarkers = []; // this is needed for this api to delete them again

//reset the map - used for going to the next round. 
export function resetMap() {
    document.getElementById("mapHolder").classList.remove("mapHolderToResult");
    document.getElementById("map").classList.remove("mapFullOpacity");

    if (map) {

        for (let i = 0; i < addedMarkers.length; i++) {
            addedMarkers[i].setMap(null);
        }

        addedMarkers = []; // Clear the array

        map.panTo({ lat: 20, lng: 0 }); // reset center
        map.setZoom(2);

        map.overlayMapTypes.clear();
    }

    //reset the guess button as well
    hasGuessed = false;
    setConfirmButtonState();
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
    if (map) {
        map.setMapTypeId(getMapType(providerIndex)); // Set the map type on the actual map
    }
    changeMapTypeButtonLabel();
}

function getMapType(provider) {
    switch (provider) {
        case Provider.STANDARD:
            return google.maps.MapTypeId.ROADMAP;
        case Provider.SATELLITE:
            return google.maps.MapTypeId.SATELLITE;
        case Provider.HYBRID:
            return google.maps.MapTypeId.HYBRID;
        case Provider.TERRAIN:
            return google.maps.MapTypeId.TERRAIN;
        default:
            return google.maps.MapTypeId.ROADMAP;
    }
}

//Placing the marker on the minimap ------------------------------------------------------------------------
export let mapMarkerLat = 0;
export let mapMarkerLong = 0;

let marker;

if (map) {
    map.addListener('click', function (e) {
        if (!resultScreenEnabled) {
            onMapClick(e.latLng);
        }
    });
}

function onMapClick(latLng) {
    //creates markers wherever the user clicks and if it clicks to another position,
    //delete the old one and also save the position in latitudes and longitudes

    hasGuessed = true;
    setConfirmButtonState();
    playSound("pin_drop", "pin");

    if (marker) {
        marker.setMap(null);
    }

    //sets the variables from the USER input (this is the one that the user has placed)
    mapMarkerLat = latLng.lat();
    mapMarkerLong = latLng.lng();

    var yourIcon = {
        url: './IMG/your_marker' + selectedPinIndex + '.png',
        size: new google.maps.Size(35, 35),
        anchor: new google.maps.Point(17.5, 34),
        origin: new google.maps.Point(0, 0),
        scaledSize: new google.maps.Size(35, 35),
    };

    marker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: yourIcon,
        clickable: false
    });

    addedMarkers.push(marker);

    sendTeamMarkers(mapMarkerLat, mapMarkerLong);
}

export function updateMinimapWithTeamMarkers(markerArray) {
    // Track existing marker positions
    let existingMarkerPositions = new Map();

    // Collect positions of current markers
    multiplayerMiniMarkers.forEach(existingMarker => {
        const position = existingMarker.getPosition();
        existingMarkerPositions.set(`${position.lat()},${position.lng()}`, existingMarker);
    });

    try {
        // Remove markers that no longer exist in markerArray
        multiplayerMiniMarkers.forEach(existingMarker => {
            const position = existingMarker.getPosition();
            const markerPositionKey = `${position.lat()},${position.lng()}`;

            // Check if current marker exists in the updated markerArray
            const markerExists = markerArray.some(element => {
                let miniMarkerLat = element[1];
                let miniMarkerLong = element[2];
                return miniMarkerLat == position.lat() && miniMarkerLong == position.lng();
            });

            // If marker doesn't exist in markerArray, remove it
            if (!markerExists) {
                existingMarker.setMap(null);
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
                const multiplayerLatLng = new google.maps.LatLng(miniMarkerLat, miniMarkerLong);
                const markerPositionKey = `${multiplayerLatLng.lat()},${multiplayerLatLng.lng()}`;

                if (!existingMarkerPositions.has(markerPositionKey)) {
                    // Marker doesn't exist, create new marker
                    const newMultiplayerIcon = {
                        url: './IMG/your_marker' + miniMarkerPinIndex + '.png',
                        size: new google.maps.Size(25, 25),
                        anchor: new google.maps.Point(15, 24),
                        origin: new google.maps.Point(0, 0),
                        scaledSize: new google.maps.Size(25, 25),
                    };

                    let marker = new google.maps.Marker({
                        position: multiplayerLatLng,
                        map: map,
                        icon: newMultiplayerIcon,
                        clickable: false
                    });

                    addedMarkers.push(marker);

                    multiplayerMiniMarkers.push(marker);
                    existingMarkerPositions.set(markerPositionKey, marker); // Update positions map
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

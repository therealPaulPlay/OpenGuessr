import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { playSound } from "$lib/utils/soundManager.js";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { guessLat, guessLon, map, addedMarkers, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { getMapBounds } from "$lib/utils/getMapBounds.js";
import { selectedPinIndex } from "$lib/stores/accountStore.js";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";
import { errorPopup } from "$lib/utils/errorHandling";

// Canonicalize a wrapped-world longitude back
// For example, if lon is 185 degrees, lon/360 >= 0.5, so it wraps it back by 360, making that -175 in this case
export function wrapBackLon(lon) {
    return lon - Math.round(lon / 360) * 360;
}

// Initialize the map
export function initMap() {
    const worldBounds = L.latLngBounds(
        L.latLng(-135, -315), // Southwest corner
        L.latLng(135, 315)    // Northeast corner
    );

    const pixelRatio = Math.max(window.devicePixelRatio, 2);

    // Initialize tile layers
    const standardMap = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en&scale=" + pixelRatio, {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        bounds: worldBounds
    });

    const terrainMap = L.tileLayer("https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en&scale=" + pixelRatio, {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        bounds: worldBounds
    });

    const satelliteMap = L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en&scale=" + pixelRatio, {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        bounds: worldBounds
    });

    const leafletMap = L.map('map', {
        zoom: 2,
        center: [0, 0],
        minZoom: 2,
        maxBounds: worldBounds,
        maxBoundsViscosity: 1.0,  // Makes the bounds restriction strict
        zoomControl: false,       // Hide zoom control
        cursor: 'crosshair'
    });

    // Set up the layer control
    const baseMaps = {
        "Standard": standardMap,
        "Terrain": terrainMap,
        "Satellite": satelliteMap
    };

    standardMap.addTo(leafletMap);

    // Add layer control (similar to mapTypeControl in Google Maps)
    L.control.layers(baseMaps, {}, {
        position: 'topleft'
    }).addTo(leafletMap);

    leafletMap.on('click', (e) => {
        onMapClick(e.latlng);
    });

    leafletMap.whenReady(() => {
        if (delayedMapReset) {
            delayedMapReset = false;
            resetMap();
        }
    })

    map.set(leafletMap);
};

// Reset map ---------------------------------------------------------------------------------------
let delayedMapReset = false;
let multiplayerMiniMarkers = []; // team markers

// Reset the map and the confirm button
export function resetMap(keepSize = false, keepPlayerPinCoords = false) {
    if (!get(map)) return delayedMapReset = true;

    // Clear all markers
    get(addedMarkers)?.forEach(marker => {
        get(map).removeLayer(marker);
    });
    addedMarkers.set([]);

    // Reset placed player pin location
    if (!keepPlayerPinCoords) {
        guessLat.set(0);
        guessLon.set(0);
    }

    // Reset the guess button
    confirmButtonActive.set(false);

    // Set map view to focus on current map
    setTimeout(() => {
        // Delayed since the result map transition can cause the view to shift
        if (!keepSize) adjustMapToCountry();
    }, 150);
}

// For most maps, adjust the boundaries to the map's locations
async function adjustMapToCountry() {
    const mapCenterAndZoom = getMapBounds();
    get(map).setView(new L.LatLng(mapCenterAndZoom.lat, mapCenterAndZoom.lng), mapCenterAndZoom.zoom);
}

// Placing the marker on the minimap ------------------------------------------------------------------------
let marker;

// Squash and stretch
function animatePinLanding(pinElement) {
    const position = pinElement.style.transform;
    pinElement.style.transformOrigin = "50% 97%"; // Tip of pin (97% because the tip is almost all the way at the bottom)

    // .animate method is like CSS keyframes but applied via JS
    pinElement.animate([
        { transform: position + " scale(1.06, 0.88)" },
        { transform: position + " scale(0.97, 1.04)", offset: 0.4 },
        { transform: position + " scale(1, 1)" }
    ], { duration: 250, easing: "ease-out" });
}

function onMapClick(latLng) {
    if (get(resultScreenEnabled) || !get(mapInteractive)) return; // Placing a pin is disabled on result screen or when the map is not interactive

    try {
        confirmButtonActive.set(true);
        playSound("pin_drop", "pin");

        if (marker) {
            get(map).removeLayer(marker);
        }

        // Set map marker position to user input
        guessLat.set(latLng.lat);
        guessLon.set(latLng.lng);

        let yourIcon = new L.Icon({
            iconUrl: "/img/pins/player_pin" + get(selectedPinIndex) + ".png",
            iconSize: [35, 35],
            iconAnchor: [17.5, 34],
            popupAnchor: [1, -34]
        });

        marker = new L.Marker([latLng.lat, latLng.lng], { icon: yourIcon, alt: "" });
        marker.addTo(get(map));

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, marker]
        });

        animatePinLanding(marker.getElement());

        if (get(multiplayer)) {
            get(socket)?.sendRequest("addGuessMarker", { lat: get(guessLat), lon: get(guessLon) }).catch((error) => {
                if (get(multiplayer)) errorPopup("Failed to add map marker", "An error occured adding the guess marker for multiplayer.", error.message);
                console.error("Error adding guess marker for multiplayer:", error);
            });
        }
    } catch (error) {
        console.error("Error in onMapClick function:", error)
    }
}

export function updateMinimapWithTeamMarkers(markerArray) {
    // Remove existing mini markers
    multiplayerMiniMarkers.forEach(existingMarker => {
        get(map)?.removeLayer(existingMarker);
    });

    try {
        // Add new markers from markerArray that belong to yourTeam
        markerArray.forEach(element => {
            let miniMarkerId = element.id;
            let miniMarkerLat = element.lat;
            let miniMarkerLon = element.lon;
            let miniMarkerPinIndex = element.pin;
            let miniMarkerTeam = element.team;

            // Only add new marker if miniMarkerId is not equal to peerId (meaning the marker is your own marker)
            if (miniMarkerId != get(socket)?.id && miniMarkerTeam === getTeamFromClientId(get(socket)?.id)) {
                const multiplayerLatLng = new L.LatLng(miniMarkerLat, wrapBackLon(miniMarkerLon));

                let newMultiplayerIcon = new L.Icon({
                    iconUrl: "/img/pins/player_pin" + (miniMarkerPinIndex ?? 0) + ".png",
                    iconSize: [35, 35],
                    iconAnchor: [17.5, 34],
                    popupAnchor: [1, -34]
                });

                let marker = new L.marker(multiplayerLatLng, { icon: newMultiplayerIcon, alt: "" });
                marker.setOpacity(0.65);
                marker.addTo(get(map));

                addedMarkers.update((markers) => {
                    markers = markers || [];
                    return [...markers, marker]
                });

                multiplayerMiniMarkers.push(marker);
            }
        });

    } catch (error) {
        console.error("Error updating minimap with team markers: " + error);
    }
}
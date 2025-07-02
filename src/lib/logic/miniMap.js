import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { addMultiplayerGuessMarker, getTeamFromMultiplayerId } from "$lib/logic/multiplayerLogic";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { playSound } from "$lib/utils/soundManager.js";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { mapPinLat, mapPinLng, map, addedMarkers, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { getMapBounds } from "$lib/utils/getMapBounds.js";
import { selectedPinIndex } from "$lib/stores/accountStore.js";
import { mapHovered } from "$lib/stores/context-specific/mapStore.js";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";
import { showNotification } from "$lib/utils/notifications";

// Initialize the map
export function initMap() {
    const worldBounds = L.latLngBounds(
        L.latLng(-135, -315), // Southwest corner
        L.latLng(135, 315)    // Northeast corner
    );

    const pixelRatio = Math.max(window.devicePixelRatio, 2);

    // Initialize providers
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
        center: [20, 0],
        zoom: 2,
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

    map.set(leafletMap);
};

// Reset map ---------------------------------------------------------------------------------------

let multiplayerMiniMarkers = []; // team markers

// Reset the map and the confirm button
export function resetMap(keepSize) {
    if (get(map)) {
        mapHovered.set(false);

        get(addedMarkers)?.forEach(marker => {
            get(map).removeLayer(marker);
        });

        addedMarkers.set([]); // Clear the array
        if (!keepSize) adjustMapToCountry();
    }

    // Reset the guess button as well
    confirmButtonActive.set(false);
}

// For most maps, adjust the boundaries to the map's locations
async function adjustMapToCountry() {
    const mapCenterAndZoom = getMapBounds();
    get(map).setView(new L.LatLng(mapCenterAndZoom.lat, mapCenterAndZoom.lng), mapCenterAndZoom.zoom);
}

// Placing the marker on the minimap ------------------------------------------------------------------------
let marker;

function onMapClick(latLng) {
    if (get(resultScreenEnabled)) return; // Placing a pin is disabled on result screen
    if (!get(mapInteractive)) return showNotification("Cannot place a pin now.");

    try {
        confirmButtonActive.set(true);
        playSound("pin_drop", "pin");

        if (marker) {
            get(map).removeLayer(marker);
        }

        // Set Map Marker Position to user input
        mapPinLat.set(latLng.lat);
        mapPinLng.set(latLng.lng);

        let yourIcon = new L.Icon({
            iconUrl: '/img/pins/player_pin' + get(selectedPinIndex) + '.png',
            iconSize: [35, 35],
            iconAnchor: [17.5, 34],
            popupAnchor: [1, -34]
        });

        marker = new L.Marker([latLng.lat, latLng.lng], { icon: yourIcon });
        marker.addTo(get(map));

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, marker]
        });

        if (get(multiplayer)) addMultiplayerGuessMarker();
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
            let miniMarkerLong = element.long;
            let miniMarkerPinIndex = element.pin;
            let miniMarkerTeam = element.team;

            // Only add new marker if miniMarkerId is not equal to peerId (meaning the marker is your own marker)
            if (miniMarkerId != get(socket)?.id && miniMarkerTeam === getTeamFromMultiplayerId(get(socket)?.id)) {
                const multiplayerLatLng = new L.LatLng(miniMarkerLat, miniMarkerLong);

                let newMultiplayerIcon = new L.Icon({
                    iconUrl: "/img/pins/player_pin" + miniMarkerPinIndex + ".png",
                    iconSize: [35, 35],
                    iconAnchor: [17.5, 34],
                    popupAnchor: [1, -34]
                });

                let marker = new L.marker(multiplayerLatLng, { icon: newMultiplayerIcon });
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
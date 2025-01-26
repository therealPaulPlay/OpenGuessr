import { peer } from "$lib/stores/context-specific/multiplayerStore";
import { addMultiplayerGuessMarker, getTeamFromPeerId } from "$lib/logic/multiplayerLogic";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { playSound } from "$lib/utils/soundManager.js";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { mapPinLat, mapPinLng, map, addedMarkers } from "$lib/stores/context-specific/mapStore.js";
import { getMapBounds } from "$lib/utils/getMapBounds.js";
import { selectedPinIndex } from "$lib/stores/accountStore.js";
import { mapHovered } from "$lib/stores/context-specific/mapStore.js";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";

// Initialize the map
export function initMap() {
    const worldBounds = L.latLngBounds(
        L.latLng(-135, -315), // Southwest corner
        L.latLng(135, 315)    // Northeast corner
    );

    // Initialize providers
    const standardMap = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en&scale=2", {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        bounds: worldBounds
    });

    const terrainMap = L.tileLayer("https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en&scale=2", {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        bounds: worldBounds
    });

    const satelliteMap = L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en&scale=2", {
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

//reset the map - used for going to the next round. 
export function resetMap(keepSize) {
    if (get(map)) {
        mapHovered.set(false);

        get(addedMarkers)?.forEach(marker => {
            get(map).removeLayer(marker);
        });

        addedMarkers.set([]); // Clear the array
        if (!keepSize) adjustMapToCountry();
    }

    // reset the guess button as well
    confirmButtonActive.set(false);
}

// For most maps, adjust the boundaries to the map's locations
async function adjustMapToCountry() {
    const mapCenterAndZoom = getMapBounds();
    get(map).setView(new L.LatLng(mapCenterAndZoom.lat, mapCenterAndZoom.lng), mapCenterAndZoom.zoom)
}

// Placing the marker on the minimap ------------------------------------------------------------------------
let marker;

function onMapClick(latLng) {
    if (get(resultScreenEnabled)) return; // Placing a pin is disabled on result screen

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
            iconUrl: '/img/your_marker' + get(selectedPinIndex) + '.png',
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
    let existingMarkerPositions = new Map();

    // Collect positions of current markers
    multiplayerMiniMarkers.forEach(existingMarker => {
        const position = existingMarker.getLatLng();
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
                get(map).removeLayer(existingMarker);
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
            if (miniMarkerId != get(peer)?.id && miniMarkerTeam === getTeamFromPeerId(get(peer)?.id)) {
                const multiplayerLatLng = new L.LatLng(miniMarkerLat, miniMarkerLong);
                const markerPositionKey = `${multiplayerLatLng.lat},${multiplayerLatLng.lng}`;

                if (!existingMarkerPositions.has(markerPositionKey)) {
                    // Marker doesn't exist, create new marker

                    let newMultiplayerIcon = new L.Icon({
                        iconUrl: "/img/your_marker" + miniMarkerPinIndex + ".png",
                        iconSize: [35, 35],
                        iconAnchor: [17.5, 34],
                        popupAnchor: [1, -34]
                    });


                    let marker = new L.marker(multiplayerLatLng, { icon: newMultiplayerIcon });
                    marker.setOpacity(0.5);
                    marker.addTo(get(map));

                    addedMarkers.update((markers) => {
                        markers = markers || [];
                        return [...markers, marker]
                    });

                    multiplayerMiniMarkers.push(marker);
                    existingMarkerPositions.set(markerPositionKey, marker); // Update positions map
                }
            }
        });

    } catch (error) {
        console.error("Error updating minimap with team markers: " + error);
    }
}
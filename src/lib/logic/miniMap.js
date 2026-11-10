import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { playSound } from "$lib/utils/soundManager.js";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { guessLat, guessLon, map, addedMarkers, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { selectedPinIndex } from "$lib/stores/accountStore.js";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";
import { mapBounds } from "$lib/stores/locationStore";
import { MAP_SIZE_TRANSITION_DURATION } from "$lib/components/Map.svelte";

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
    const tileLayerOptions = {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        bounds: worldBounds
    };

    const standardMap = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en&scale=" + pixelRatio, tileLayerOptions);
    const terrainMap = L.tileLayer("https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en&scale=" + pixelRatio, tileLayerOptions);
    const satelliteMap = L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en&scale=" + pixelRatio, tileLayerOptions);

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

    map.set(leafletMap);

    // Has to be set after assigning map (via map.set()) since resetMap() and resetMapView() use map
    leafletMap.whenReady(() => {
        if (resetMapOnLoad) {
            resetMapOnLoad = false;
            resetMap();
        }
        if (resetMapViewOnLoad) {
            resetMapViewOnLoad = false;
            resetMapView();
        }
    })
};

// Reset map ---------------------------------------------------------------------------------------
let resetMapOnLoad = false;
let resetMapViewOnLoad = false;

// Reset the map and the confirm button
export function resetMap(forResult = false) {
    if (!get(map)) return resetMapOnLoad = true;

    // Clear all markers
    get(addedMarkers)?.forEach(marker => {
        get(map).removeLayer(marker);
    });
    addedMarkers.set([]);

    // Reset placed player pin location
    if (!forResult) {
        guessLat.set(0);
        guessLon.set(0);
    }

    // Reset the guess button
    confirmButtonActive.set(false);

    if (!forResult) resetMapView();
}

// Reset the map after the result screen shrink transition to avoid moving the view while it's closing (looks jarring)
export function deferredMapReset(skipInMultiplayer = false) {
    return new Promise((res) => setTimeout(() => {
        if (get(resultScreenEnabled)) return res(); // If another result was opened in the meantime, don't clear it
        if (skipInMultiplayer && get(multiplayer)) return res(); // If now in a multiplayer room, don't clear its synced state
        resetMap();
        res();
    }, MAP_SIZE_TRANSITION_DURATION));
}

// Set map view to focus on current map (e.g. on Austria map, it should set the view to frame Austria)
export function resetMapView() {
    if (!get(map)) return resetMapViewOnLoad = true;
    const mapCenterAndZoom = get(mapBounds);
    get(map).setView(new L.LatLng(mapCenterAndZoom.lat, mapCenterAndZoom.lng), mapCenterAndZoom.zoom);
}

// Placing the marker on the minimap ------------------------------------------------------------------------
let guessMarker;

// Squash and stretch
function animatePinLanding(pinElement) {
    const position = pinElement.style.transform;
    pinElement.style.transformOrigin = "50% 97%"; // Tip of pin (97% because the tip is almost all the way at the bottom)

    // .animate method is like CSS keyframes but applied via JS
    pinElement.animate([
        { transform: position + " scale(1.04, 0.94)" },
        { transform: position + " scale(0.97, 1.04)", offset: 0.4 },
        { transform: position + " scale(1, 1)" }
    ], { duration: 150, easing: "ease-out" });
}

function onMapClick(latLng) {
    if (get(resultScreenEnabled) || !get(mapInteractive)) return; // Placing a pin is disabled on result screen or when the map is not interactive

    try {
        confirmButtonActive.set(true);
        playSound("pin_drop", "pin");

        // Set map marker position to user input
        guessLat.set(latLng.lat);
        guessLon.set(latLng.lng);
        updateMinimapWithGuessMarker(latLng.lat, latLng.lng);

        if (get(multiplayer)) {
            // Get player and create guess data
            const player = get(socket)?.storage?.players?.find((p) => p.clientId === get(socket)?.id);
            const guess = { clientId: get(socket)?.id, userId: player?.userId, lat: latLng.lat, lon: latLng.lng, username: player?.username, pin: player?.pin, teamIndex: player?.teamIndex, scoreAdded: false };

            // Add the guess
            const existingGuess = get(socket)?.storage?.guesses?.find((g) => g.clientId === get(socket)?.id);
            if (existingGuess) get(socket)?.updateStorage("guesses", "array-update-matching", existingGuess, guess);
            else get(socket)?.updateStorage("guesses", "array-add", guess);
        }
    } catch (error) {
        console.error("Error in onMapClick function:", error)
    }
}

export function updateMinimapWithGuessMarker(lat, lon) {
    if (!get(map)) return;

    // Remove existing guess marker
    if (guessMarker) get(map).removeLayer(guessMarker);
    addedMarkers.update((markers) => (markers || []).filter((marker) => marker !== guessMarker));
    guessMarker = null;

    if (lat != null && lon != null) {
        const yourIcon = new L.Icon({
            iconUrl: "/img/pins/player_pin" + get(selectedPinIndex) + ".png",
            iconSize: [35, 35],
            iconAnchor: [17.5, 34],
            popupAnchor: [1, -34]
        });

        guessMarker = new L.Marker(new L.LatLng(lat, lon), { icon: yourIcon, alt: "", interactive: false, keyboard: false });
        guessMarker.addTo(get(map));
        animatePinLanding(guessMarker.getElement());

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, guessMarker]
        });
    }
}

let drawnTeamMarkers = []; // Team markers

export function updateMinimapWithTeamMarkers(markerArray) {
    // Remove existing mini markers
    drawnTeamMarkers.forEach(existingMarker => {
        get(map)?.removeLayer(existingMarker);
    });
    addedMarkers.update((markers) => (markers || []).filter((marker) => !drawnTeamMarkers.includes(marker)));
    drawnTeamMarkers = [];

    try {
        // Add new markers from markerArray that belong to yourTeam
        markerArray.forEach(element => {
            const miniMarkerId = element.clientId;
            const miniMarkerLat = element.lat;
            const miniMarkerLon = element.lon;
            const miniMarkerPinIndex = element.pin;
            const miniMarkerTeam = element.teamIndex;

            // Only add new marker if miniMarkerId is not equal to peerId (meaning the marker is your own marker)
            if (miniMarkerId != get(socket)?.id && miniMarkerTeam === getTeamFromClientId(get(socket)?.id)) {
                const multiplayerLatLng = new L.LatLng(miniMarkerLat, wrapBackLon(miniMarkerLon));

                const newMultiplayerIcon = new L.Icon({
                    iconUrl: "/img/pins/player_pin" + (miniMarkerPinIndex ?? 0) + ".png",
                    iconSize: [35, 35],
                    iconAnchor: [17.5, 34],
                    popupAnchor: [1, -34]
                });

                const marker = new L.marker(multiplayerLatLng, { icon: newMultiplayerIcon, alt: "", interactive: false, keyboard: false });
                marker.setOpacity(0.65);
                marker.addTo(get(map));

                addedMarkers.update((markers) => {
                    markers = markers || [];
                    return [...markers, marker]
                });

                drawnTeamMarkers.push(marker);
            }
        });

    } catch (error) {
        console.error("Error updating minimap with team markers: " + error);
    }
}
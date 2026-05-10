import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { playSound } from "$lib/utils/soundManager.js";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { mapPinLat, mapPinLng, map, addedMarkers, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { getMapBounds } from "$lib/utils/getMapBounds.js";
import { selectedPinIndex } from "$lib/stores/accountStore.js";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";

// Google Maps init --------------------------------------------------------------------------------------
async function loadGoogleMapsApi(apiKey) {
    await new Promise((resolve, reject) => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            resolve(window.google.maps);
            return;
        }

        // Create a script element to load the API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
        script.async = true;

        // Resolve the promise when the script loads
        script.onload = () => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                reject(new Error('Google Maps API script loaded, but no google.maps object found.'));
            }
        };

        script.onerror = () => {
            reject(new Error('Failed to load the Google Maps API script.'));
        };

        document.head.appendChild(script);
    });
}

const worldBounds = {
    north: 90,
    south: -90,
    west: -190,
    east: 190
};

async function initMap() {
    mapInitialized = true;

    await loadGoogleMapsApi("PLACEHOLDER");

    const { Map } = await window.google.maps.importLibrary("maps");

    map.set(
        new Map(document.getElementById("map"), {
            center: { lat: 20, lng: 0 },
            zoom: 2,
            streetViewControl: false, // Hide Street View control
            zoomControl: false,       // Hide zoom control
            fullscreenControl: false, // Hide fullscreen control
            draggableCursor: "crosshair",
            mapTypeControlOptions: {
                style: window.google.maps.MapTypeControlStyle.DEFAULT,
                mapTypeIds: [
                    window.google.maps.MapTypeId.ROADMAP, // Standard view
                    window.google.maps.MapTypeId.HYBRID, // Satellite view with labels
                ],
            },
            clickableIcons: false,
            restriction: {
                latLngBounds: worldBounds,
                strictBounds: true, // Enforce the restriction
            }
        }));

    get(map).addListener("click", function (e) {
        onMapClick(e.latLng);
    });

    adjustMapToCountry();

    document.dispatchEvent(new Event("mapInitialized"));
}

// Trigger map initialization delayed --------------------------------------------------------------
let mapInitialized = false;

export async function initializeMapIfNotAlready() {
    if (!mapInitialized) await initMap();
}

// Reset map ---------------------------------------------------------------------------------------
let multiplayerMiniMarkers = []; // team markers

// Reset the map - used for going to the next round. 
export function resetMap(keepSize) {
    if (get(map)) {
        if (get(addedMarkers)) {
            for (let i = 0; i < get(addedMarkers).length; i++) {
                get(addedMarkers)[i].setMap(null);
            }
        }

        addedMarkers.set([]); // Clear the array
        adjustMapToCountry();
        get(map).overlayMapTypes.clear();
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
    get(map).panTo({ lat: mapCenterAndZoom.lat, lng: mapCenterAndZoom.lng });
    get(map).setZoom(mapCenterAndZoom.zoom);
}

// Placing the marker on the minimap ------------------------------------------------------------------------
let marker;

function onMapClick(latLng) {
    if (get(resultScreenEnabled) || !get(mapInteractive)) return; // Placing a pin is disabled on result screen or when the map is not interactive

    try {
        confirmButtonActive.set(true);
        playSound("pin_drop", "pin");

        if (marker) {
            marker.setMap(null);
        }

        // Set Map Marker Position to user input
        mapPinLat.set(latLng.lat());
        mapPinLng.set(latLng.lng());

        let yourIcon = {
            url: "/img/pins/player_pin" + get(selectedPinIndex) + ".png",
            size: new window.google.maps.Size(35, 35),
            anchor: new window.google.maps.Point(17.5, 34),
            origin: new window.google.maps.Point(0, 0),
            scaledSize: new window.google.maps.Size(35, 35),
        };

        marker = new window.google.maps.Marker({
            position: latLng,
            map: get(map),
            icon: yourIcon,
            clickable: false
        });

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, marker]
        });

        if (get(multiplayer)) get(socket).sendRequest("addGuessMarker", { lat: get(mapPinLat), lon: get(mapPinLng) });
    } catch (error) {
        console.error("Error in onMapClick function:", error)
    }
}

export function updateMinimapWithTeamMarkers(markerArray) {
    // Remove existing mini markers
    multiplayerMiniMarkers.forEach(existingMarker => {
        existingMarker?.setMap(null);
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
                const multiplayerLatLng = new window.google.maps.LatLng(miniMarkerLat, miniMarkerLon);

                const newMultiplayerIcon = {
                    url: "/img/pins/player_pin" + (miniMarkerPinIndex ?? 0) + ".png",
                    size: new window.google.maps.Size(25, 25),
                    anchor: new window.google.maps.Point(15, 24),
                    origin: new window.google.maps.Point(0, 0),
                    scaledSize: new window.google.maps.Size(25, 25),
                };

                let marker = new window.google.maps.Marker({
                    position: multiplayerLatLng,
                    map: get(map),
                    icon: newMultiplayerIcon,
                    clickable: false
                });

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
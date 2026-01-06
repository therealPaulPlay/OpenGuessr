import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore.js";
import { showNotification } from "$lib/utils/notifications.js";
import { showConfirmPopup } from "$lib/utils/confirmPopup.js";
import { playSound } from "$lib/utils/soundManager.js";
import { errorPopup } from "$lib/utils/errorHandling.js";
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { mapPinLat, mapPinLng, map, addedMarkers, mapInteractive } from "$lib/stores/context-specific/mapStore.js";
import { captchaPopupVisible } from "$lib/stores/context-specific/captchaPopupStore.js";
import { getMapBounds } from "$lib/utils/getMapBounds.js";
import { selectedPinIndex } from "$lib/stores/accountStore.js";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";

// Google Maps init --------------------------------------------------------------------------------------
let captchaToken;

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

// Ensure that the user has not exceeded a certain limit of map loads
async function requestMapLoad() {
    showNotification("Loading minimap..");

    let headers;

    if (localStorage.getItem("bearer")) {
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("bearer")}`,
            'cf-turnstile-response': captchaToken
        };
    } else {
        headers = {
            'Content-Type': 'application/json',
            'cf-turnstile-response': captchaToken
        };
    }

    const mapLimitUrl = "https://accounts.openguessr.com/accounts/maplimit?time=" + new Date().getTime();

    try {
        const response = await fetch(mapLimitUrl, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();

            await new Promise(async (resolve) => {
                if (data.apiKey.keyString) {
                    // Load the Google Maps API with the provided key
                    await loadGoogleMapsApi(data.apiKey.keyString);
                    resolve();
                } else {
                    console.error("No api key returned by the maplimit endpoint.");
                    resolve();
                }
            });

            if (data.rateLimit) {
                displayMaploadUsage(data.rateLimit.used, data.rateLimit.limit);
            }

            return true;
        } else {
            const data = await response.json();
            console.error("Map load limit reached: " + data.error);
            errorPopup("Daily minimap load limit reached", "To prevent extraordinarily high Google API costs, your map load request was denied due to too many refreshes. Become a supporter to increase your limit!", data.error, false, false);
            return false;
        }
    } catch (error) {
        console.error('Error occurred while checking for the map load limit: ' + error);
        errorPopup("Failed to validate minimap load", "The system that validates minimap loads didn't respond.", "Network error.", false, false);
        return false;
    }
}

function displayMaploadUsage(used, limit) {
    showNotification(`(${used}/${limit}) daily minimap loads used.`, () => {
        showConfirmPopup("What are minimap loads?", "A daily load is only used when you first open the minimap after loading the site, meaning your playtime remains unrestricted. The available amount resets every day.", false, false, false, true);
    }, false, true, true);
}

const worldBounds = {
    north: 90,
    south: -90,
    west: -190,
    east: 190
};

async function initMap() {
    if (!mapInitialized && await requestMapLoad()) {
        mapInitialized = true;

        const { Map } = await google.maps.importLibrary("maps");

        map.set(
            new Map(document.getElementById("map"), {
                center: { lat: 20, lng: 0 },
                zoom: 2,
                streetViewControl: false, // Hide Street View control
                zoomControl: false,       // Hide zoom control
                fullscreenControl: false, // Hide fullscreen control
                draggableCursor: "crosshair",
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DEFAULT,
                    mapTypeIds: [
                        google.maps.MapTypeId.ROADMAP, // Standard view
                        google.maps.MapTypeId.HYBRID, // Satellite view with labels
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
}

// Trigger map initialization delayed --------------------------------------------------------------
let mapInitialized = false;
let currentlyInitializing = false;

export async function initializeMapIfNotAlready() {
    if (!mapInitialized && !currentlyInitializing && !captchaToken) {
        captchaPopupVisible.set(true);
    }
}

// Callback from the captcha
if (typeof window !== "undefined") {
    window.onTurnstileCallback = async function (token) {
        if (!currentlyInitializing) {
            currentlyInitializing = true;
            captchaToken = token;

            captchaPopupVisible.set(false);

            // After acquiring the token, initalize the map
            await initMap();
            currentlyInitializing = false;
        }
    };
}

// Reset map ---------------------------------------------------------------------------------------
let multiplayerMiniMarkers = []; // team markers

// Reset the map - used for going to the next round. 
export function resetMap() {
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
            url: '/img/pins/player_pin' + get(selectedPinIndex) + '.png',
            size: new google.maps.Size(35, 35),
            anchor: new google.maps.Point(17.5, 34),
            origin: new google.maps.Point(0, 0),
            scaledSize: new google.maps.Size(35, 35),
        };

        marker = new google.maps.Marker({
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
            if (miniMarkerId != get(peerId) && miniMarkerTeam === getTeamFromClientId(get(socket)?.id)) {
                const multiplayerLatLng = new google.maps.LatLng(miniMarkerLat, miniMarkerLon);

                const newMultiplayerIcon = {
                    url: '/img/pins/player_pin' + miniMarkerPinIndex + '.png',
                    size: new google.maps.Size(25, 25),
                    anchor: new google.maps.Point(15, 24),
                    origin: new google.maps.Point(0, 0),
                    scaledSize: new google.maps.Size(25, 25),
                };

                let marker = new google.maps.Marker({
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
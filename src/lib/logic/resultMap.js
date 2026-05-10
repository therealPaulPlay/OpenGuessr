import { map, addedMarkers } from "$lib/stores/context-specific/mapStore";
import { initializeMapIfNotAlready } from "$lib/logic/miniMap";
import { selectedPinIndex } from "$lib/stores/accountStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { multiplayer, countryGuessr } from "$lib/stores/modeStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { wrapBackLon } from "$lib/logic/miniMap";
import { get } from "svelte/store";

async function awaitMapInit() {
    return new Promise(resolve => document.addEventListener("mapInitialized", () => { resolve(); }));
}

export async function loadResultMap(guessLat, guessLon, correctLat, correctLon) {
    if (!get(map)) {
        // Trigger the captcha popup, which results in a map load, then await the map load
        initializeMapIfNotAlready();
        await awaitMapInit();

        if (!get(map)) {
            console.error("Map not properly inizialized - exiting result map load function.");
            return;
        }
    }

    // Define custom icons for markers
    const yourIcon = {
        url: "/img/pins/player_pin" + get(selectedPinIndex) + ".png",
        size: new window.google.maps.Size(35, 35),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(17.5, 34),
        scaledSize: new window.google.maps.Size(35, 35)
    };

    const resultIcon = {
        url: '/img/pins/result_pin.png',
        size: new window.google.maps.Size(35, 35),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(17.5, 34),
        scaledSize: new window.google.maps.Size(35, 35)
    };

    const correctLatLng = new window.google.maps.LatLng(correctLat, correctLon);

    let bounds = null; // Boundaries adjusted to guess and correct location

    // Add player marker and polyline
    if (!get(countryGuessr)) {
        const guessLatLng = new window.google.maps.LatLng(guessLat, guessLon);
        bounds = new window.google.maps.LatLngBounds(correctLatLng, guessLatLng);

        const playerMarker = new window.google.maps.Marker({
            position: guessLatLng,
            map: get(map),
            icon: yourIcon
        });

        if (get(multiplayer)) {
            const playerInfoWindow = new window.google.maps.InfoWindow({
                content: "You"
            });
            playerMarker.addListener('click', function () {
                playerInfoWindow.open(get(map), playerMarker);
            });
        }

        const polyline = new window.google.maps.Polyline({
            path: [correctLatLng, guessLatLng],
            map: get(map),
            strokeColor: "black",
            strokeWeight: 1,
            strokeOpacity: 0.75
        });

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, playerMarker, polyline];
        });
    }

    // Add multiplayer markers
    if (get(multiplayer)) {
        get(socket)?.storage?.guessLocationsArray?.forEach(element => {
            // If this is the local one by this player, skip
            if (element.id === get(socket)?.id) return;

            // Handle edge cases for coordinates
            let lat = element.lat ?? 0;
            let lon = element.lon ?? 0;
            if (isNaN(lat) || isNaN(lon)) { lat = 0; lon = 0; }
            lon = wrapBackLon(lon);

            const multiplayerIcon = {
                url: "/img/pins/player_pin" + (element.pin ?? 0) + ".png",
                size: new window.google.maps.Size(35, 35),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(17.5, 34),
                scaledSize: new window.google.maps.Size(35, 35)
            };

            const multiplayerMarker = new window.google.maps.Marker({
                position: new window.google.maps.LatLng(lat, lon),
                map: get(map),
                icon: multiplayerIcon,
                opacity: 0.75
            });

            const multiplayerInfoWindow = new window.google.maps.InfoWindow({
                content: element.username
            });
            multiplayerMarker.addListener('click', function () {
                multiplayerInfoWindow.open(get(map), multiplayerMarker);
            });

            const multiplayerPolyline = new window.google.maps.Polyline({
                path: [correctLatLng, new window.google.maps.LatLng(lat, lon)],
                map: get(map),
                strokeColor: "black",
                strokeWeight: 1,
                strokeOpacity: 0.25
            });

            addedMarkers.update((markers) => {
                markers = markers || [];
                return [...markers, multiplayerMarker, multiplayerPolyline];
            });
        });
    }

    // Place the destination marker
    const destinationMarker = new window.google.maps.Marker({
        position: { lat: correctLat, lng: correctLon },
        map: get(map),
        icon: resultIcon
    });

    addedMarkers.update((markers) => {
        markers = markers || [];
        return [...markers, destinationMarker];
    });

    // Set initial view and start fly animation
    if (!get(countryGuessr)) {
        // Normal: Start zoomed in on player's guess
        get(map).fitBounds(bounds);
        const currentZoom = get(map).getZoom();
        const startZoom = Math.min(currentZoom + 1.5, 16);
        get(map).setZoom(startZoom);
        get(map).setCenter({ lat: guessLat, lng: guessLon });
        setTimeout(() => flyToLocation(bounds, correctLat, correctLon), 250);
    } else {
        // Country Guesser: Start zoomed out, then zoom in on destination
        get(map).setZoom(5);
        get(map).setCenter({ lat: correctLat, lng: correctLon });
        setTimeout(() => flyToLocation(null, correctLat, correctLon), 250);
    }
}

function flyToLocation(bounds, destLat, destLon) {
    if (!get(resultScreenEnabled)) return;

    // Force map size recalculation to ensure bounds and padding works correctly
    // The resize observer on the map seems to be paused when the tab goes to the background, this is a safeguard
    get(map).invalidateSize();

    if (bounds) {
        get(map).fitBounds(bounds, {
            bottom: 250,
            left: 0,
            right: 0,
            top: 250
        });
    } else {
        get(map).setZoom(6);
        get(map).setCenter({ lat: destLat, lng: destLon });
    }
}
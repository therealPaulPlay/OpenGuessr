import { map, addedMarkers } from "$lib/stores/context-specific/mapStore";
import { selectedPinIndex } from "$lib/stores/accountStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { multiplayer, countryGuessr } from "$lib/stores/modeStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { clamp } from "$lib/utils/clamp";
import { get } from "svelte/store";

export async function loadResultMap(guessLat, guessLon, correctLat, correctLon) {
    if (!get(map)) {
        console.error("Map not properly initialized - exiting result map load function.");
        return;
    }

    // Define custom icons for markers
    const yourIcon = new L.Icon({
        iconUrl: '/img/pins/player_pin' + get(selectedPinIndex) + '.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    const resultIcon = new L.Icon({
        iconUrl: '/img/pins/result_pin.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34]
    });

    const correctLatLng = new L.LatLng(correctLat, correctLon);

    let bounds = null; // Boundaries adjusted to guess and correct location

    // Add player marker and polyline
    if (!get(countryGuessr)) {
        const guessLatLng = new L.LatLng(guessLat, guessLon);
        bounds = new L.LatLngBounds([correctLatLng, guessLatLng]);

        const playerMarker = new L.Marker(guessLatLng, { icon: yourIcon });
        if (get(multiplayer)) playerMarker.bindTooltip("You", { permanent: true, direction: 'right' });
        playerMarker.addTo(get(map));

        const polyline = new L.Polyline([correctLatLng, guessLatLng], {
            color: "black",
            weight: 1,
            opacity: 0.75
        }).addTo(get(map));

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, playerMarker, polyline];
        });
    }

    // Add multiplayer markers
    if (get(multiplayer)) {
        get(socket)?.getStorage?.guessLocationsArray?.forEach(element => {
            // If this is the local one by this player, skip
            if (element.id === get(socket)?.id) return;

            // Handle edge cases for coordinates
            let lat = element.lat ?? 0;
            let lon = element.lon ?? 0;
            if (isNaN(lat) || isNaN(lon)) { lat = 0; lon = 0; }

            const multiplayerIcon = new L.Icon({
                iconUrl: `/img/pins/player_pin${element.pin ?? 0}.png`,
                iconSize: [35, 35],
                iconAnchor: [17.5, 34],
                popupAnchor: [1, -34]
            });

            const multiplayerMarker = new L.Marker([lat, lon], { icon: multiplayerIcon, opacity: 0.75 });
            multiplayerMarker.bindTooltip(element.username, { permanent: true, direction: 'right' });
            multiplayerMarker.addTo(get(map));

            const multiplayerPolyline = new L.Polyline([correctLatLng, [lat, lon]], {
                color: "black",
                weight: 1,
                opacity: 0.25
            }).addTo(get(map));

            addedMarkers.update((markers) => {
                markers = markers || [];
                return [...markers, multiplayerMarker, multiplayerPolyline];
            });
        });
    }

    // Place the destination marker
    const destinationMarker = new L.Marker([correctLat, correctLon], { icon: resultIcon });
    destinationMarker.addTo(get(map));

    addedMarkers.update((markers) => {
        markers = markers || [];
        return [...markers, destinationMarker];
    });

    // Set initial view and start fly animation
    if (!get(countryGuessr)) {
        // Normal: Start zoomed in on player's guess
        const boundsZoom = get(map).getBoundsZoom(bounds, false);
        const startZoom = Math.min(boundsZoom + 1.5, 16);
        get(map).setView([guessLat, guessLon], startZoom, { animate: false });
        setTimeout(() => flyToLocation(bounds, correctLat, correctLon), 250);
    } else {
        // Country Guesser: Start zoomed out, then zoom in on destination
        get(map).setView([correctLat, correctLon], 5, { animate: false });
        setTimeout(() => flyToLocation(null, correctLat, correctLon), 250);
    }
}

function flyToLocation(bounds, destLat, destLon) {
    if (!get(resultScreenEnabled)) return;

    // Force map size recalculation to ensure bounds and padding works correctly
    // The resize observer on the map seems to be paused when the tab goes to the background, this is a safeguard
    get(map).invalidateSize();

    if (bounds) {
        const paddedBounds = bounds.pad(0.35);
        get(map).flyToBounds(paddedBounds, {
            duration: 0.5
        });
    } else {
        get(map).flyTo([destLat, destLon], 6, {
            duration: 0.5
        });
    }
}
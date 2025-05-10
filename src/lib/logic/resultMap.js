import { map, addedMarkers } from "$lib/stores/context-specific/mapStore";
import { selectedPinIndex } from "$lib/stores/accountStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { multiplayer, countryGuessr } from "$lib/stores/modeStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { clamp } from "$lib/utils/clamp";
import { get } from "svelte/store";

export async function loadResultMap(guessLat, guessLong, correctLat, correctLong) {
    if (!get(map)) {
        console.error("Map not properly inizialized - exiting result map load function.");
        return;
    }

    // Define custom icons for markers
    const yourIcon = new L.Icon({
        iconUrl: '/img/your_marker' + get(selectedPinIndex) + '.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    const resultIcon = new L.Icon({
        iconUrl: '/img/result_marker.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34]
    });

    // Create LatLng objects for current and player positions
    let curLatLng = new L.LatLng(correctLat, correctLong);
    let playerLatLng;
    let pointList;
    let polyList;

    // Check if NOT in Country Guessr (or if IN multiplayer) --------------------------------------------------
    if (!get(countryGuessr) || get(multiplayer)) {
        playerLatLng = new L.LatLng(guessLat, guessLong);
        polyList = [curLatLng, playerLatLng];
        pointList = new L.LatLngBounds([curLatLng, playerLatLng]);

        // Place the player marker (where the player thinks the location is)
        let playerMarker = new L.Marker(playerLatLng, { icon: yourIcon });

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, playerMarker];
        });

        if (get(multiplayer)) {
            playerMarker.bindTooltip("You",
                {
                    permanent: true,
                    direction: 'right'
                });
        }

        playerMarker.addTo(get(map));

        const polyline = L.polygon(polyList, {
            color: "black", weight: "1", opacity: "0.75"
        }).addTo(get(map));

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, polyline];
        });
    } else {
        // If Country Guessr is being played, show the destination zoomed out as the starting frame
        get(map).setView([correctLat, correctLong], 2);
    }

    // Handle multiplayer markers --------------------------------------------------------------------------
    if (get(multiplayer)) {
        get(socket)?.getStorage?.guessLocationsArray?.forEach(function (element) {
            let newMarkerLat = element.lat;
            let newMarkerLong = element.long;
            let newMarkerPinIndex = element.pin;
            let associatedPlayerName = element.username;

            // Handle edge cases
            if (newMarkerPinIndex == null) newMarkerPinIndex = 0;
            if (newMarkerLat == null || newMarkerLong == null || isNaN(newMarkerLat)) {
                newMarkerLat = 0;
                newMarkerLong = 0;
            }

            // Place multiplayer markers if not player's marker
            if (element.id !== get(socket)?.id) {

                let newMultiplayerIcon = new L.Icon({
                    iconUrl: "/img/your_marker" + newMarkerPinIndex + ".png",
                    iconSize: [35, 35],
                    iconAnchor: [17.5, 34],
                    popupAnchor: [1, -34],
                });

                let multiplayerLatLng = new L.LatLng(newMarkerLat, newMarkerLong);

                let multiplayerMarker = new L.Marker(multiplayerLatLng, { icon: newMultiplayerIcon });
                multiplayerMarker.bindTooltip(associatedPlayerName,
                    {
                        permanent: true,
                        direction: 'right'
                    });

                multiplayerMarker.setOpacity(0.75);
                multiplayerMarker.addTo(get(map));

                addedMarkers.update((markers) => {
                    markers = markers || [];
                    return [...markers, multiplayerMarker];
                });

                let multiplayerPolyList = [curLatLng, multiplayerLatLng]; // takes the cur lat lng from the guess (the destination) + the current guess from other player

                const multiplayerPolyline = L.polygon(multiplayerPolyList, {
                    color: "black", weight: "1", opacity: "0.25"
                }).addTo(get(map));

                addedMarkers.update((markers) => {
                    markers = markers || [];
                    return [...markers, multiplayerPolyline];
                });
            }
        });
    }

    // Fit the map bounds to show all markers and lines (with padding)
    if (!get(countryGuessr) || get(multiplayer)) {
        get(map).fitBounds(pointList, {
            animate: false
        });
    }

    // Place the "correct" marker reflecting the target location
    let destinationMarker = new L.Marker([correctLat, correctLong], { icon: resultIcon });
    destinationMarker.addTo(get(map));

    addedMarkers.update((markers) => {
        markers = markers || [];
        return [...markers, destinationMarker];
    });

    // Fly to the destination marker after a delay
    setTimeout(() => flyToLocation(correctLat, correctLong), 1500);
}

function flyToLocation(lat, long) {
    // Check if EndOverlay is fully visible before flying to the destination
    if (get(resultScreenEnabled)) {
        const zoom = clamp(get(map).getZoom() + 2, 0, 18);
        const animate = {
            animate: true,
            duration: 0.75
        };

        get(map).flyTo([lat, long], zoom, animate);
    }
}
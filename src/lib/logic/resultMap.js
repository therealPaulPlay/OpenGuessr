import { map, addedMarkers } from "$lib/stores/context-specific/mapStore";
import { selectedPinIndex } from "$lib/stores/accountStore";
import { multiplayerGuessesLocationsArray } from "$lib/stores/context-specific/multiplayerStore";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { multiplayer, countryGuesser } from "$lib/stores/modeStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { clamp } from "$lib/utils/clamp";
import { get } from "svelte/store";

export async function loadResultMap(playersLat, playersLong) {

    if (!get(map)) {
        console.error("Map not properly inizialized - exiting result map load function.");
        return;
    }

    get(map).setView([get(currentLocationLatitude), get(currentLocationLongitude)], 8); // Initial Zoom is high for leaflet here to avoid glitching

    // Define custom icons for markers
    const yourIcon = new L.Icon({
        iconUrl: '/img/your_marker' + get(selectedPinIndex) + '.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    const greenIcon = new L.Icon({
        iconUrl: '/img/result_marker.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    // Create LatLng objects for current and player positions
    let curLatLng = new L.LatLng(get(currentLocationLatitude), get(currentLocationLongitude));
    let playerLatLng;
    let pointList;
    let polyList;

    // Check if NOT in Country Guesser (or if IN multiplayer)
    if (!get(countryGuesser) || get(multiplayer)) {
        playerLatLng = new L.LatLng(playersLat, playersLong);
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
    }

    // Handle multiplayer markers
    if (get(multiplayer)) {
        get(multiplayerGuessesLocationsArray).forEach(function (element) {
            let newMarkerLat = element[0];
            let newMarkerLong = element[1];
            let newMarkerPinIndex = element[2];
            let associatedPlayerName = element[3];

            // Handle edge cases
            if (newMarkerLat == null || newMarkerLong == null || isNaN(newMarkerLat)) {
                newMarkerLat = 0;
                newMarkerLong = 0;
            }

            if (newMarkerPinIndex == null) {
                newMarkerPinIndex = 0;
                console.error("Provided maker pin index form peer is null");
            }

            // Place multiplayer markers if not player's marker
            if (newMarkerLat != playersLat || newMarkerLong != playersLong) {

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
    if (!get(countryGuesser) || get(multiplayer)) {
        get(map).fitBounds(pointList, {
            animate: false
        });
    }

    // Place the "correct" marker reflecting the target location
    let destinationMarker = new L.Marker([get(currentLocationLatitude), get(currentLocationLongitude)], { icon: greenIcon });
    destinationMarker.addTo(get(map));

    addedMarkers.update((markers) => {
        markers = markers || [];
        return [...markers, destinationMarker];
    });

    // Fly to the destination marker after a delay
    setTimeout(flyToDestination, 1500);
}

function flyToDestination() {
    // Check if EndOverlay is fully visible before flying to the destination
    if (get(resultScreenEnabled)) {
        const zoom = clamp(get(map).getZoom() + 2, 0, 18);
        const animate = {
            animate: true,
            duration: 0.75
        };

        get(map).flyTo([get(currentLocationLatitude), get(currentLocationLongitude)], zoom, animate);
    }
}
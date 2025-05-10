import { map, addedMarkers } from "$lib/stores/context-specific/mapStore";
import { initializeMapIfNotAlready } from "$lib/logic/miniMap";
import { selectedPinIndex } from "$lib/stores/accountStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { multiplayer, countryGuessr } from "$lib/stores/modeStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";

async function awaitMapInit() {
    return new Promise(resolve => document.addEventListener("mapInitialized", () => { resolve(); }));
}

export async function loadResultMap(guessLat, guessLong, correctLat, correctLong) {

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
    let yourIcon = {
        url: '/img/your_marker' + get(selectedPinIndex) + '.png',
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 34),
        scaledSize: new google.maps.Size(35, 35)
    };

    let resultIcon = {
        url: '/img/result_marker.png',
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 34),
        scaledSize: new google.maps.Size(35, 35)
    };

    // Create LatLng objects for current and player positions
    let curLatLng = new google.maps.LatLng(correctLat, correctLong);
    let playerLatLng;
    let pointList;

    // Check if NOT in Country Guessr (or if IN multiplayer) --------------------------------------------------
    if (!get(countryGuessr) || get(multiplayer)) {
        playerLatLng = new google.maps.LatLng(playersLat, playersLong);
        pointList = new google.maps.LatLngBounds();
        pointList.extend(curLatLng);
        pointList.extend(playerLatLng);

        // Place the player marker (where the player thinks the location is)
        let playerMarker = new google.maps.Marker({
            position: playerLatLng,
            map: get(map),
            icon: yourIcon
        });

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, playerMarker];
        });

        // Create InfoWindow for playerMarker
        let playerInfoWindow = new google.maps.InfoWindow({
            content: "You" // Replace with dynamic content if needed
        });

        // Open InfoWindow when marker is clicked
        playerMarker.addListener('click', function () {
            playerInfoWindow.open(get(map), playerMarker);
        });

        let polyline = new google.maps.Polyline({
            path: [curLatLng, playerLatLng],
            map: get(map),
            strokeWeight: 1,
            strokeColor: "black"
        });

        addedMarkers.update((markers) => {
            markers = markers || [];
            return [...markers, polyline];
        });
    } else {
        // If Country Guessr is being played, show the destination zoomed out as the starting frame
        get(map).setCenter({ lat: correctLat), lng: correctLong });
        get(map).setZoom(3);
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

                let newMultiplayerIcon = {
                    url: "/img/your_marker" + newMarkerPinIndex + ".png",
                    size: new google.maps.Size(35, 35),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17.5, 34),
                    scaledSize: new google.maps.Size(35, 35)
                };

                let multiplayerLatLng = new google.maps.LatLng(newMarkerLat, newMarkerLong);

                let multiplayerMarker = new google.maps.Marker({
                    position: multiplayerLatLng,
                    map: get(map),
                    icon: newMultiplayerIcon,
                });

                addedMarkers.update((markers) => {
                    markers = markers || [];
                    return [...markers, multiplayerMarker];
                });

                // Create InfoWindow for multiplayerMarker
                let multiplayerInfoWindow = new google.maps.InfoWindow({
                    content: associatedPlayerName // Replace with dynamic content if needed
                });

                // Open InfoWindow when marker is clicked
                multiplayerMarker.addListener('click', function () {
                    multiplayerInfoWindow.open(get(map), multiplayerMarker);
                });

                let multiplayerPolyline = new google.maps.Polyline({
                    path: [curLatLng, multiplayerLatLng],
                    strokeColor: "black",
                    strokeWeight: 1,
                    strokeOpacity: 0.25,
                    map: get(map)
                });

                addedMarkers.update((markers) => {
                    markers = markers || [];
                    return [...markers, multiplayerPolyline];
                });
            }
        });
    }

    // Fit the map bounds to show all markers and lines (with padding)
    if (!get(countryGuessr) || get(multiplayer)) {
        get(map).fitBounds(pointList, { padding: { top: 150, right: 250, bottom: 150, left: 250 } });
        if (get(map).getZoom() > 4) {
            get(map).setZoom(get(map).getZoom() - 2);
        } else {
            get(map).setZoom(get(map).getZoom() - 1);
        }
    }

    // Place the "correct" marker reflecting the target location
    let destinationMarker = new google.maps.Marker({
        position: { lat: correctLat, lng: correctLong },
        map: get(map),
        icon: resultIcon
    });

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
        let currentZoom = get(map).getZoom();
        let newZoom = Math.min(currentZoom + 2, get(map).maxZoom || 21); // Adjust 2 to the desired zoom increment and 21 to the max zoom level if you have a custom max

        let latLng = { lat: correctLat, lng: correctLong };

        get(map).setZoom(newZoom);
        get(map).setCenter(latLng);
    }
}
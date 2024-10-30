import { map, addedMarkers, initializeMapIfNotAlready } from './miniMap.js';
import { currentStreetviewLat, currentStreetviewLong } from './main.js';
import { multiplayer, multiplayerGuessesLocationsArray } from './multiplayer.js';
import { countryGuesserMode } from './countryGuesser.js';
import { selectedPinIndex } from './profileView.js';

async function awaitMapInit() {
    return new Promise(resolve =>  document.addEventListener("mapInitialized", () => { resolve(); }));
}

export async function loadResultMap(playersLat, playersLong) {

    if (!map) {
        // Trigger the captcha popup, which results in a map load, then await the map load
        initializeMapIfNotAlready();
        await awaitMapInit();

        if (!map) {
            console.error("Map not properly inizialized - exiting result map load function.");
            return;
        }
    }
    
    // Set map center to the currentStreetviewLat and currentStreetviewLong
    map.setCenter({ lat: currentStreetviewLat, lng: currentStreetviewLong });
    map.setZoom(3);

    // Define custom icons for markers
    let yourIcon = {
        url: './IMG/your_marker' + selectedPinIndex + '.png',
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 34),
        scaledSize: new google.maps.Size(35, 35)
    };

    let greenIcon = {
        url: './IMG/result_marker.png',
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 34),
        scaledSize: new google.maps.Size(35, 35)
    };

    // Create LatLng objects for current and player positions
    let curLatLng = new google.maps.LatLng(currentStreetviewLat, currentStreetviewLong);
    let playerLatLng;
    let pointList;

    // Check if in multiplayer mode or country guesser mode
    if (!countryGuesserMode || multiplayer) {
        playerLatLng = new google.maps.LatLng(playersLat, playersLong);
        pointList = new google.maps.LatLngBounds();
        pointList.extend(curLatLng);
        pointList.extend(playerLatLng);

        // Place the player marker (where the player thinks the location is)
        let playerMarker = new google.maps.Marker({
            position: playerLatLng,
            map: map,
            icon: yourIcon
        });

        addedMarkers.push(playerMarker);

        // Create InfoWindow for playerMarker
        let playerInfoWindow = new google.maps.InfoWindow({
            content: "You" // Replace with dynamic content if needed
        });

        // Open InfoWindow when marker is clicked
        playerMarker.addListener('click', function() {
            playerInfoWindow.open(map, playerMarker);
        });

        let polyline = new google.maps.Polyline({
            path: [curLatLng, playerLatLng],
            map: map,
            strokeWeight: 1,
            strokeColor: "black"
        });

        addedMarkers.push(polyline);
    }

    // Handle multiplayer markers
    if (multiplayer) {
        multiplayerGuessesLocationsArray.forEach(function (element) {
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

                let newMultiplayerIcon = {
                    url: "./IMG/your_marker" + newMarkerPinIndex + ".png",
                    size: new google.maps.Size(35, 35),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17.5, 34),
                    scaledSize: new google.maps.Size(35, 35)
                };

                let multiplayerLatLng = new google.maps.LatLng(newMarkerLat, newMarkerLong);

                let multiplayerMarker = new google.maps.Marker({
                    position: multiplayerLatLng,
                    map: map,
                    icon: newMultiplayerIcon,
                });

                addedMarkers.push(multiplayerMarker);

                // Create InfoWindow for multiplayerMarker
                let multiplayerInfoWindow = new google.maps.InfoWindow({
                    content: associatedPlayerName // Replace with dynamic content if needed
                });

                // Open InfoWindow when marker is clicked
                multiplayerMarker.addListener('click', function() {
                    multiplayerInfoWindow.open(map, multiplayerMarker);
                });

                let multiplayerPolyline = new google.maps.Polyline({
                    path: [curLatLng, multiplayerLatLng],
                    strokeColor: "black",
                    strokeWeight: 1,
                    strokeOpacity: 0.25,
                    map: map
                });

                addedMarkers.push(multiplayerPolyline);
            }
        });
    }

    // Fit the map bounds to show all markers and lines (with padding)
    if (!countryGuesserMode || multiplayer) {
        map.fitBounds(pointList, { padding: { top: 150, right: 250, bottom: 150, left: 250 }});
        if (map.getZoom() > 4) {
            map.setZoom(map.getZoom() - 2);
        } else {
            map.setZoom(map.getZoom() - 1);
        }
    }

    // Place the "correct" marker reflecting the target location
    let destinationMarker = new google.maps.Marker({
        position: { lat: currentStreetviewLat, lng: currentStreetviewLong },
        map: map,
        icon: greenIcon
    });

    addedMarkers.push(destinationMarker);

    // Fly to the destination marker after a delay
    setTimeout(flyToDestination, 1500);
}

function flyToDestination() {
    // Check if EndOverlay is fully visible before flying to the destination
    if (document.getElementById("EndOverlay").style.opacity == "1" && map) {
        let currentZoom = map.getZoom();
        let newZoom = Math.min(currentZoom + 2, map.maxZoom || 21); // Adjust 2 to the desired zoom increment and 21 to the max zoom level if you have a custom max

        let latLng = { lat: currentStreetviewLat, lng: currentStreetviewLong };
        
        map.setZoom(newZoom);
        map.setCenter(latLng);
    }
}
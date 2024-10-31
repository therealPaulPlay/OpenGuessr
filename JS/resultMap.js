import { currentStreetviewLat, currentStreetviewLong, clamp } from './main.js';
import { multiplayer, multiplayerGuessesLocationsArray } from './multiplayer.js';
import { countryGuesserMode } from './countryGuesser.js';
import { selectedPinIndex } from './profileView.js';
import { getMapSource } from './miniMap.js';

export let resMap;

let tileLayer;

function setTileLayer() {
    tileLayer = L.tileLayer(getMapSource(), {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        minZoom: 2,
        detectRetina: true,
    });
}

setTileLayer(); // set initial value for tileLayer

export function setResultMapTileLayer() {
    try {
        if (resMap) {
            resMap.removeLayer(tileLayer);

            setTileLayer();

            tileLayer.addTo(resMap);
        }
    } catch (e) {
        console.error("ResMap TileLayer adding error: " + e);
    }
}

let destinationMarker;

export function loadResultMap(playersLat, playersLong) {
    // this deletes the map only if it already exists - otherwise it will never exist - important for going to the next round
    if (resMap && resMap.remove) {
        resMap.off();
        resMap.remove();
    }

    // this makes it so the map in the result screen is focused on the center between the point
    // and zooming out so both points are visible on the map.
    resMap = document.getElementById("resultMap");
    resMap = L.map('resultMap', { zoomControl: false }).setView([currentStreetviewLat, currentStreetviewLong], 10); // basically only for country guessr
    setResultMapTileLayer();

    if (countryGuesserMode && !multiplayer) {
        resMap.setZoom(3); //set default zoom
    }

    const yourIcon = new L.Icon({
        iconUrl: "./IMG/your_marker" + selectedPinIndex + ".png",
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    const greenIcon = new L.Icon({
        iconUrl: './IMG/result_marker.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 34],
        popupAnchor: [1, -34]
    });

    // used to create the line between the points
    let curLatLng = new L.LatLng(currentStreetviewLat, currentStreetviewLong);
    let pointList = null;
    let playerLatLng;
    let polyList;
    let playerMarker;

    if (!countryGuesserMode || multiplayer) {
        playerLatLng = new L.LatLng(playersLat, playersLong);
        polyList = [curLatLng, playerLatLng];
        pointList = new L.LatLngBounds([curLatLng, playerLatLng]);
        playerMarker;

        // this places the Player Marker (where the player thinks the location is)
        playerMarker = new L.Marker(playerLatLng, { icon: yourIcon });
        if (multiplayer) {
            playerMarker.bindTooltip("You",
                {
                    permanent: true,
                    direction: 'right'
                });
        }

        playerMarker.addTo(resMap);

        // this draws the line to the goal
        const polygon = L.polygon(polyList, {
            color: "black", weight: "1", opacity: "0.75"
        }).addTo(resMap);
    }

    // pins of other players
    if (multiplayer) {
        multiplayerGuessesLocationsArray.forEach(function (element) {
            let newMarkerLat = element[0];
            let newMarkerLong = element[1];
            let newMarkerPinIndex = element[2];
            let associatedPlayerName = element[3];

            // checks for edge cases
            if (newMarkerLat == null || newMarkerLong == null || isNaN(newMarkerLat)) {
                newMarkerLat = 0;
                newMarkerLong = 0;
            }

            if (newMarkerPinIndex == null) {
                newMarkerPinIndex = 0;
                console.error("Provided maker pin index form peer is null");
            }

            // only place the multiplayer marker if it isn't your marker!
            if (newMarkerLat != playersLat || newMarkerLong != playersLong) {
                let newMultiplayerIcon = new L.Icon({
                    iconUrl: "./IMG/your_marker" + newMarkerPinIndex + ".png",
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
                multiplayerMarker.setOpacity(0.6);
                multiplayerMarker.addTo(resMap);

                let multiplayerPolyList = [curLatLng, multiplayerLatLng]; // takes the cur lat lng from the guess (the destination) + the current guess from other player
                
                const multiplayerPolygon = L.polygon(multiplayerPolyList, {
                    color: "black", weight: "1", opacity: "0.25"
                }).addTo(resMap);
            }
        });
    }

    if (!countryGuesserMode || multiplayer) {
        resMap.fitBounds(pointList, { padding: [150, 250], animate: false });
    }

    // this places the "correct" marker that actually reflects the target location
    destinationMarker = new L.Marker([currentStreetviewLat, currentStreetviewLong], { icon: greenIcon });
    destinationMarker.addTo(resMap);

    setTimeout(flyToDestination, 1500);
}

function flyToDestination() {
    if (document.getElementById("EndOverlay").style.opacity == "1" && resMap) {
        var lat = currentStreetviewLat;
        var lng = currentStreetviewLong;
        var zoom = clamp(resMap.getZoom() + 2, 0, 18);
        var animate = {
            animate: true,
            duration: 1
        };


        // move the marker up a notch on phones
        if (window.innerHeight > window.innerWidth) {  // Check if it's a mobile device in portrait mode
            var mapHeight = resMap.getSize().y; // Get the map's height in pixels
            var offset = mapHeight / 25; // Adjust to place the marker slightly above the center (1/4 of the map's height)
            var targetPoint = resMap.latLngToContainerPoint([lat, lng]); // Convert the lat/lng to container point
            targetPoint.y += offset; // Adjust the point to move it slightly up
            var newLatLng = resMap.containerPointToLatLng(targetPoint); // Convert back to lat/lng

            resMap.flyTo(newLatLng, zoom, animate);
        } else {
            resMap.flyTo([lat, lng], zoom, animate);
        }
    }
}
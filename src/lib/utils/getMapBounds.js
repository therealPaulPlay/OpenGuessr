// Get the locations of a map (currentlyLoadedLocationsArray), and caluclate the ideal minimap center + zoom based on that
// This allows all maps to only show the area on the minimap that is really needed
import { currentlyLoadedLocationsArray } from "$lib/stores/locationStore";
import { singleplayer } from "$lib/stores/modeStore";
import { mapDiameter } from "$lib/stores/context-specific/mapStore";
import { get } from "svelte/store";

let previousLocationArray = [];
let currentCenterLat = 0;
let currentCenterLong = 0;

let currentZoom = 2;

export function getMapBounds() {
    // If no locations are loaded, set the map to the default - Or if not in Singleplayer (Multiplayer locs from host, competition locs from server etc. don't position map)
    if (!get(singleplayer) || !get(currentlyLoadedLocationsArray)) {
        return { zoom: 2, lat: 0, lng: 0 }
    }

    if (get(currentlyLoadedLocationsArray) == previousLocationArray) {
        return { zoom: currentZoom, lat: currentCenterLat, lng: currentCenterLong }; // If the location array has not changed, re-use the calculated values
    } else {
        // If the location array is new, calculate new map zoom and center coords
        let south = Infinity;
        let north = -Infinity;
        let west = Infinity;
        let east = -Infinity;

        get(currentlyLoadedLocationsArray).forEach(([lat, lon]) => {
            lat = parseFloat(lat);
            lon = parseFloat(lon);

            if (lat > north) north = lat;
            if (lat < south) south = lat;
            if (lon > east) east = lon;
            if (lon < west) west = lon;
        });

        // Calculate the center point
        let centerLat = (north + south) / 2;
        const centerLon = (east + west) / 2;

        // Calculate the longer side
        const latDiff = north - south;
        const lonDiff = east - west;

        mapDiameter.set(Math.max(latDiff, lonDiff)); // Set the map diameter -> used for Score calculation

        // Calculate zoom level
        const zoomLevel = calculateZoom(get(mapDiameter));
        if (zoomLevel <= 2) centerLat = centerLat + 10;

        currentCenterLat = centerLat;
        currentCenterLong = centerLon;
        currentZoom = zoomLevel;
        previousLocationArray = currentlyLoadedLocationsArray;

        return { zoom: zoomLevel, lat: centerLat, lng: centerLon }
    }
}

function calculateZoom(diameter) {
    if (diameter > 60) return 2;       // entire planet view
    if (diameter > 20) return 3;       // large country
    if (diameter > 10) return 4;       // medium country
    if (diameter > 5) return 5;        // small country
    return Math.min(10, 6 + Math.floor(5 - diameter)); // smaller region, minimum zoom at 10
}
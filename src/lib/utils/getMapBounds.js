// Get the locations of a map (the loaded locations Array), and caluclate the ideal minimap center + zoom based on that
// This allows all maps to only show the area on the minimap that is really needed
import { currentlyLoadedLocationsArray } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { multiplayer } from "$lib/stores/modeStore";
import { peer } from "$lib/stores/context-specific/multiplayerStore";

let previousLocationArray = [];
let currentCenterLat = 0;
let currentCenterLong = 0;

let currentZoom = 2;

export function getMapBounds() {
    // If no locations are loaded, set the map to the default
    if (!get(currentlyLoadedLocationsArray)?.length) {
        if (get(multiplayer) && get(peer)?.getStorage?.mapBounds) return get(peer)?.getStorage?.mapBounds;
        return { zoom: 2, lat: 0, lng: 0, diameter: 360 }
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

        // Calculate zoom level
        const zoomLevel = calculateZoom(Math.max(latDiff, lonDiff));
        if (zoomLevel <= 2) centerLat = centerLat + 10;

        currentCenterLat = centerLat;
        currentCenterLong = centerLon;
        currentZoom = zoomLevel;
        previousLocationArray = currentlyLoadedLocationsArray;

        return { zoom: zoomLevel, lat: centerLat, lng: centerLon, diameter: Math.max(latDiff, lonDiff) } // Diameter is not in km / m, but coords
    }
}

function calculateZoom(diameter) {
    if (diameter > 60) return 2;       // entire planet view
    if (diameter > 20) return 3;       // large country
    if (diameter > 10) return 4;       // medium country
    if (diameter > 5) return 5;        // small country
    return Math.min(10, 6 + Math.floor(5 - diameter)); // smaller region, minimum zoom at 10
}
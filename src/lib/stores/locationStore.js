import { writable, readable, derived, get } from "svelte/store";

// Current coordinates (of the current Panorama, Image, etc.)
export const currentLocationLatitude = writable(0);
export const currentLocationLongitude = writable(0);

// Only available on some maps, currently only World
export const currentLocationHeading = writable(null);

// Bounds
export const savedMapBounds = writable({ zoom: 2, lat: 0, lng: 0, diameter: 360 });

// Round Log
export const roundLog = writable([]);

// URL prefix
export const streetViewURLPrefix = readable("https://www.google.com/maps/embed/v1/streetview?location=");

// Panorama key
export const panoramaKey = readable("AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs");

// Iframe
export const iframeElement = writable();
export const initialIframeLoad = writable(true);
export const panoramaSrc = derived([currentLocationLatitude, currentLocationLongitude, panoramaKey], ([lat, lon, key], set) => {
    initialIframeLoad.set(true);
    set(
        get(streetViewURLPrefix) +
        lat +
        "," +
        lon +
        "&key=" +
        key +
        "&fov=90" +
        (get(currentLocationHeading) ? `&heading=${get(currentLocationHeading)}` : "") +
        "&language=en" // Force EN since in languages written right to left, street view UI is flipped
    )
});
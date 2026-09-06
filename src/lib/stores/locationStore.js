import { getMapsEmbedUrl } from "$lib/utils/streetViewUrl";
import { writable, derived } from "svelte/store";

// Current coordinates (of the current Panorama, Image, etc.)
export const currentLocationLatitude = writable(0);
export const currentLocationLongitude = writable(0);

// Only available on some maps
export const currentLocationHeading = writable(null);
export const currentLocationPitch = writable(null);
export const currentLocationPanoramaId = writable(null);

// Bounds
export const savedMapBounds = writable({ zoom: 2, lat: 0, lng: 0, diameter: 360 });

// Round Log
export const roundLog = writable([]);

// Iframe
export const iframeElement = writable();
export const initialPanoramaLoad = writable(true);
export const panoramaSrc = derived([currentLocationLatitude, currentLocationLongitude, currentLocationHeading, currentLocationPitch, currentLocationPanoramaId], ([lat, lon, heading, pitch, panoramaId], set) => {
    initialPanoramaLoad.set(true);
    set(getMapsEmbedUrl(lat, lon, { heading, pitch, panoramaId }));
});
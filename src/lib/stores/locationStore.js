import { getMapsEmbedUrl } from "$lib/utils/streetViewUrl";
import { writable, derived, readable, get } from "svelte/store";

// Current coordinates (of the current panorama, Image, etc.)
export const currentLocationLatitude = writable(0);
export const currentLocationLongitude = writable(0);

// Only available on some maps
export const currentLocationHeading = writable(null);
export const currentLocationPitch = writable(null);
export const currentLocationPanoramaId = writable(null);

// Bounds
export const defaultBounds = readable({ zoom: 2, lat: 0, lng: 0, diameter: 360 });
export const mapBounds = writable(get(defaultBounds));

// Round log
export const roundLog = writable([]);

// Panorama
export const iframeElement = writable();
export const customViewerLoad = writable(null);
export const initialPanoramaLoad = writable(true);
export const panoramaSrc = derived([currentLocationLatitude, currentLocationLongitude, currentLocationHeading, currentLocationPitch, currentLocationPanoramaId], ([lat, lon, heading, pitch, panoramaId], set) => {
    initialPanoramaLoad.set(true);
    set(getMapsEmbedUrl(lat, lon, { heading, pitch, panoramaId }));
});
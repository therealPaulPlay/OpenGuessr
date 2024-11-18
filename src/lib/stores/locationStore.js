import { writable } from "svelte/store";

export const panoramaLink = writable("/loader");
export const loadPanorama = writable(); // Function (defined in PanoramaIframe component)
export const reloadPanorama = writable(); // Function (defined in PanoramaIframe component)

// Current coordinates (of the current Panorama, Image, etc.)
export const currentLocationLatitude = writable(0);
export const currentLocationLongitude = writable(0);

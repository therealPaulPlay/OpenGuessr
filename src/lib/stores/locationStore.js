import { writable, readable } from "svelte/store";

export const panoramaLink = writable("/loader");

export const iframeElement = writable();
export const initialIframeLoad = writable(true);

// Current coordinates (of the current Panorama, Image, etc.)
export const currentLocationLatitude = writable(0);
export const currentLocationLongitude = writable(0);

// Bounds
export const savedMapBounds = writable({ zoom: 2, lat: 0, lng: 0, diameter: 360 });

// Round Log
export const roundLog = writable([]);

// Panorama key
export const panoramaKey = readable("AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs");
import { writable } from "svelte/store";

export const panoramaLink = writable("/loader");

export const iframeElement = writable();
export const initialIframeLoad = writable(true);

// Current coordinates (of the current Panorama, Image, etc.)
export const currentLocationLatitude = writable(0);
export const currentLocationLongitude = writable(0);

// Location Maps
export const currentlyLoadedLocationsArray = writable();

// Round Log
export const roundLog = writable([]);
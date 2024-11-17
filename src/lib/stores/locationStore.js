import { writable } from "svelte/store";

export const panoramaLink = writable("/loader");
export const loadPanorama = writable(); // Function (defined in PanoramaIframe component)
export const reloadPanorama = writable(); // Function (defined in PanoramaIframe component)

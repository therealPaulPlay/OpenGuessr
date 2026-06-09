import { browser } from "$app/environment";
import { writable } from "svelte/store";

const isMobile = browser ? window.matchMedia("(max-width: 800px)").matches : true; // Default to true in hydration

// The map object
export const map = writable();

// Visuals
export const mapInteractive = writable(true);
export const mapExpanded = writable(isMobile ? false : true);
export const mapHovered = writable(false);

// Marker / Pin position
export const guessLat = writable(0); // Player pin latitude
export const guessLon = writable(0); // Player pin longitude
export const addedMarkers = writable(); // All markers on the map (can be many in multiplayer)
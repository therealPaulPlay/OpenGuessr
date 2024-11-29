import { writable } from "svelte/store";

// The map object
export const map = writable();

// Visuals
export const mapVisible = writable(true);
export const mapExpanded = writable(true);
export const mapHolderMarginRight = writable(0);
export const mapHovered = writable(false);

// Marker / Pin position
export const mapPinLat = writable(0); // Player Pin latitude
export const mapPinLng = writable(0); // Player pin longitude
export const addedMarkers = writable(); // All markers on the map (can be many in multiplayer)

// Diameter of the loaded Map (category) - used for score calculation
export const mapDiameter = writable(90);
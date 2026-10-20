import { browser } from "$app/environment";
import { MediaQuery } from "svelte/reactivity";
import { writable } from "svelte/store";

// Sizing
export const mobilePortrait = new MediaQuery("(orientation: portrait) and (max-width: 800px)");

// The map object
export const map = writable();

// Visuals
export const mapInteractive = writable(true);
export const mapExpanded = writable(browser ? !mobilePortrait.current : false); // Collapsed in hydration
export const mapHovered = writable(false);
export const mapHoveredImmediate = writable(false); // True map hover state without the cancellation delay

// Marker / Pin position
export const guessLat = writable(0); // Player pin latitude
export const guessLon = writable(0); // Player pin longitude
export const addedMarkers = writable(); // All markers on the map (can be many in multiplayer)
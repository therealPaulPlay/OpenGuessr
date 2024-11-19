import { writable } from "svelte/store";

export const mapVisible = writable(true);
export const mapExpanded = writable(true);
export const mapHolderMarginRight = writable(0);

export const hideToggleMap = writable(); // Function from MobileMapToggle.svelte

export const mapPinLat = writable(0);
export const mapPinLng = writable(0);
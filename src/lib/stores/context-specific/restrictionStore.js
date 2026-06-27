import { get, readable, writable } from "svelte/store";

// Names
export const restrictionNames = readable({
    none: "None",
    nmpz: "NMPZ",
    grayscale: "Grayscale",
    invert: "Inverted",
    hue: "Hue shift",
    fade: "Blink"
});

// Selections (as keys, not display strings)
export const defaultRestriction = readable(Object.keys(get(restrictionNames))?.[0]);
export const selectedRestriction = writable(get(defaultRestriction));

// Technical
export const panoramaFilter = writable();
export const nmpz = writable(false);
export const fadePanorama = writable(false);
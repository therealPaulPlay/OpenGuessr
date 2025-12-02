import { readable, writable } from "svelte/store";

export const panoramaFilter = writable();
export const nmpz = writable(false);
export const fadePanorama = writable(false);

// Names
export const restrictionNames = readable({
    standard: "Standard",
    nmpz: "NMPZ",
    grayscale: "Grayscale",
    invert: "Invert colors",
    hue: "Hue shift",
    fade: "Blink"
})
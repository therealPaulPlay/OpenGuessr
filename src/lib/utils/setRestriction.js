import { browser } from "$app/environment";
import { panoramaFilter, nmpz, fadePanorama, selectedRestriction, defaultRestriction } from "$lib/stores/context-specific/restrictionStore";
import { singleplayer } from "$lib/stores/modeStore";
import { get } from "svelte/store";

// Apply singleplayer restriction by default and when singleplayer is re-entered
singleplayer.subscribe((value) => {
    if (value) (browser && localStorage.getItem("singleplayerNMPZ") ? setRestriction("nmpz") : setRestriction());
});

// Other modes call directly
export function setRestriction(restriction = get(defaultRestriction)) {
    selectedRestriction.set(restriction);

    // Disable all, then enable what is needed
    panoramaFilter.set();
    nmpz.set(false);
    fadePanorama.set(false);

    switch (restriction) {
        case "nmpz":
            nmpz.set(true);
            break;
        case "grayscale":
            panoramaFilter.set("grayscale(100%)");
            break;
        case "invert":
            panoramaFilter.set("invert(100%)");
            break;
        case "hue":
            panoramaFilter.set("hue-rotate(90deg)");
            break;
        case "fade":
            fadePanorama.set(true);
            break;
        case "none":
        default:
            break; // No restriction
    }
}
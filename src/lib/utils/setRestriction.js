import { panoramaFilter, nmpz, fadePanorama, selectedRestriction, defaultRestriction } from "$lib/stores/context-specific/restrictionStore";
import { get } from "svelte/store";

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
            break; // no restriction
    }
}
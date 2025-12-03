import { panoramaFilter, nmpz, fadePanorama, selectedRestriction } from "$lib/stores/context-specific/restrictionStore";

export function setRestriction(restriction = "standard") {
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
        case "standard":
        default:
            break; // no restriction
    }
}
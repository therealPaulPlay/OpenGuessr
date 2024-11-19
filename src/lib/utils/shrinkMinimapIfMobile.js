// If the user is on mobile, shrink the map (un-toggle it)
import { mapExpanded } from "$lib/stores/context-specific/mapStore";

export function shrinkMapIfMobile() {
    if (window.innerHeight > window.innerWidth) {
        mapExpanded.set(false);
    }
}
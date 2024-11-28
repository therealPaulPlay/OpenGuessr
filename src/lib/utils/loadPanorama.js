// Load a panorama for the iframe
import { panoramaLink, iframeElement, initialIframeLoad, panoramaKey } from "$lib/stores/locationStore";
import { loadingScreenVisible } from "$lib/stores/uiStore";
import { imageGuesser, multiplayer } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { get } from "svelte/store";

export function loadPanorama(lat, long) {
    if (!get(imageGuesser) || get(multiplayer)) {
        panoramaLink.set(
            "https://www.google.com/maps/embed/v1/streetview?location=" +
            lat +
            "," +
            long +
            "&key=" +
            get(panoramaKey) +
            "&fov=90",
        ); // API key (last part of URL)
    } else {
        panoramaLink.set("/loader");
    }

    get(iframeElement).setAttribute("src", get(panoramaLink)); // Apply manually, to avoid URL override on move (where the URL changes)
    initialIframeLoad.set(true);
}

export function reloadPanorama() {
    playSound("reload");
    loadingScreenVisible.set(true);
    get(iframeElement).setAttribute("src", get(panoramaLink));
    window.setTimeout(() => {
        loadingScreenVisible.set(false);
    }, 400);
}
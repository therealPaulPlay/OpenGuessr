import { imageGuessr } from "$lib/stores/modeStore.js";
import { imageGuessrImage, imageGuessrBackground } from "$lib/stores/context-specific/imageGuessrStore";
import { get } from "svelte/store";

export function loadImageFromUrl(url) {
    // Preload the image to ensure it is loaded before setting it as background
    const img = new Image();
    img.src = url;

    img.onload = function () {
        // Set the background image once it's loaded
        get(imageGuessrImage).style.backgroundImage = `url(${url})`;
        get(imageGuessrBackground).style.backgroundImage = `url(${url})`;

        // Remove the loading class to apply any transitions
        setTimeout(() => {
            get(imageGuessrImage).classList.remove("guessImageLoading");
            get(imageGuessrBackground).classList.remove("guessImageLoading");
        }, 200);
    };
}

export function enableImageGuessr() {
    get(imageGuessrImage).style.transform = "rotate(" + Math.floor(Math.random() * 10 - 5) + "deg)";

    // Apply image loading styles
    get(imageGuessrImage).classList.add("guessImageLoading");
    get(imageGuessrBackground).classList.add("guessImageLoading");

    // Clear the background styles
    get(imageGuessrImage).style.backgroundImage = "";
    get(imageGuessrBackground).style.backgroundImage = "";
}
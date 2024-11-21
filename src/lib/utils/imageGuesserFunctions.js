import { imageGuesser } from "$lib/stores/modeStore.js";
import { imageGuesserImage, imageGuesserBackground } from "$lib/stores/context-specific/imageGuesserStore";
import { get } from "svelte/store";

export function loadImageFromUrl(url) {
    // Preload the image to ensure it is loaded before setting it as background
    const img = new Image();
    img.src = url;

    img.onload = function () {
        // Set the background image once it's loaded
        get(imageGuesserImage).style.backgroundImage = `url(${url})`;
        get(imageGuesserBackground).style.backgroundImage = `url(${url})`;

        // Remove the loading class to apply any transitionsƒ
        setTimeout(() => {
            get(imageGuesserImage).classList.remove("guessImageLoading");
            get(imageGuesserBackground).classList.remove("guessImageLoading");
        }, 200);
    };
}

export function setImageGuesserMode(enable) {
    imageGuesser.set(enable);

    if (enable) {
        get(imageGuesserImage).style.transform = "rotate(" + Math.floor(Math.random() * 10 - 5) + "deg)";

        // Apply image loading styles
        get(imageGuesserImage).classList.add("guessImageLoading");
        get(imageGuesserBackground).classList.add("guessImageLoading");

        // Clear the background styles
        get(imageGuesserImage).style.backgroundImage = "";
        get(imageGuesserBackground).style.backgroundImage = "";
    }
}
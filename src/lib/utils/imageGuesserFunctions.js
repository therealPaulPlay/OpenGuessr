import { imageGuessr } from "$lib/stores/modeStore.js";
import { imageGuessrImage, imageGuessrBackground } from "$lib/stores/context-specific/imageGuessrStore";
import { get } from "svelte/store";

let imageQueue = Promise.resolve(); // Queue handler

export function loadImageFromUrl(url) {
    imageQueue = imageQueue.then(async () => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = function () {
                get(imageGuessrImage).style.backgroundImage = `url(${url})`;
                get(imageGuessrBackground).style.backgroundImage = `url(${url})`;

                setTimeout(() => {
                    get(imageGuessrImage).classList.remove("guessImageLoading");
                    get(imageGuessrBackground).classList.remove("guessImageLoading");
                    resolve();
                }, 200);
            };
            img.onerror = () => resolve(); // Handle errors
        });
    });

    return imageQueue;
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
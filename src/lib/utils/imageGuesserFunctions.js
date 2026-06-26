import { imageGuessrImageSrc, imageGuessrLoading } from "$lib/stores/context-specific/imageGuessrStore";

let imageQueue = Promise.resolve(); // Queue handler

export function setImageGuessrImage(url) {
    imageQueue = imageQueue.then(async () => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = function () {
                // Set image
                imageGuessrImageSrc.set(url);

                setTimeout(() => {
                    imageGuessrLoading.set(false);
                    resolve();
                }, 250);
            };
            img.onerror = () => resolve();
        });
    });

    return imageQueue;
}

export function enableImageGuessr() {
    imageGuessrLoading.set(true);
    imageGuessrImageSrc.set(""); // Clear the image
}
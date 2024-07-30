// This file is used for the Image Guesser gamemode

export let imageGuesserEnabled = false;

const overlay = document.getElementById("imageGuesserOverlay");
const image = document.getElementById("imageGuesserImage");
const background = document.getElementById("imageGuesserBackground");

export function setImageGuessrEnabled(enable) {
    imageGuesserEnabled = enable;

    if (enable) {
        document.getElementById("imageGuesserOverlay").style.display = "flex";
        overlay.style.opacity = "1";
        overlay.style.pointerEvents = "auto";
        image.style.transform = "rotate(" + Math.floor(Math.random() * 10 - 5) + "deg)";
        image.classList.add("guessImageLoading");
        background.classList.add("guessImageLoading");
        
        // Clear the background styles
        image.style.backgroundImage = "";
        background.style.backgroundImage = "";
    } else {
        document.getElementById("imageGuesserOverlay").style.display = "none";
        overlay.style.opacity = "0";
        overlay.style.pointerEvents = "none";
    }
}

// Add hover event listeners to scale the image
image.addEventListener('mouseenter', scaleUp);
image.addEventListener('mouseleave', scaleDown);

function scaleUp(event) {
    const image = event.target;
    image.style.transform += ' scale(1.01)';
}

function scaleDown(event) {
    const image = event.target;
    image.style.transform = image.style.transform.replace(' scale(1.01)', '');
}

export function loadImageFromUrl(url) {
    // Preload the image to ensure it is loaded before setting it as background
    const img = new Image();
    img.src = url;
    
    img.onload = function() {
        // Set the background image once it's loaded
        image.style.backgroundImage = `url(${url})`;
        background.style.backgroundImage = `url(${url})`;
        
        // Remove the loading class to apply any transitions
        setTimeout(() => {
            image.classList.remove("guessImageLoading");
            background.classList.remove("guessImageLoading");
        }, 200);
    };
}

// Sample code from the venatus modified for our use case
window.top.__vm_add = window.top.__vm_add || [];

let bottomAdElement = document.getElementById("bottomFooterAds");
let currentAdParent = bottomAdElement; // initial value is the bottom footer ad (as this is the first ad to load)

export function enableResultAds() {
    try {
        const desktopSize = window.getComputedStyle(document.getElementById("floatingResultLeaderboardArea")).display === "flex";

        currentAdParent = desktopSize ? desktopResultAd : mobileResultAd;
        applyCorrectIds(currentAdParent);

    } catch (error) {
        console.error("Error moving ad around in venatus custom js:", error);
    }
}

export function enableBottomAd() {
    const bottomAdBar = document.getElementById("bottomFooterAds");

    currentAdParent = bottomAdBar;
    applyCorrectIds(currentAdParent);
}

function applyCorrectIds(parentElement) {
    try {
        // Check if the placement already exists
        let placement = document.querySelector('.vm-placement');

        if (placement) {
            parentElement.removeChild(placement);
        }

        placement = document.createElement("div");
        placement.setAttribute("class", "vm-placement");
        parentElement.appendChild(placement);

        // Update placement attributes based on element width - not 728 by design, because Chrome often miscalculates element size and thinks it is 727.99px instead of 728px
        const width = parentElement.getBoundingClientRect().width;
        const newId = width >= 720 ? "666702f0549bd20a9f2bfab6" : "66670320549bd20a9f2bfaba";

        placement.setAttribute("data-id", newId)

        window.top.__vm_add.push(placement);

    } catch (error) {
        console.error("Error in custom ad script: " + error);
    }
}

// Apply IDs when the page is loaded (for the bottom ad element, as that appears first)
if (window.document.readyState !== "loading") {
    applyCorrectIds(bottomAdElement);
} else {
    window.document.addEventListener("DOMContentLoaded", function () {
        applyCorrectIds(bottomAdElement);
    });
}

// Apply IDs (once) when the window is resized
let onResizeTimeout;

window.addEventListener("resize", function () {
    clearTimeout(onResizeTimeout);

    onResizeTimeout = setTimeout(() => {
        applyCorrectIds(currentAdParent);
    }, 200);
});


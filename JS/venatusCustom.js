// Sample code from the venatus modified for our use case
window.top.__vm_add = window.top.__vm_add || [];

let bottomAdElement = document.getElementById("bottomFooterAds");
let currentAdParent = bottomAdElement; // initial value is the bottom footer ad (as this is the first ad to load)

export function enableResultAds() {
    try {
        // clear previous ad areas in case there are any leftovers
        const mobileResultAd = document.getElementById("resultLeaderboardAd");
        mobileResultAd.innerHTML = "";

        const desktopResultAd = document.getElementById("floatingResultLeaderboardAd");
        desktopResultAd.innerHTML = "";

        // check if big or small ad should be activated
        const desktopSize = window.getComputedStyle(document.getElementById("floatingResultLeaderboardArea")).display === "flex";

        const adPlacement = document.querySelector(".vm-placement");

        if (desktopSize) {
            desktopResultAd.appendChild(adPlacement);
            currentAdParent = desktopResultAd;
        } else {
            mobileResultAd.appendChild(adPlacement);
            currentAdParent = mobileResultAd;
        }
        
        applyCorrectIds(currentAdParent);

    } catch (error) {
        console.error("Error moving ad around in venatus custom js:", error);
    }
}

export function enableBottomAd() {
    const bottomAdBar = document.getElementById("bottomFooterAds");

    try {
        const adPlacement = document.querySelector(".vm-placement");
        bottomAdBar.innerHTML = "";

        bottomAdBar.appendChild(adPlacement);
    } catch (error) {
        console.error("Error moving ad back to bottom bar in venatus custom js:", error);
    }

    currentAdParent = bottomAdBar;
    applyCorrectIds(currentAdParent);
}

function applyCorrectIds(parentElement) {
    try {
        // Check if the placement already exists
        let placement = document.querySelector('.vm-placement');

        if (!placement) {
            // If placement doesn't exist, create a new one
            placement = document.createElement("div");
            placement.setAttribute("class", "vm-placement");
            parentElement.appendChild(placement);
        }

        // Update placement attributes based on element width - not 728 by design, because Chrome often miscalculates element size and thinks it is 727.99px instead of 728px
        if (parentElement.getBoundingClientRect().width >= 720) {
            placement.setAttribute("data-id", "666702f0549bd20a9f2bfab6"); // Desktop Multi-Size leaderboard
        } else {
            placement.setAttribute("data-id", "66670320549bd20a9f2bfaba"); // Mobile Leaderboard
        }

        // push the placement to the venatus array
        window.top.__vm_add.push(placement);

    } catch (error) {
        console.error("Error in custom ad script: " + error);
    }
}

// Apply IDs when the page is loaded
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


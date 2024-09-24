window.top.__vm_add = window.top.__vm_add || [];

let bottomAdElement = document.getElementById("bottomFooterAds");
let currentAdParent = bottomAdElement; // initial value is the bottom footer ad (as this is the first ad to load)

let placementsArray = [];

/*
// executed once when the result screen is made visible
export function enableResultAds() {
    try {
        const mobileResultAd = document.getElementById("resultLeaderboardAd");
        const desktopResultAd = document.getElementById("floatingResultLeaderboardAd");
        const desktopSize = window.getComputedStyle(document.getElementById("floatingResultLeaderboardArea")).display === "flex";

        currentAdParent = desktopSize ? desktopResultAd : mobileResultAd;
        applyCorrectIds(currentAdParent);

    } catch (error) {
        console.error("Error moving ad around in venatus custom js:", error);
    }
}

// executed once when the result screen is made invisible
export function enableBottomAd() {
    const bottomAdBar = document.getElementById("bottomFooterAds");

    currentAdParent = bottomAdBar;
    applyCorrectIds(currentAdParent);
}
*/

// Remove all ads
function removeAllAds() {
    window.top.__vm_remove_category = ["richmedia_all"] ;
    window.top.__vm_remove = (window.top).__vm_remove || [];
    for (var i = 0; i < placementsArray.length; i++){
        (window.top).__vm_remove.push(placementsArray[i]);
    }

    placementsArray = [];
}

function applyCorrectIds(parentElement) {
    try {
        // Remove all ads - this is feasible because there are never multiple ads on screen
        removeAllAds();

        // Check if the placement already exists
        let placement = document.querySelector('.vm-placement');

        if (placement) {
            placement.remove();
        }

        placement = document.createElement("div");
        placement.setAttribute("class", "vm-placement");
        parentElement.appendChild(placement);

        // Update placement attributes based on element width - not 728 by design, because Chrome often miscalculates element size and thinks it is 727.99px instead of 728px
        const width = parentElement.getBoundingClientRect().width;
        const newId = width >= 720 ? "666702f0549bd20a9f2bfab6" : "66670320549bd20a9f2bfaba";

        placement.setAttribute("data-id", newId)

        placementsArray.push(placement);
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
let lastBottombarComputedWidth = bottomAdElement.getBoundingClientRect().width;
let onResizeTimeout;

window.addEventListener("resize", function () {
    clearTimeout(onResizeTimeout);

    onResizeTimeout = setTimeout(() => {
        if (lastBottombarComputedWidth != bottomAdElement.getBoundingClientRect().width) { // only apply new id's if the size has actually changed
            lastBottombarComputedWidth = bottomAdElement.getBoundingClientRect().width;
            applyCorrectIds(currentAdParent);
        }
    }, 200);
});


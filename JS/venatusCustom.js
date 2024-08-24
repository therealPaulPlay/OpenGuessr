// Sample code from the venatus modified for our use case
window.top.__vm_add = window.top.__vm_add || [];

let adElements = [document.getElementById("bottomFooterAds"), document.getElementById("resultLeaderboardAd"), document.getElementById("floatingResultLeaderboardAd")];

export function clearResultAds() {
    document.getElementById("resultLeaderboardAd").innerHTML = "";
    document.getElementById("floatingResultLeaderboardAd").innerHTML = "";
}

export function applyCorrectIds(skipOtherScreens) {
    try {
        adElements.forEach((e) => {
            if (skipOtherScreens && e != adElements[0]) {
                return;
            }

            try {
                // Check if the placement already exists
                let placement = e.querySelector('.vm-placement');

                if (!placement) {
                    // If placement doesn't exist, create a new one
                    placement = document.createElement("div");
                    placement.setAttribute("class", "vm-placement");
                    e.appendChild(placement);
                }

                // Update placement attributes based on element width - not 728 by design, because Chrome often miscalculates element size and thinks it is 727.99px instead of 728px
                if (e.getBoundingClientRect().width >= 720) {
                    placement.setAttribute("data-id", "666702f0549bd20a9f2bfab6"); // Desktop Multi-Size leaderboard
                } else {
                    placement.setAttribute("data-id", "66670320549bd20a9f2bfaba"); // Mobile Leaderboard
                }

                // push the placement to the venatus array
                window.top.__vm_add.push(placement);

            } catch (error) {
                console.error("Error in custom ad script: " + error);
            }
        });

    } catch (error) {
        console.error("Venatus custom script returned this error: " + error);
    }
}

// Apply IDs when the page is loaded
if (window.document.readyState !== "loading") {
    applyCorrectIds(true);
} else {
    window.document.addEventListener("DOMContentLoaded", function () {
        applyCorrectIds(true);
    });
}

let onResizeTimeout;

// Apply IDs (once) when the window is resized
window.addEventListener("resize", function () {
    this.clearTimeout(onResizeTimeout);

    onResizeTimeout = setTimeout(() => {
        applyCorrectIds();
    }, 100);
});


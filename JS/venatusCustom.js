// Sample code from the venatus modified for our use case
try {
    window.top.__vm_add = window.top.__vm_add || [];

    let previousFooterAdsWidth;
    let footerAdsScaler = document.getElementById("bottomFooterAds");

    let adElements = [document.getElementById("bottomFooterAds"), document.getElementById("resultLeaderboardAd"), document.getElementById("floatingResultLeaderboardAd")];

    function applyCorrectIds() {
        if (previousFooterAdsWidth != footerAdsScaler.getBoundingClientRect().width) {
            adElements.forEach((e) => {
                // Check if the placement already exists
                let placement = e.querySelector('.vm-placement');

                if (!placement) {
                    // If placement doesn't exist, create a new one
                    placement = document.createElement("div");
                    placement.setAttribute("class", "vm-placement");
                    e.appendChild(placement);
                }

                // Update placement attributes based on element width
                if (e.getBoundingClientRect().width >= 728) {
                    placement.setAttribute("data-id", "666702f0549bd20a9f2bfab6"); //Desktop Multi-Size leaderboard
                } else {
                    placement.setAttribute("data-id", "66670320549bd20a9f2bfaba"); //Mobile Leaderboard
                }

                previousFooterAdsWidth = e.getBoundingClientRect().width;

                // push the placement to the venatus array
                window.top.__vm_add.push(placement);
            });
        }
    }

    // Apply IDs when the page is loaded
    if (window.document.readyState !== "loading") {
        applyCorrectIds();
    } else {
        window.document.addEventListener("DOMContentLoaded", function () {
            applyCorrectIds();
        });
    }

    // Apply IDs when the window is resized
    window.addEventListener("resize", function () {
        applyCorrectIds();
    });

} catch (error) {
    console.error("Venatus custom script returned this error: " + error);
}


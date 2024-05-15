//Sample code from the venatus discord group modified for our use case
try {
    window.top.__vm_add = window.top.__vm_add || [];

    let previousFooterAdsWidth;
    let footerAdsScaler = document.getElementById("bottomFooterAds");
    
    function applyCorrectIds() {
        if (previousFooterAdsWidth != footerAdsScaler.getBoundingClientRect().width) {

            // Check if the placement already exists
            let placement = footerAdsScaler.querySelector('.vm-placement');
    
            if (!placement) {
                // If placement doesn't exist, create a new one
                placement = document.createElement("div");
                placement.setAttribute("class", "vm-placement");
                footerAdsScaler.appendChild(placement);
            }
    
            // Update placement attributes based on element width
            if (footerAdsScaler.getBoundingClientRect().width >= 728) {
                placement.setAttribute("data-id", "662edb31cf5c49162f52b298"); //Desktop Multi-Size leaderboard
            } else {
                placement.setAttribute("data-id", "662edba67e16dc002af51186"); //Mobile Leaderboard
            }
    
            previousFooterAdsWidth = footerAdsScaler.getBoundingClientRect().width;
    
            //push the placement to the venatus array
            window.top.__vm_add.push(placement); 
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
    window.addEventListener("resize", function() {
        applyCorrectIds();
    });

} catch (error) {
    console.error("Venatus custom script returned this error: " + error);
}


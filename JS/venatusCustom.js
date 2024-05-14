//Sample code from the venatus discord group modified for our use case
try {
    window.top.vm_add = window.top.vm_add || [];
    
    (function (success) {
        if (window.document.readyState !== "loading") {
            success();
        } else {
            window.document.addEventListener("DOMContentLoaded", function () {
                success();
            });
        }
    
    })(function () {
        let placement = document.createElement("div");
        placement.setAttribute("class", "vm-placement");
    
        let footerAdsScaler = document.getElementById("bottomFooterAds");
    
        if (footerAdsScaler.innerWidth >= 728) {
                placement.setAttribute("data-id", "662edb31cf5c49162f52b298"); //Desktop Multi-Size leaderboard
        } else {
            placement.setAttribute("data-id", "662edba67e16dc002af51186"); //Mobile Leaderboard
        }
    
        footerAdsScaler.appendChild(placement);
        window.top.__vm_add.push(placement);
    });
} catch (error) {
    console.error("Venatus custom script returned this error: " + error);
}

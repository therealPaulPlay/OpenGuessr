import { page } from "$app/state";

function getFuse() {
    return window.fusetag || (window.fusetag = { que: [] });
}

export function initializeAds() {

    // Specify domain for testing environments
    if (page.url.hostname !== "openguessr.com") {
        window.googletag = window.googletag || { cmd: [] };
        googletag.cmd.push(function () {
            googletag.pubads().set("page_url", "openguessr.com");
        });
    }

    getFuse().que.push(function () {
        getFuse().pageInit();
    });
}

export function registerGameplayAd() {
    getFuse().que.push(function () {
        getFuse().registerZone("gameplayAd");
    });
}

export function registerResultAds() {
    getFuse().que.push(function () {
        getFuse().registerZone("resultAd");
        getFuse().registerZone("mobileResultAd");
    });
}
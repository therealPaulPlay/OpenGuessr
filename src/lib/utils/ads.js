import { page } from "$app/state";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { tick } from "svelte";
import { get } from "svelte/store";

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
        console.log("Set googletag page_url for testing");
    }

    getFuse().que.push(function () {
        getFuse().pageInit({
            blockingFuseIds: ["Game_incontent_1"],
        });
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

/*
For result ad registration - potentially only register currently visible?
Although Fuse should probably handle this and only active displayed zones?

if (window.matchMedia("(min-width: 1900px)").matches) {
    getFuse().que.push(function () {
        getFuse().registerZone("resultAd");
    });
} else {
    getFuse().que.push(function () {
        getFuse().registerZone("mobileResultAd");
    });
}
*/
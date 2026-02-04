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
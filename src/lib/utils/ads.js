import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { tick } from "svelte";

// Initialize Ads
let fusetag;

export function initializeAds() {
    fusetag = window.fusetag || (window.fusetag = { que: [] });

    fusetag.que.push(function () {
        fusetag.pageInit({
            blockingFuseIds: ["Game_incontent_1"],
        });
    });
}

resultScreenEnabled.subscribe(async (isEnabled) => {
    await tick(); // Await UI update to reflect new store value
    if (typeof window === "undefined") return;
    if (!fusetag) return console.warn("Fusetag not initialized yet.");
    if (isEnabled) {
        if (window.matchMedia("(min-width: 1900px)")) fusetag.activateZone("resultAd");
        else fusetag.activateZone("mobileResultAd");
    } else {
        fusetag.activateZone("gameplayAd");
    }
});

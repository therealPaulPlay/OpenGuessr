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

let prevResultState = false;
let pendingOperation = 0;

resultScreenEnabled.subscribe(async (isEnabled) => {
    if (typeof window === "undefined") return;

    // Only update on state change
    if (prevResultState === isEnabled) return;
    prevResultState = isEnabled;

    const operationId = ++pendingOperation;

    await tick(); // Await UI update to reflect new store value

    // Cancel if another operation started while we were waiting
    if (operationId !== pendingOperation) return;

    // Return if fuse is not initialized
    if (!fusetag) return console.warn("Fusetag not initialized yet.");
    try {
        if (isEnabled) {
            if (window.matchMedia("(min-width: 1900px)").matches) fusetag.activateZone("resultAd");
            else fusetag.activateZone("mobileResultAd");
        } else {
            fusetag.activateZone("gameplayAd");
        }
    } catch (error) {
        console.error("Error occured activating fuse zones:", error);
    }
});

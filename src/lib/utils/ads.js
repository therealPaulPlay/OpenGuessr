import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { tick } from "svelte";

function getFuse() {
    return window.fusetag || (window.fusetag = { que: [] });
}

export function initializeAds() {
    if (typeof window === "undefined") return; // Skip on the server
    getFuse().que.push(function () {
        getFuse().pageInit({
            blockingFuseIds: ["Game_incontent_1"],
        });
    });
}

export function registerAndActivateGameplayAd() {
    getFuse().que.push(function () {
        getFuse().registerZone("gameplayAd");
        // getFuse().activateZone("gameplayAd"); Test this as disabled
    });
}

export function registerResultAds() {
    getFuse().que.push(function () {
        getFuse().registerZone("resultAd");
        getFuse().registerZone("mobileResultAd");
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

    try {
        if (isEnabled) {
            if (window.matchMedia("(min-width: 1900px)").matches) {
                getFuse().que.push(function () {
                    getFuse().activateZone("resultAd");
                });
            } else {
                getFuse().que.push(function () {
                    getFuse().activateZone("mobileResultAd");
                });
            }
        } else {
            getFuse().que.push(function () {
                getFuse().activateZone("gameplayAd");
            });
        }
    } catch (error) {
        console.error("Error occured activating fuse zones:", error);
    }
});

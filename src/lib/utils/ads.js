import { page } from "$app/state";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { tick } from "svelte";
import { get } from "svelte/store";

function getFuse() {
    return window.fusetag || (window.fusetag = { que: [] });
}

export function initializeAds() {
    // On test sites, this script needs to run to simulate the real domain
    if (page.url.hostname !== "openguessr.com") {
        window.googletag = window.googletag || { cmd: [] };
        googletag.cmd.push(function () {
            googletag.pubads().set("page_url", "https://openguessr.com/");
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

export function activateGameplayAd() {
    getFuse().que.push(function () {
        getFuse().activateZone("gameplayAd");
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

    activateCorrectZones(isEnabled);
});

function activateCorrectZones(onResultScreen = false) {
    try {
        if (onResultScreen) {
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
        console.error("Error activating fuse zones:", error);
    }
}

let debounceTimeout;

export function refreshOnResize() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        // Step 1: Re-register ads
        if (get(resultScreenEnabled)) registerResultAds();
        else registerGameplayAd();

        // Step 2: Activate currenetly visible ads
        activateCorrectZones(get(resultScreenEnabled));

        debounceTimeout = null;
    }, 150);
}
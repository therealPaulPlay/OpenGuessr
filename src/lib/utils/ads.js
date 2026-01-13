import { page } from "$app/state";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { tick } from "svelte";
import { get } from "svelte/store";

function getFuse() {
    return window.fusetag || (window.fusetag = { que: [] });
}

let lastBreakpoint = null;

export function initializeAds() {
    getFuse().que.push(function () {
        getFuse().pageInit({
            blockingFuseIds: ["Game_incontent_1"],
        });
        lastBreakpoint = getFuse().getCurrentBreakpoint?.()?.name; // Get initial breakpoint
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
    if (lastBreakpoint === null) {
        console.warn("Last breakpoint from Fuse not initialized yet!");
        return;
    }

    const currentBreakpoint = getFuse().getCurrentBreakpoint?.()?.name;

    if (currentBreakpoint !== lastBreakpoint) {
        lastBreakpoint = currentBreakpoint;

        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            // Step 1: Re-register ads
            if (get(resultScreenEnabled)) registerResultAds();
            else registerGameplayAd();

            // Step 2: Activate currently visible ads
            activateCorrectZones(get(resultScreenEnabled));

            debounceTimeout = null;
        }, 1000);
    }
}
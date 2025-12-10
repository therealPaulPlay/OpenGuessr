import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";

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

resultScreenEnabled.subscribe((isEnabled) => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
        if (isEnabled) {
            if (window.matchMedia("min-width: 1900px")) fusetag.activateZone("Game_Result_incontent_1");
            else fusetag.activateZone("Game_Result_Mob_Only");

        } else fusetag.activateZone("Game_incontent_1");
    });
})

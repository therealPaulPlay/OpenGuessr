import { modeText, mapModeIndicatorVisible } from "$lib/stores/context-specific/mapModeIndicatorStore";
import {
    timerCountdownOverlay,
    timerCountdownOverlayTitle,
    singleplayerTimer,
} from "$lib/stores/context-specific/timerCountdownOverlayStore";
import { singleplayer, singleplayerTimeout, isSingleplayerNMPZ } from "$lib/stores/modeStore";
import { setRestriction } from "$lib/utils/setRestriction";
import { get } from "svelte/store";
import { startTimer } from "$lib/utils/timer";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";

let timeoutVariable;
let startTimeoutVariable;
let intervalTimeoutVariable;

let startHardModePromise;

export function applySingleplayerSettings() {
    // Disable all here, then enable what should be enabled
    timerCountdownOverlay.set(false);
    get(singleplayerTimer)?.stopTimer();

    clearTimeout(timeoutVariable);
    clearTimeout(startTimeoutVariable);
    clearInterval(intervalTimeoutVariable);

    if (get(singleplayer)) {
        if (get(singleplayerTimeout)) {
            mapModeIndicatorVisible.set(true);
            modeText.set("Singleplayer");

            startHardModePromise = new Promise((resolve, reject) => {
                timerCountdownOverlay.set(true);
                timerCountdownOverlayTitle.set(3);

                let loopIndex = 2;

                intervalTimeoutVariable = setInterval(() => {
                    timerCountdownOverlayTitle.set(loopIndex);
                    loopIndex--;
                }, 800);

                startTimeoutVariable = setTimeout(() => {
                    clearInterval(intervalTimeoutVariable);
                    resolve("start");
                }, 2400);
            });

            startHardModePromise.then(function () {
                timerCountdownOverlay.set(false);
                singleplayerTimer.set(startTimer(get(singleplayerTimeout), () => {
                    timerCountdownOverlay.set(true);
                    timerCountdownOverlayTitle.set("The time is up!");
                }));
            });
        } else {
            mapModeIndicatorVisible.set(false); // Hide MapMpdeIndicator
        }

        // Set singleplayer restriction
        (get(isSingleplayerNMPZ)) ? setRestriction("nmpz") : setRestriction("standard");
    }
}

resultScreenEnabled.subscribe((value) => {
    if (value && get(singleplayerTimer)) get(singleplayerTimer)?.stopTimer();
});
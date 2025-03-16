import { modeText, mapModeIndicatorVisible } from "$lib/stores/context-specific/mapModeIndicatorStore";
import {
    timerCountdownOverlay,
    timerCountdownOverlayTitle,
    timerCountdownOverlaySubtitle,
} from "$lib/stores/context-specific/timerCountdownOverlayStore";
import { singleplayer, singleplayerTimeout, isSingleplayerNMPZ } from "$lib/stores/modeStore";
import { setRestriction } from "$lib/utils/setRestriction";
import { get } from "svelte/store";
import { startTimer } from "$lib/utils/timer";

let timeoutVariable;
let startTimeoutVariable;
let intervalTimeoutVariable;

let timer;
let startHardModePromise;

export function applySingleplayerSettings() {
    // Disable all here, then enable what should be enabled
    timerCountdownOverlay.set(false);

    try {
        timer.stopTimer();
    } catch { }

    clearTimeout(timeoutVariable);
    clearTimeout(startTimeoutVariable);
    clearInterval(intervalTimeoutVariable);

    // Now, enable what's needed if in Singleplayer
    if (get(singleplayer)) {
        
        // Timer
        if (get(singleplayerTimeout)) {
            mapModeIndicatorVisible.set(true);
            modeText.set("Singleplayer");

            startHardModePromise = new Promise((resolve, reject) => {
                timerCountdownOverlay.set(true);
                timerCountdownOverlaySubtitle.set("Get ready...");
                timerCountdownOverlayTitle.set("Starting in 3");

                let loopIndex = 2;

                intervalTimeoutVariable = setInterval(() => {
                    timerCountdownOverlayTitle.set("Starting in " + loopIndex);
                    loopIndex--;
                }, 700);

                startTimeoutVariable = setTimeout(() => {
                    clearInterval(intervalTimeoutVariable);
                    resolve("start");
                }, 2100);
            });

            startHardModePromise.then(function () {
                timerCountdownOverlay.set(false);

                timer = startTimer(get(singleplayerTimeout), () => {
                    timerCountdownOverlay.set(true);
                    timerCountdownOverlayTitle.set("The time is up!");
                    timerCountdownOverlaySubtitle.set("Please take your guess.");
                });
            });
        } else {
            mapModeIndicatorVisible.set(false); // Hide MapMpdeIndicator
        }


        // Reset restriction
        setRestriction("standard");

        // If NMPZ
        if (get(isSingleplayerNMPZ)) setRestriction("nmpz");
    }
}
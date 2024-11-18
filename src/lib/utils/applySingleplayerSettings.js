import { modeText, mapModeIndicatorVisible } from "$lib/stores/context-specific/mapModeIndicatorStore";
import {
    timerCountdownOverlay,
    timerCountdownOverlayTitle,
    timerCountdownOverlaySubtitle,
} from "$lib/stores/context-specific/timerCountdownOverlayStore";
import { singleplayer, isSingleplayerNMPZ, timeout } from "$lib/stores/modeStore";
import { get } from "svelte/store";
import { singleplayerNMPZ } from "$lib/stores/uiStore";
import { startTimer } from "$lib/utils/timer";

let timeoutVariable;
let startTimeoutVariable;
let intervalTimeoutVariable;

let timer;
let startHardModePromise;

export function applySingleplayerSettings() {
    // Disable all here, then enable what should be enabled
    timerCountdownOverlay.set(false);
    isSingleplayerNMPZ.set(false);

    try {
        timer.stopTimer();
    } catch { }

    clearTimeout(timeoutVariable);
    clearTimeout(startTimeoutVariable);
    clearInterval(intervalTimeoutVariable);

    // Now, enable what's needed if in Singleplayer
    if (get(singleplayer)) {
        if (get(isSingleplayerNMPZ)) {
            singleplayerNMPZ.set(true);
        }

        if (get(timeout)) {
            // Show MapModeIndicator (Timer UI)
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
                    resolve("start");
                    clearInterval(intervalTimeoutVariable);
                }, 2000);
            });

            startHardModePromise.then(function () {
                timerCountdownOverlay.set(false);

                timer = startTimer(get(timeout), () => {
                    timerCountdownOverlay.set(true);
                    timerCountdownOverlayTitle.set("The time is up!");
                    timerCountdownOverlaySubtitle.set("Please take your guess.");
                });
            });
        } else {
            mapModeIndicatorVisible.set(false); // Hide MapMpdeIndicator
        }
    }
}
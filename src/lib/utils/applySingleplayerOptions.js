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

let startTimeoutVariable;
let intervalTimeoutVariable;
let startSingleplayerTimerPromise;

let hasRestoredSavedNMPZstate = false;
let hasRestoredSavedTimeout = false;

export function resetApplySingleplayerOptions() {
    // Disable all here, then enable what should be enabled
    timerCountdownOverlay.set(false);
    get(singleplayerTimer)?.stopTimer();

    clearTimeout(startTimeoutVariable);
    clearInterval(intervalTimeoutVariable);

    // Get singleplayer timer duration from storage
    if (!hasRestoredSavedTimeout) {
        singleplayerTimeout.set(localStorage.getItem("singleplayerTimer") != null ? Number(localStorage.getItem("singleplayerTimer")) : 0);
        hasRestoredSavedTimeout = true;
    }

    if (get(singleplayer)) {
        if (get(singleplayerTimeout)) {
            startSingleplayerTimerPromise = new Promise((resolve, _reject) => {
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

            startSingleplayerTimerPromise.then(function () {
                timerCountdownOverlay.set(false);
                singleplayerTimer.set(startTimer(get(singleplayerTimeout), () => {
                    timerCountdownOverlay.set(true);
                    timerCountdownOverlayTitle.set("The time is up!");
                }));
            });
        }

        // Load & Set singleplayer restriction
        if (!hasRestoredSavedNMPZstate) {
            isSingleplayerNMPZ.set(localStorage.getItem("singleplayerNMPZ")
                ? Boolean(localStorage.getItem("singleplayerNMPZ"))
                : false);
            hasRestoredSavedNMPZstate = true;
        }
        (get(isSingleplayerNMPZ)) ? setRestriction("nmpz") : setRestriction();
    }
}

resultScreenEnabled.subscribe((value) => {
    if (value && get(singleplayerTimer)) get(singleplayerTimer)?.stopTimer();
});
import {
    timerCountdownOverlay,
    timerCountdownOverlayTitle,
} from "$lib/stores/context-specific/timerCountdownOverlayStore";
import { singleplayer } from "$lib/stores/modeStore";
import { get } from "svelte/store";
import { startTimer } from "$lib/utils/timer";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { inMenu } from "$lib/stores/uiStore";

let singleplayerTimer;
let startPending = false;

let startTimeoutVariable;
let intervalTimeoutVariable;

function resetSingleplayerTimer() {
    startPending = false;
    clearTimeout(startTimeoutVariable);
    clearInterval(intervalTimeoutVariable);
    timerCountdownOverlay.set(false);
    singleplayerTimer?.stopTimer();
}

export function checkStartSingleplayerTimer() {
    resetSingleplayerTimer();
    if (!get(singleplayer)) return; // Exit if not in singleplayer
    if (get(inMenu)) return startPending = true; // Defer the start to when menu is closed

    const singleplayerTimeout = Number(localStorage.getItem("singleplayerTimer")) || 0;

    // Countdown animation flow
    if (singleplayerTimeout) {
        const startSingleplayerTimerPromise = new Promise((resolve, _reject) => {
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
            if (get(inMenu)) return startPending = true; // Redo countdown once the menu is closed again
            singleplayerTimer = startTimer(singleplayerTimeout, () => {
                timerCountdownOverlay.set(true);
                timerCountdownOverlayTitle.set("The time is up!");
            });
        });
    }
}

resultScreenEnabled.subscribe((value) => {
    if (value) resetSingleplayerTimer();
});

singleplayer.subscribe((value) => {
    if (!value) resetSingleplayerTimer();
});

inMenu.subscribe((value) => {
    if (value) singleplayerTimer?.pauseTimer();
    else if (startPending) checkStartSingleplayerTimer();
    else singleplayerTimer?.resumeTimer();
});
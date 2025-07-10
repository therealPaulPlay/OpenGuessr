import { playSound, stopSound } from "./soundManager";
import {
    mapModeIndicatorFading,
    timerText,
} from "$lib/stores/context-specific/mapModeIndicatorStore";
import { littleTimeVignette } from "$lib/stores/uiStore";

// Keep track of active timer to ensure proper cleanup
let activeTimer = null;

export function startTimer(durationInSeconds, onTimerExpired) {
    // If there's an active timer, stop it first
    if (activeTimer) activeTimer.stopTimer();

    let currentTimerIntervalId;
    let isRunning = false;
    let timer = durationInSeconds;
    let intervalDuration = durationInSeconds < 1 ? 0.1 : 1;

    currentTimerIntervalId = setInterval(function () {
        isRunning = true;
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);
        const formattedTime = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

        timerText.set(formattedTime);

        if (timer < 10 && timer % 1 == 0) {
            mapModeIndicatorFading.set(true);
            playSound("ticking_timer", "timerSound");
            littleTimeVignette.set(true);
        } else {
            mapModeIndicatorFading.set(false);
            littleTimeVignette.set(false);
        }

        timer -= intervalDuration;

        if (timer < 0) {
            stopTimer();
            timerExpired();
        }
    }, intervalDuration * 1000);

    function timerExpired() {
        if (typeof onTimerExpired === 'function') {
            onTimerExpired();
        }
    }

    function stopTimer() {
        clearInterval(currentTimerIntervalId);
        isRunning = false;
        mapModeIndicatorFading.set(false);
        littleTimeVignette.set(false);
        stopSound("timerSound");

        // Clear active timer reference if this is the active timer
        if (activeTimer === timerInstance) activeTimer = null;
        if (!activeTimer) timerText.set("00:00") 
    }

    function getRemainingTime() {
        return timer;
    }

    function isTimerRunning() {
        return isRunning;
    }

    const timerInstance = {
        getRemainingTime,
        stopTimer,
        isTimerRunning
    };

    // Set this as the active timer
    activeTimer = timerInstance;

    return timerInstance;
}
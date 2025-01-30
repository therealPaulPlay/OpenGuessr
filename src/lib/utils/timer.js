import { playSound, stopSound } from "./soundManager";
import {
    indicatorFading,
    timerText,
} from "$lib/stores/context-specific/mapModeIndicatorStore";
import { littleTimeVignette } from "$lib/stores/uiStore";

// Keep track of active timer to ensure proper cleanup
let activeTimer = null;

export function startTimer(durationInSeconds, onTimerExpired) {
    // If there's an active timer, stop it first
    if (activeTimer) {
        activeTimer.stopTimer();
    }

    let currentTimerIntervalId;
    let isRunning = false;
    let timer = durationInSeconds;
    let onChangeCallback = null;

    currentTimerIntervalId = setInterval(function () {
        isRunning = true;
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);
        const formattedTime = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

        timerText.set(formattedTime);

        // Call the onTimerChange callback with just the seconds if it exists
        if (typeof onChangeCallback === 'function') onChangeCallback(timer);

        if (timer < 10) {
            indicatorFading.set(true);
            playSound("ticking_timer", "timerSound");
            littleTimeVignette.set(true);
        } else {
            indicatorFading.set(false);
            littleTimeVignette.set(false);
        }

        if (--timer < 0) {
            stopTimer();
            timerExpired();
        }
    }, 1000);

    function timerExpired() {
        if (typeof onTimerExpired === 'function') {
            onTimerExpired();
        }
    }

    function stopTimer() {
        clearInterval(currentTimerIntervalId);
        isRunning = false;
        indicatorFading.set(false);
        littleTimeVignette.set(false);
        stopSound("timerSound");
        setTimeout(() => { if (!activeTimer) timerText.set("00:00") }, 1000);

        // Clear active timer reference if this is the active timer
        if (activeTimer === timerInstance) {
            activeTimer = null;
        }
    }

    function getRemainingTime() {
        return timer;
    }

    function isTimerRunning() {
        return isRunning;
    }

    function onTimerChange(callback) {
        onChangeCallback = callback;
        return this;
    }

    const timerInstance = {
        getRemainingTime,
        stopTimer,
        isTimerRunning,
        onTimerChange
    };

    // Set this as the active timer
    activeTimer = timerInstance;

    return timerInstance;
}
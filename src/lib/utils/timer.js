import { playSound, stopSound } from "./soundManager";
import { mapModeIndicatorFading, timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { littleTimeVignetteVisible } from "$lib/stores/uiStore";

let activeTimer = null;

export function startTimer(durationInSeconds, onTimerExpired) {
    if (activeTimer) activeTimer.stopTimer();

    let currentTimerIntervalId;
    let isRunning = false;
    let timer = durationInSeconds;
    let intervalDuration = durationInSeconds < 1 ? 0.1 : 1;

    // Display initial time immediately
    updateDisplay();

    currentTimerIntervalId = setInterval(function () {
        isRunning = true;
        timer -= intervalDuration;

        // Check expiration after decrementing
        if (timer <= 0) {
            stopTimer();
            timerExpired();
            return;
        }

        updateDisplay();
    }, intervalDuration * 1000);

    function updateDisplay() {
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);
        const formattedTime = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        timerText.set(formattedTime);

        if (timer < 10 && timer % 1 == 0) {
            mapModeIndicatorFading.set(true);
            playSound("ticking_timer", "timerSound");
            littleTimeVignetteVisible.set(true);
        } else {
            mapModeIndicatorFading.set(false);
            littleTimeVignetteVisible.set(false);
        }
    }

    function timerExpired() {
        if (typeof onTimerExpired === 'function') onTimerExpired();
    }

    function stopTimer() {
        clearInterval(currentTimerIntervalId);
        isRunning = false;
        mapModeIndicatorFading.set(false);
        littleTimeVignetteVisible.set(false);
        stopSound("timerSound");
        if (activeTimer === timerInstance) activeTimer = null;
        if (!activeTimer) timerText.set(null);
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

    activeTimer = timerInstance;
    return timerInstance;
}
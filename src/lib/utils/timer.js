import { playSound, stopSound } from "./soundManager";
import { mapModeIndicatorFading, timerText } from "$lib/stores/context-specific/mapModeIndicatorStore";
import { littleTimeVignetteVisible } from "$lib/stores/uiStore";

let activeTimer = null;

export function startTimer(durationInSeconds, onTimerExpired) {
    if (activeTimer) activeTimer.stopTimer(); // If another timer is active, stop it (there should only be 1 timer)

    let currentTimerIntervalId;
    let isRunning = true;
    let isPaused = false;
    let endTimestamp = Date.now() + durationInSeconds * 1000; // When the timer ends as a unix timestamp (in ms)
    let remainingOnPause;
    let intervalDuration = durationInSeconds < 1 ? 0.1 : 1; // One blink mode compatibility

    // Display initial time immediately
    updateDisplay();

    currentTimerIntervalId = setInterval(function () {
        if (isPaused) return; // Interval keeps running while paused to preserve tick timing

        if (getRemainingTime() <= 0) {
            stopTimer();
            timerExpired();
            return;
        }

        updateDisplay();
    }, intervalDuration * 1000);

    // In seconds, rounded to the interval duration
    function getRemainingTime() {
        return Math.round((endTimestamp - Date.now()) / 1000 / intervalDuration) * intervalDuration;
    }

    function updateDisplay() {
        const remainingTime = getRemainingTime();
        const minutes = parseInt(remainingTime / 60, 10);
        const seconds = parseInt(remainingTime % 60, 10);
        const formattedTime = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        timerText.set(formattedTime);

        if (remainingTime < 10 && remainingTime % 1 == 0) {
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
        if (activeTimer !== timerInstance) return; // Don't reset sound or UI if another timer is active

        // Reset UI, sound, timer text, and set active timer null
        mapModeIndicatorFading.set(false);
        littleTimeVignetteVisible.set(false);
        stopSound("timerSound");
        timerText.set(null);
        activeTimer = null;
    }

    function pauseTimer() {
        if (isPaused || activeTimer !== timerInstance) return;
        isPaused = true;
        remainingOnPause = endTimestamp - Date.now();
        littleTimeVignetteVisible.set(false);
        stopSound("timerSound");
    }

    function resumeTimer() {
        if (!isPaused || activeTimer !== timerInstance) return;
        isPaused = false;
        endTimestamp = Date.now() + remainingOnPause;
        updateDisplay();
    }

    function isTimerActive() {
        return isRunning;
    }

    const timerInstance = {
        stopTimer,
        pauseTimer,
        resumeTimer,
        isTimerActive
    };

    activeTimer = timerInstance;
    return timerInstance;
}
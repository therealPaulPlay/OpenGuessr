import { playSound, stopSound } from "./soundManager";
import {
    indicatorFading,
    timerText,
} from "$lib/stores/context-specific/mapModeIndicatorStore";

import { littleTimeVignette } from "$lib/stores/uiStore";

export function startTimer(durationInSeconds, onTimerExpired) {
    let currentTimerIntervalId; // Variable to store the current interval ID
    let isRunning = false; // Flag to indicate if the timer is running
    clearInterval(currentTimerIntervalId); // Clear previous timer, if any

    let timer = durationInSeconds, minutes, seconds;

    currentTimerIntervalId = setInterval(function () {
        isRunning = true; // Set flag to true when the timer starts

        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerText.set(minutes + ":" + seconds);

        if (timer < 10) {
            indicatorFading.set(true);
            playSound("ticking_timer", "timerSound");
            littleTimeVignette.set(true);
        } else {
            indicatorFading.set(false);
            littleTimeVignette.set(false);
        }

        if (--timer < 0) {
            clearInterval(currentTimerIntervalId); // Stop the interval
            isRunning = false; // Set flag to false when the timer stops
            indicatorFading.set(false);
            littleTimeVignette.set(false);
            timerExpired(); // Call the function when timer expires
        }
    }, 1000);

    function timerExpired() {
        if (typeof onTimerExpired === 'function') {
            onTimerExpired();
        }
    }

    // Function to stop the timer
    function stopTimer() {
        clearInterval(currentTimerIntervalId);
        isRunning = false; // Set flag to false when the timer is stopped
        indicatorFading.set(false);
        littleTimeVignette.set(false);
        stopSound("timerSound");
    }

    // Function to get the remaining time
    function getRemainingTime() {
        return timer;
    }

    // Function to check if the timer is running
    function isTimerRunning() {
        return isRunning;
    }

    // Return an object with functions for controlling the timer
    return {
        getRemainingTime: getRemainingTime,
        stopTimer: stopTimer,
        isTimerRunning: isTimerRunning // Add this method to check if the timer is running
    };
}

import { playSound, stopSound } from "./soundManager";

// UI Timer ---------------------------------------------------------------------------------------------------------------------
export function startTimer(durationInSeconds, onTimerExpired) {
    let currentTimerIntervalId; // Variable to store the current interval ID
    let isRunning = false; // Flag to indicate if the timer is running
    clearInterval(currentTimerIntervalId); // Clear previous timer, if any

    let timer = durationInSeconds, minutes, seconds;
    const mapTimer = document.getElementById("mapTimer");
    const mapModeIndicator = document.getElementById("mapModeIndicator");

    currentTimerIntervalId = setInterval(function () {
        isRunning = true; // Set flag to true when the timer starts

        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        mapTimer.textContent = minutes + ":" + seconds;

        if (timer < 10) {
            mapTimer.classList.add("fading");
            mapModeIndicator.classList.add("fading");
            playSound("ticking_timer", "timerSound");
            document.getElementById("littleTimeVignette").style.opacity = "1";
        } else {
            mapTimer.classList.remove("fading");
            mapModeIndicator.classList.remove("fading");
            document.getElementById("littleTimeVignette").style.opacity = "0";
        }

        if (--timer < 0) {
            clearInterval(currentTimerIntervalId); // Stop the interval
            isRunning = false; // Set flag to false when the timer stops
            mapTimer.classList.remove("fading");
            mapModeIndicator.classList.remove("fading");
            document.getElementById("littleTimeVignette").style.opacity = "0";
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
        mapTimer.classList.remove("fading");
        mapModeIndicator.classList.remove("fading");
        document.getElementById("littleTimeVignette").style.opacity = "0";
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

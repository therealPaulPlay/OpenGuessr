//UI Timer ---------------------------------------------------------------------------------------------------------------------
export function startTimer(durationInSeconds, onTimerExpired) {
    let currentTimerIntervalId; // Variable to store the current interval ID
    clearInterval(currentTimerIntervalId); // Clear previous timer, if any

    let timer = durationInSeconds, minutes, seconds;
    const mapTimer = document.getElementById("mapTimer");
    const mapModeIndicator = document.getElementById("mapModeIndicator");

    currentTimerIntervalId = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        mapTimer.textContent = minutes + ":" + seconds;

        if (timer < 10) {
            mapTimer.classList.add("fading");
            mapModeIndicator.classList.add("fading");
        } else {
            mapTimer.classList.remove("fading");
            mapModeIndicator.classList.remove("fading");
        }

        if (--timer < 0) {
            clearInterval(currentTimerIntervalId); // Stop the interval
            mapTimer.classList.remove("fading");
            mapModeIndicator.classList.remove("fading");
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
        mapTimer.classList.remove("fading");
        mapModeIndicator.classList.remove("fading");
    }

    // Function to get the remaining time
    function getRemainingTime() {
        return timer;
    }

    // Return an object with functions for controlling the timer
    return {
        getRemainingTime: getRemainingTime,
        stopTimer: stopTimer
    };
}

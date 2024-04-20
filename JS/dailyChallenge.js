import { confirmButtonClicks } from "./miniMap";
import { setDailyChallengeScore } from "./userAPI"
import { multiplayerTimerExpired } from "./multiplayer";

export let dailyChallengeUIEnabled = false;
export let globalTimer;

//Set Daily challenge Experience (the result) ----------------------------------------------------------------
export function setDailyChallengeExperienceResult(result) {
    setDailyChallengeScore(localStorage.getItem("bearer"), localStorage.getItem("id"), result, "index");
}

//Daily Challenge UI ------------------------------------------------------------------------------------------
export function setDailyChallengeUI(enable) {
    dailyChallengeUIEnabled = enable ? true : false;

    if (enable) {
        document.getElementById("mapModeIndicator").style.display = "flex";
        document.getElementById("mapModeText").textContent = "Daily Challenge";
        document.getElementById("multiplayerLeave").display = "none";
    } else {
        document.getElementById("mapModeIndicator").style.display = "none";
    }
}

//UI Timer ---------------------------------------------------------------------------------------------------------------------
let currentTimerIntervalId; // Global variable to store the current interval ID

export function startTimer(durationInSeconds, onTimerExpired) {
    clearInterval(currentTimerIntervalId); // Clear previous timer, if any

    let timer = durationInSeconds, minutes, seconds;
    currentTimerIntervalId = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        document.getElementById("mapTimer").textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(currentTimerIntervalId); // Stop the interval
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

//Timer implementation for Daily Challenge ------------------------------------------------------------------------------------------------------------------

export function dailyChallengeCheckTimer() {
    if (dailyChallengeUIEnabled) {
        globalTimer = startTimer(120, dailyChallengeTimerExpired);
    }
}

function dailyChallengeTimerExpired() {
    confirmButtonClicks(); //if the timer expires and the player hasn't guessed yet, the guess function will be evoked.
}

//Daily Challenge end -------------------------------------------------------------------------------------------------------------------------------------
export function dailyChallengeEnd() {
    localStorage.setItem("selectedCategory", "standard"); //reset category to standard, so that if user returns after daily challenge it doesn't restart daily challenge
    window.location.href = "/dailyLeaderboard.html";
}

//Time system (the challenge should only be available once a day) -----------------------------------------------------------------------------------------
export function saveDailyChallengeCompletion() {
    const currentDate = new Date();
    const utcDate = currentDate.toISOString().split('T')[0]; // Get UTC date in 'YYYY-MM-DD' format
    localStorage.setItem("dailyChallenge", utcDate);
}

// Function to check if the daily challenge has been completed for today
export function checkDailyChallengeCompletion() {
    const dailyChallengeDate = localStorage.getItem("dailyChallenge");

    if (!dailyChallengeDate) {
        // No previous daily challenge completion date found, so challenge is available
        return 'available';
    }

    const currentDate = new Date();
    const utcDate = currentDate.toISOString().split('T')[0]; // Get UTC date in 'YYYY-MM-DD' format

    if (dailyChallengeDate === utcDate) {
        // Daily challenge has already been completed for today
        return 'completed';
    } else {
        // Previous daily challenge date doesn't match today's date, so challenge is available
        return 'available';
    }
}

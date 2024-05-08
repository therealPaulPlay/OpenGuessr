import { confirmButtonClicks } from "./miniMap";
import { setDailyChallengeScore } from "./userAPI"
import { startTimer } from "./timer";

export let dailyChallengeUIEnabled = false;
export let dailyChallengeTimer;



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
        document.getElementById("multiplayerLeave").style.display = "none";
    } else {
        document.getElementById("mapModeIndicator").style.display = "none";
    }
}

export function disableDailyChallengeVariableOnly() {
    dailyChallengeUIEnabled = false;
}

//Timer implementation for Daily Challenge ------------------------------------------------------------------------------------------------------------------

export function dailyChallengeCheckTimer() {
    if (dailyChallengeUIEnabled) {
        dailyChallengeTimer = startTimer(120, dailyChallengeTimerExpired);
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

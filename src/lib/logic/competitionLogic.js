import { startTimer } from "$lib/utils/timer";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { playSound } from "$lib/utils/soundManager";
import { errorPopup } from "$lib/utils/errorHandling";
import { setRestriction } from "$lib/utils/setRestriction";
import { addCompetitionPlayed } from "$lib/utils/updateProfileData";
import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
import { supporterLevel } from "$lib/stores/accountStore";
import { competition } from "$lib/stores/modeStore";
import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import {
    mapModeIndicatorVisible,
    modeText,
    leaveFunction
} from "$lib/stores/context-specific/mapModeIndicatorStore";
import { get } from "svelte/store";
import { username } from "$lib/stores/accountStore";

//  Load and enable Competition  ------------------------------------------------------------------------------------------

let competitionCombinedScore = 0;
let competitionTimer;

// Called in category menu before generating so that these values are set before they are needed!
export function loadCompetition() {
    competitionRound.set(0); // Reset round index
    competitionCombinedScore = 0; // Reset combined score
    leaveFunction.set(leaveCompetition); // Set leave function for mapModeIndicator

    if (get(competitionData)) {
        competition.set(true); // Activate Competition mode
        disableResultScreen(); // In case result screen is enabled
        setCompetitionUI(true);
        setRestriction(get(competitionData)?.restriction || "standard");
        addCompetitionPlayed();

        setTimeout(() => {
            playSound("match_start");
        }, 400);

        checkGenerationTypeAndGenerate();
    }
}

// Set competition UI ----------------------------------------------------------------------------------------------------
export function setCompetitionUI(enable) {
    if (enable) {
        mapModeIndicatorVisible.set(true);
        modeText.set("Competition");

    } else {
        mapModeIndicatorVisible.set(false);
        leaveFunction.set(); // Reset leave function
    }
}

// Round Logic ---------------------------------------------------------------------------------------------------------
export function checkStartCompetitionRound() {
    if (get(competition)) {
        competitionRound.set(get(competitionRound) + 1);
        modeText.set("Competition (Round: " + get(competitionRound) + "/" + competition.roundAmount + ")");

        if (get(competitionData)?.restriction && get(competitionData)?.restriction != "standard") {
            modeText.set("Competition (Round: " + get(competitionRound) + "/" + get(competitionData)?.roundAmount + ") (" + get(competitionData)?.restriction + ")");
        }

        competitionTimer = startTimer(get(competitionData)?.roundLength, confirmButtonClicks);
    }
}

export function stopCompetitionTimer() {
    try {
        competitionTimer.stopTimer();
    } catch { }
}

// Score logic ------------------------------------------------------------------------------------------------------
export function addResultToCompetitionScore(scoreToAdd) {
    competitionCombinedScore += scoreToAdd;
}

// Leave logic --------------------------------------------------------------------------------------------------------
export async function leaveCompetition(showResult) {
    if (get(competition)) {
        competition.set(false);
        setCompetitionUI(false);
        checkGenerationTypeAndGenerate();
        setRestriction("standard");

        // Now, submit result so you cant just play again and again - await this, so that your result pops up in the page browser
        await submitCompetitionResult(get(competitionData).id, competitionCombinedScore, get(supporterLevel), localStorage.getItem("bearer"));

        if (showResult) {
            window.location.href = "/competitions?leaderboard-submit=" + competition.id;
        }
    }
}

async function submitCompetitionResult(id, score, supporterLevel, token) {
    try {
        const requestBody = {
            username: get(username),
            id: localStorage.getItem("id"),
            score: score,
            supporter_level: supporterLevel || 0
        };

        const response = await fetch("https://competitions.openguessr.com/competitions/submit/" + id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let responseData = null;

            try {
                responseData = await response.json();
                let errorMessages = [];

                if (responseData.error) {
                    errorMessages.push(responseData.error);
                }

                if (responseData.message) {
                    errorMessages.push(responseData.message);
                }

                if (responseData.errors && Array.isArray(responseData.errors)) {
                    responseData.errors.forEach(err => {
                        if (err.msg) {
                            errorMessages.push(err.msg);
                        } else {
                            errorMessages.push(JSON.stringify(err));
                        }
                    });
                }

                console.error("Error during competition result submission: " + errorMessages.join(' '));
                errorPopup("Competition submission failed", "The result could not be submitted.", errorMessages.join(' '));
            } catch {
                console.error("Error occured when submitting result on server and response did not include a json response.");
                errorPopup("Competition submission failed", "Competition server did not include error messages in the response.", response.status);
            }
        }
    } catch (error) {
        console.error("Error occurred during competition result submission: " + error);
        errorPopup("Competition submission failed (Network)", "The comptition server could not be reached. Please check your internet connection and submit a bug report in the Discord if it persists.", error);
    }
}

// Check round status and end if needed ----------------------------------------------------------------------------------

export function checkCompetitionRoundStatus() {
    stopCompetitionTimer(); // Stop the timer

    if (get(competitionRound) == get(competitionData)?.roundAmount) {
        leaveCompetition(true);

        return false;
    } else {
        return true;
    }
}
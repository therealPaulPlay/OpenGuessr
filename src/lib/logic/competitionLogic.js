import { startTimer } from "$lib/utils/timer";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { playSound } from "$lib/utils/soundManager";
import { errorPopup } from "$lib/utils/errorHandling";
import { setRestriction } from "$lib/utils/setRestriction";
import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
import { competition } from "$lib/stores/modeStore";
import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import { goto } from "$app/navigation";
import {
    mapModeIndicatorVisible,
    mapModeIndicatorText,
    leaveFunction
} from "$lib/stores/context-specific/mapModeIndicatorStore";
import { get } from "svelte/store";
import { username } from "$lib/stores/accountStore";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";

//  Load and enable Competition  ------------------------------------------------------------------------------------------
let competitionCombinedScore = 0;
let competitionTimer;

// Called on the competition page when entering
export function loadCompetition() {
    competitionRound.set(0); // Reset round index
    competitionCombinedScore = 0; // Reset combined score
    leaveFunction.set(() => leaveCompetition(true)); // Set leave function for mapModeIndicator

    if (get(competitionData)) {
        competition.set(true); // Activate Competition mode
        disableResultScreen(); // In case result screen is enabled
        setCompetitionUI(true);
        setRestriction(get(competitionData)?.restriction || "standard");

        setTimeout(() => {
            playSound("match_start");
        }, 400);

        checkGenerationTypeAndGenerate();
    }
}

// Set competition UI ----------------------------------------------------------------------------------------------------
function setCompetitionUI(enable) {
    if (enable) {
        mapModeIndicatorVisible.set(true);
        mapModeIndicatorText.set("Competition");

    } else {
        mapModeIndicatorVisible.set(false);
        leaveFunction.set(); // Reset leave function
    }
}

// Round Logic ---------------------------------------------------------------------------------------------------------
export function checkStartCompetitionRound() {
    if (get(competition)) {
        competitionRound.set(get(competitionRound) + 1);
        mapModeIndicatorText.set("Competition (Round: " + get(competitionRound) + "/" + get(competitionData)?.roundAmount + ")");

        if (get(competitionData)?.restriction && get(competitionData)?.restriction != "standard") {
            mapModeIndicatorText.set("Competition (Round: " + get(competitionRound) + "/" + get(competitionData)?.roundAmount + ") (" + get(competitionData)?.restriction + ")");
        }

        competitionTimer = startTimer(get(competitionData)?.roundLength, confirmButtonClicks);
    }
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
        await submitCompetitionResult(get(competitionData).id, competitionCombinedScore);

        if (showResult) {
            goto("/competitions?leaderboard-submit=" + get(competitionData).id);
        }
    }
}

async function submitCompetitionResult(compId, score) {
    try {
        const requestBody = {
            id: localStorage.getItem("id"),
            score: score
        };

        const response = await fetch(get(accountUrl) + "/competitions/submit/" + compId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("bearer")}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let responseData = null;
            responseData = await response.json();
            if (responseData.error) throw new Error(responseData.error);
            else throw new Error("No error provided in response.");
        }
    } catch (error) {
        console.error("Error submitting competition result: " + error);
        errorPopup("Competition submission failed", "Failed to submit the competition result.", error.message);
    }
}

// Check round status and end if needed ----------------------------------------------------------------------------------
export function checkCompetitionRoundStatus() {
    if (get(competitionRound) == get(competitionData)?.roundAmount) {
        leaveCompetition(true);
        return false;
    } else return true;
}

// Stop timer on result screen ----------------------------------------------------------------------------------------
resultScreenEnabled.subscribe((value) => {
    if (value) competitionTimer?.stopTimer();
});
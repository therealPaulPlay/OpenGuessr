import { confirmButtonClicks } from "./miniMap";
import { startTimer } from "./timer";
import { showPageBrowser, toggleCategoryMenu } from "./mainUI";
import { checkGenerationTypeAndGenerate } from "./categoryMenu";
import { playSound } from "./soundManager";
import { errorPopup } from "./errorHandling";
import { setRestriction } from "./multiplayer";

//  Load and enable Competition  ------------------------------------------------------------------------------------------

export let competition;
export let playingCompetition = false;
export let currentRound = 0;

let competitionCombinedScore = 0;

export let competitionTimer;

// called in category menu before generating so that these values are set before they are needed!
export function loadCompetition(regenerate) {
    competition = JSON.parse(localStorage.getItem("competition"));

    currentRound = 0; // reset round index
    competitionCombinedScore = 0; // reset combined score

    if (competition) {
        localStorage.removeItem("competition"); // remove localstorage key
        playingCompetition = true;
        setCompetitionUI(true);
        setRestriction(competition.restriction);

        if (regenerate) {
            checkGenerationTypeAndGenerate();
        }
    }
}

// Set competition UI ----------------------------------------------------------------------------------------------------
export function setCompetitionUI(enable) {
    try {
        toggleCategoryMenu(true); // collapse category menu, then hide it
        let categoryButton = document.getElementById("categoryMenuButton");
        let floatingSocialButton = document.getElementById("floatingSocialButton");
        let hardmodeTimerButton = document.getElementById("timerButton");

        if (enable) {
            document.getElementById("mapModeIndicator").style.display = "flex";
            document.getElementById("mapModeText").textContent = "Competition";
            document.getElementById("multiplayerLeave").style.display = "none";
            document.getElementById("competitionLeave").style.display = "block";

            categoryButton.style.opacity = "0.5";
            categoryButton.style.pointerEvents = "none";
            floatingSocialButton.style.opacity = "0.5";
            floatingSocialButton.style.pointerEvents = "none";
            hardmodeTimerButton.style.opacity = "0.5";
            hardmodeTimerButton.style.pointerEvents = "none";

            document.getElementById("revealCompass").style.marginBottom = "-21px";
        } else {
            document.getElementById("mapModeIndicator").style.display = "none";

            categoryButton.style.opacity = "1";
            categoryButton.style.pointerEvents = "auto";
            floatingSocialButton.style.opacity = "1";
            floatingSocialButton.style.pointerEvents = "auto";
            hardmodeTimerButton.style.opacity = "1";
            hardmodeTimerButton.style.pointerEvents = "auto";

            document.getElementById("revealCompass").style.marginBottom = "-25px";
        }
    } catch (error) {
        console.error("Error enabling competition UI: " + error);
    }
}

// Round Logic ---------------------------------------------------------------------------------------------------------

export function checkStartCompetitionRound() {
    if (playingCompetition) {
        currentRound++;
        document.getElementById("mapModeText").textContent = "Competition (Round: " + currentRound + "/" + competition.roundAmount + ")";

        competitionTimer = startTimer(competition.roundLength, competitionTimerExpired);
    }
}

function competitionTimerExpired() {
    confirmButtonClicks(); //if the timer expires and the player hasn't guessed yet, the guess function will be evoked.
}

// Score logic ------------------------------------------------------------------------------------------------------

export function addResultToCompetitionScore(scoreToAdd) {
    competitionCombinedScore += scoreToAdd;
}

// Leave logic --------------------------------------------------------------------------------------------------------

let leaveButton = document.getElementById("competitionLeave");

leaveButton.addEventListener("click", () => {
    playSound("basic_button");
    leaveCompetition();
});

async function leaveCompetition() {
    playingCompetition = false;
    setCompetitionUI(false);
    checkGenerationTypeAndGenerate();
    setRestriction("standard");

    // Now, submit result so you cant just play again and again - await this, so that your result pops up in the page browser
    await submitCompetitionResult(competition.id, competitionCombinedScore, localStorage.getItem("bearer"));

    // Show the leaderboard
    showPageBrowser("/competitions.html?leaderboard=" + competition.id);
}

async function submitCompetitionResult(id, score, token) {
    try {
        const requestBody = {
            username: localStorage.getItem("username"),
            id: localStorage.getItem("id"),
            score: score
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

export function checkCompetitionRoundStatus(justReturnResult) {
    if (currentRound == competition.roundAmount) {
        if (!justReturnResult) {
            leaveCompetition();
        }

        return false;
    } else {
        return true;
    }
}
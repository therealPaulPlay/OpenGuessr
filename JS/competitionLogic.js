import { confirmButtonClicks } from "./miniMap";
import { setDailyChallengeScore } from "./userAPI"
import { startTimer } from "./timer";
import { showPageBrowser, toggleCategoryMenu } from "./mainUI";
import { checkGenerationTypeAndGenerate } from "./categoryMenu";
import { playSound } from "./soundManager";

//  Load and enable Competition  ------------------------------------------------------------------------------------------

export let competition;
export let playingCompetition = false;
export let currentRound = 0;

export let competitionTimer;

// called in category menu before generating so that these values are set before they are needed!
export function loadCompetition(regenerate) {
    competition = JSON.parse(localStorage.getItem("competition"));

    currentRound = 0; // reset round index

    if (competition) {
        localStorage.removeItem("competition"); // remove localstorage key
        playingCompetition = true;
        setCompetitionUI(true);

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

            document.querySelectorAll(".mapAttribution").forEach((element) => { // remove this for js maps api
                element.style.bottom = "58px";
            });
        } else {
            document.getElementById("mapModeIndicator").style.display = "none";

            categoryButton.style.opacity = "1";
            categoryButton.style.pointerEvents = "auto";
            floatingSocialButton.style.opacity = "1";
            floatingSocialButton.style.pointerEvents = "auto";
            hardmodeTimerButton.style.opacity = "1";
            hardmodeTimerButton.style.pointerEvents = "auto";

            document.getElementById("revealCompass").style.marginBottom = "-25px";

            document.querySelectorAll(".mapAttribution").forEach((element) => { // remove this for js maps api
                element.style.bottom = "0px";
            });
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

// Leave logic --------------------------------------------------------------------------------------------------------

let leaveButton = document.getElementById("competitionLeave");

leaveButton.addEventListener("click", () => {
    playSound("basic_button");
    leaveCompetition();
});

function leaveCompetition() {
    playingCompetition = false;
    setCompetitionUI(false);
    checkGenerationTypeAndGenerate();

    // Now, TODO submit result so you cant just play again and again

    // Show the leaderboard
    showPageBrowser("/competitions.html?leaderboard=" + competition.id);
}

// Check round status and end if needed ----------------------------------------------------------------------------------

export function checkCompetitionRoundStatus() {
    if (currentRound == competition.roundAmount) {
        leaveCompetition();
        return false;
    } else {
        return true;
    }
}
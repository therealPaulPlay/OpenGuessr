import { multiplayer, competition, singleplayer } from "$lib/stores/modeStore";
import { guessLat, guessLon } from "$lib/stores/context-specific/mapStore";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { updateProfileIfNewBestStreak } from "$lib/utils/updateProfileData";
import { isAuthenticated, supporterLevel } from "$lib/stores/accountStore";
import { streakCountText, lastExpCalculationSignedOut, earnedExperience, streakMultiplierText } from "$lib/stores/context-specific/resultScreenStore";
import { multiplayerMap, socket } from "$lib/stores/context-specific/multiplayerStore";
import { addResultToCompetitionScore } from "$lib/logic/competitionLogic";
import { supporterXpBoostAnimation } from "$lib/utils/supporterBoostAnimation";
import { addUserXP } from "$lib/utils/updateUserXP";
import { getCountryFromCoords } from "$lib/utils/countryFromCoordinates";
import { playSound } from "$lib/utils/soundManager";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuessrFunctions";
import { get } from "svelte/store";
import { getMapBounds } from "$lib/utils/getMapBounds";
import { showResultScreenSlideup } from "$lib/utils/resultScreenSlideup";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
import { errorPopup } from "$lib/utils/errorHandling";

// Streak ----------------------------------------------------------------------------------------------------------------------------------------------------
function calculateMultiplier(streakParam) {
    return streakParam === 0 ? 1 : streakParam >= 9 ? 1.5 : Math.round((1 + (streakParam / 9) * 0.5) * 100) / 100;
}

async function streakCalculation() {
    let streak = Number(localStorage.getItem("streak") || 0); // Load streak from localstorage

    // Indicate loading in UI
    streakCountText.set("-");
    streakMultiplierText.set("...");

    if (await getCountryFromCoords(get(guessLat), get(guessLon)) == await getCountryFromCoords(get(currentLocationLatitude), get(currentLocationLongitude))) {
        streak++;
    } else {
        if (streak >= 2) showResultScreenSlideup("Streak lost", `You lost your streak of ${streak}.`);
        if (streak >= 1) updateProfileIfNewBestStreak(streak);
        streak = 0; // Reset streak
    }

    const streakMultiplier = calculateMultiplier(streak);
    localStorage.setItem("streak", streak);

    // Set UI to values
    streakCountText.set(String(streak));
    streakMultiplierText.set(streakMultiplier + "x");

    return streakMultiplier;
}

// Adjust XP calculation parameter to diameter (map size)
function calculateExponentialModifier(mapDiameter) {
    return 0.999 - 0.08 * Math.exp(-0.06 * mapDiameter);
}

// Calculate XP gain --------------------------------------------------------------------------------------------------------------------------------
async function calculateXPGain(distance, map, supporterLevelParam) {
    let returnXP;
    if (distance < 0.025) distance = 0; // Treat distances < 25m as 0 to be more friendly with 5ks

    // If the map is big enough to encompass many countries, calculate the country streak
    const streakMultiplier = (getMapBounds().diameter > 250 && get(singleplayer) && get(isAuthenticated) && map !== "Country Guessr") ? await streakCalculation() : 1;

    if (map == "Country Guessr") returnXP = checkIfGuessWasCorrect() ? 1000 : 0;
    else returnXP = Math.round(5000 * ((calculateExponentialModifier(getMapBounds().diameter)) ** distance) * streakMultiplier);

    let supporterMultiplier = 1;

    if (supporterLevelParam) {
        switch (supporterLevelParam) {
            case 1:
                supporterMultiplier = 1.1;
                break;
            case 2:
                supporterMultiplier = 1.15;
                break;
            case 3:
                supporterMultiplier = 1.25;
                break;
        }
    }

    return { earnedXP: Math.round(returnXP * supporterMultiplier), earnedXPWithoutSupporterBoost: returnXP, supporterMultiplier: supporterMultiplier };
}

let animateSupporterBoostTimeout;

// Load Experience stats on result screen -----------------------------------------------------------------------------------------------------------------------------
export async function loadResultScreenXP(distance) {

    // (Re-)sets
    let supporterMultiplier = 1;
    clearTimeout(animateSupporterBoostTimeout);
    streakCountText.set(null);
    streakMultiplierText.set(null);

    // Post-signin saves -----------------------------------------------------
    if (!get(isAuthenticated) && get(singleplayer)) lastExpCalculationSignedOut.set(true);
    else lastExpCalculationSignedOut.set(false);

    // Calculate experience and streak --------------------------------------
    let earnedXP;
    let earnedBasicXP; // Without supporter mutliplier, that will be applied later (this is just for visuals)

    const selectedMap = !get(multiplayer) ? localStorage.getItem("selectedMap") || get(defaultMap) : get(multiplayerMap);

    // XP calculation formulas -------------------------------------------------
    if (get(singleplayer) || get(multiplayer)) {
        const adjustedSupporterLevel = get(multiplayer) ? get(socket)?.storage?.highestSupporterLevel : get(supporterLevel);
        const calculatedXP = await calculateXPGain(distance, selectedMap, adjustedSupporterLevel);
        earnedXP = calculatedXP.earnedXP;
        earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
        supporterMultiplier = calculatedXP.supporterMultiplier;

        // Add XP to score
        if (get(multiplayer)) get(socket)?.sendRequest("addToScore", earnedXP).catch((error) => {
            if (get(multiplayer)) errorPopup("Failed to add to score", "An error occured trying to submit the score addition.", error.message);
            console.error("Error adding to score:", error);
        });

    } else if (get(competition)) {
        const calculatedXP = await calculateXPGain(distance, get(defaultMap));
        earnedXP = calculatedXP.earnedXP;
        earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost; // Supporter multiplier omitted because it should stay 1 (disabled)
        addResultToCompetitionScore(earnedXP);
    }

    // Apply XP visually and server-wise ----------------------------------
    earnedExperience.set(earnedBasicXP || 0);

    if (earnedXP > 0 && get(isAuthenticated)) addUserXP(earnedXP); // Save XP to database
    if (earnedBasicXP > 50 && get(isAuthenticated)) setTimeout(playScoreincreaseSound, 500);

    if (supporterMultiplier > 1 && earnedXP > earnedBasicXP) { // check if multiplier is greater than 1 + if it would actually make a difference
        supporterXpBoostAnimation(supporterMultiplier);
        animateSupporterBoostTimeout = setTimeout(() => {
            earnedExperience.set(earnedXP || 0);
        }, 3500);
    }
}

function playScoreincreaseSound() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            playSound("score_increase");
        }, 50 * i)
    }
}
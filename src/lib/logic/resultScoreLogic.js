import { multiplayer, competition, singleplayer } from "$lib/stores/modeStore";
import { mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { setCheckNewHighestCountryStreak } from "$lib/utils/updateProfileData";
import { isAuthenticated, supporterLevel, experience } from "$lib/stores/accountStore";
import { streakText, showStreakDisplay, lastDistance, lastExperienceCalculationAborted, experienceBarAnimated, earnedExperience } from "$lib/stores/context-specific/resultScreenStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { addResultToCompetitionScore } from "$lib/logic/competitionLogic";
import { supporterXpBoostAnimation } from "$lib/utils/supporterBoostAnimation";
import { addUserXP } from "$lib/utils/updateUserXP";
import { saveRoundToLog } from "$lib/utils/saveRoundToLog";
import { getCountryFromCoords } from "$lib/utils/countryFromCoordinates";
import { playSound } from "$lib/utils/soundManager";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuessrFunctions";
import { get } from "svelte/store";
import { getMapBounds } from "$lib/utils/getMapBounds";
import { toggleStreakWindow } from "$lib/utils/streakRestore";

// Streak ----------------------------------------------------------------------------------------------------------------------------------------------------
function calculateMultiplier(streakParam) {
    return streakParam === 0 ? 1 : streakParam >= 9 ? 1.5 : Math.round((1 + (streakParam / 9) * 0.5) * 100) / 100;
}

export function restoreOldStreak(oldStreak) {
    localStorage.setItem("streak", oldStreak);
    streakText.set(oldStreak + " (" + calculateMultiplier(oldStreak) + "x)");
}

async function streakCalculation() {
    let streak = Number(localStorage.getItem("streak") || 0); // Load streak from localstorage

    if (await getCountryFromCoords(get(mapPinLat), get(mapPinLng)) == await getCountryFromCoords(get(currentLocationLatitude), get(currentLocationLongitude))) {
        streak++;
    } else {
        if (streak >= 2) toggleStreakWindow(streak, false);
        if (streak >= 1) setCheckNewHighestCountryStreak(streak);
        streak = 0; // Reset country streak ( = Streak lost, but still restorable wit ad)
    }

    const streakMultiplier = calculateMultiplier(streak);
    streakText.set(streak + " (" + streakMultiplier + "x)");
    showStreakDisplay.set(true);
    localStorage.setItem("streak", streak);
    return streakMultiplier;
}

// Adjust XP calculation parameter to diameter (map size)
function calculateExponentialModifier(mapDiameter) {
    return 0.999 - 0.08 * Math.exp(-0.06 * mapDiameter);
}

// Calculate XP gain --------------------------------------------------------------------------------------------------------------------------------
async function calculateXPGain(distance, category, supporterLevelParam) {
    let returnXP = 0;
    if (distance < 0.025) distance = 0; // Treat distances < 25m as 0 to be more friendly with 5ks

    // If the map is big enough to encompass many countries, calculate the country streak
    const streakMultiplier = (getMapBounds().diameter > 250 && get(singleplayer) && get(isAuthenticated) && category !== "country guessr") ? await streakCalculation() : 1;

    if (category == "country guessr") returnXP = checkIfGuessWasCorrect() ? 1000 : 0;
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
                supporterMultiplier = 1.2;
                break;
            case 4:
                supporterMultiplier = 1.25;
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
    showStreakDisplay.set(false);

    // Post-signin saves -----------------------------------------------------
    if (!get(isAuthenticated) && get(singleplayer)) {
        lastDistance.set(distance);
        lastExperienceCalculationAborted.set(true);
    } else {
        lastExperienceCalculationAborted.set(false);
    }

    // Save played round to log ------------------------------------------------
    let mode = get(singleplayer) ? "Singleplayer" : get(multiplayer) ? "Multiplayer" : get(competition) ? "Competition" : "Unknown";
    saveRoundToLog(mode, distance, [get(currentLocationLatitude), get(currentLocationLongitude)]);

    // Calculate experience and streak --------------------------------------
    let earnedXP;
    let earnedBasicXP; // Without supporter mutliplier, that will be applied later (this is just for visuals)
    const selectedCategory = !get(multiplayer) ? localStorage.getItem("selectedCategory") || "standard" : get(socket)?.getStorage?.category;

    // XP calculation formulas -------------------------------------------------
    if (get(singleplayer) || get(multiplayer)) {
        const adjustedSupporterLevel = get(multiplayer) ? get(socket)?.getStorage?.highestSupporterLevel : get(supporterLevel);
        const calculatedXP = await calculateXPGain(distance, selectedCategory, adjustedSupporterLevel);
        earnedXP = calculatedXP.earnedXP;
        earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
        supporterMultiplier = calculatedXP.supporterMultiplier;

        // Add XP to score
        if (get(multiplayer)) get(socket)?.sendRequest("addToScore", earnedXP);

    } else if (get(competition)) {
        const calculatedXP = await calculateXPGain(distance, "standard");
        earnedXP = calculatedXP.earnedXP;
        earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost; // Supporter multiplier omitted because it should stay 1 (disabled)
        addResultToCompetitionScore(earnedXP);
    }

    // Apply XP visually and server-wise ----------------------------------
    experienceBarAnimated.set(false);
    earnedExperience.set(earnedBasicXP || 0);

    if (earnedXP > 0 && get(isAuthenticated)) addUserXP(earnedXP); // Save XP to database
    if (earnedBasicXP > 50 && get(isAuthenticated)) setTimeout(playScoreincreaseSound, 500);
    if (earnedXP > 0) experienceBarAnimated.set(true);

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
import { multiplayer, competition, singleplayer } from "$lib/stores/modeStore";
import { mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore";
import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
import { toggleStreakRestoreWindow } from "$lib/stores/context-specific/toggleStreakRestoreStore";
import { setCheckNewHighestStreak } from "$lib/utils/updateProfileData";
import { isAuthenticated, freeSupporterBoostEnabled, supporterLevel, experience } from "$lib/stores/accountStore";
import { streakText, showStreakDisplay, lastDistance, lastExperienceCalculationAborted, experienceBarAnimated, earnedExperience } from "$lib/stores/context-specific/resultScreenStore";
import { peer } from "$lib/stores/context-specific/multiplayerStore";
import { updatePeerScore } from "$lib/logic/multiplayerLogic";
import { addResultToCompetitionScore } from "$lib/logic/competitionLogic";
import { supporterXpBoostAnimation } from "$lib/utils/supporterBoostAnimation";
import { setUserXP } from "$lib/utils/setUserXP";
import { mapDiameter } from "$lib/stores/context-specific/mapStore";
import { saveRoundToLog } from "$lib/utils/saveRoundToLog";
import { getCountryFromCoords } from "$lib/utils/countryFromCoordinates";
import { playSound } from "$lib/utils/soundManager";
import { checkIfGuessWasCorrect } from "$lib/utils/countryGuesserFunctions";
import { get } from "svelte/store";

// Streak ----------------------------------------------------------------------------------------------------------------------------------------------------
let streak = 0;
let streakMultiplier = 1;

function loadStreak() {
    let tempLoadedStreak = Number(localStorage.getItem("streak") || 0);

    if (tempLoadedStreak) {
        streak = tempLoadedStreak;
    }
}

function calculateMultiplier(streakParam) {
    if (streakParam === 0) {
        return 1;
    } else if (streakParam >= 9) {
        return 1.5;
    } else {
        return Math.round((1 + (streakParam / 9) * 0.5) * 100) / 100;
    }
}

export function restoreOldStreak(oldStreak) {
    streak = oldStreak;
    localStorage.setItem("streak", streak);
    streakMultiplier = calculateMultiplier(streak);

    streakText.set(streak + " (" + streakMultiplier + "x)");
}

async function streakCalculation() {
    if (get(singleplayer)) {
        loadStreak(); // Load streak from localstorage

        if (await getCountryFromCoords(get(mapPinLat), get(mapPinLng)) == await getCountryFromCoords(get(currentLocationLatitude), get(currentLocationLongitude))) {
            streak++;
        } else {
            if (streak >= 2) get(toggleStreakRestoreWindow)(streak, false);

            setCheckNewHighestStreak(streak); // checks if this was the highest streak yet and 
            streak = 0; //reset country streak ( = Streak lost, but still restorable wit ad)
        }

        localStorage.setItem("streak", streak);

        streakMultiplier = calculateMultiplier(streak);
        streakText.set(streak + " (" + streakMultiplier + "x)");

        showStreakDisplay.set(true);
    }
}

function getStreakMultiplierAdjustedToGamemode() {
    return get(singleplayer) ? streakMultiplier : 1;
}

// Adjust XP calculation parameter to diameter (map size)
function calculateExponentialModifier(mapDiameter) {
    const A = 0.9982;
    const B = 0.08;
    const C = 0.06;
    return A - B * Math.exp(-C * mapDiameter);
}

// Calculate XP gain --------------------------------------------------------------------------------------------------------------------------------

async function calculateXPGain(distance, category, supporterLevelParam, freeSupporterBoost) {
    let returnXP = 0;

    if (!category || category == "standard" || category == "capital cities") {
        await streakCalculation();
        returnXP = Math.round((5000 * ((0.9985) ** distance)) * getStreakMultiplierAdjustedToGamemode());

    } else if (category == "famous places" || category == "image guesser") {
        await streakCalculation();
        returnXP = Math.round((1500 * ((0.9982) ** distance)) * getStreakMultiplierAdjustedToGamemode()); // 1500 xp, with streak up to 1800sth

    } else if (category == "country guesser") {
        returnXP = checkIfGuessWasCorrect() ? 1000 : 0;

    } else {
        if (get(mapDiameter) > 250) await streakCalculation(); // If the map is big enough, calculate the country streak
        returnXP = Math.round(5000 * ((calculateExponentialModifier(get(mapDiameter))) ** distance));
    }

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

    if (freeSupporterBoost && supporterMultiplier < 1.2) {
        supporterMultiplier = 1.2;
    }

    return { earnedXP: Math.round(returnXP * supporterMultiplier), earnedXPWithoutSupporterBoost: returnXP, supporterMultiplier: supporterMultiplier };
}

let animateSupporterBoostTimeout;


// Load Experience stats on result screen -----------------------------------------------------------------------------------------------------------------------------
export async function loadResultScreenXP(distance) {

    let supporterMultiplier = 1;
    clearTimeout(animateSupporterBoostTimeout);

    lastDistance.set(distance);

    if (!get(isAuthenticated) && !get(multiplayer)) lastExperienceCalculationAborted.set(true);

    // Save played round to log ------------------------------------------------
    let mode = "Singleplayer";

    if (get(multiplayer)) mode = "Multiplayer";
    if (get(competition)) mode = "Competition";

    saveRoundToLog(mode, distance, [get(currentLocationLatitude), get(currentLocationLongitude)]);

    // If Authenticated or in Multiplayer, show XP thing ------------------------------
    if (get(isAuthenticated) || get(multiplayer)) {

        // Hide streak display
        showStreakDisplay.set(false);
        lastExperienceCalculationAborted.set(false);
        let currentXP = Number(get(experience)) || 0;

        let earnedXP;
        let earnedBasicXP; // Without supporter mutliplier, that will be applied later (this is just for visuals)

        const selectedCategory = localStorage.getItem("selectedCategory") || "standard";

        // XP calculation formulas -------------------------------------------------
        if (get(singleplayer) || get(multiplayer)) {
            const adjustedSupporterLevel = get(multiplayer) ? get(peer)?.getStorage?.highestSupporterLevel : get(supporterLevel);

            const calculatedXP = await calculateXPGain(distance, selectedCategory, adjustedSupporterLevel, get(singleplayer) ? get(freeSupporterBoostEnabled) : undefined);
            earnedXP = calculatedXP.earnedXP;
            earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost;
            supporterMultiplier = calculatedXP.supporterMultiplier;

            if (get(multiplayer)) updatePeerScore(earnedXP); // Add XP to score

        } else if (get(competition)) {
            const calculatedXP = await calculateXPGain(distance, "standard");
            earnedXP = calculatedXP.earnedXP;
            earnedBasicXP = calculatedXP.earnedXPWithoutSupporterBoost; // supporter multiplier omitted because it should stay 1 (disabled)
            addResultToCompetitionScore(earnedXP);
        }

        // Apply XP visually and server-wise ----------------------------------

        experienceBarAnimated.set(false);
        earnedExperience.set(earnedBasicXP);

        if (earnedXP > 0 && get(isAuthenticated)) {
            setUserXP(currentXP + earnedXP); // Save XP to database
            experienceBarAnimated.set(true);
        }

        if (earnedBasicXP > 50) {
            setTimeout(() => {
                playScoreincreaseSound();
            }, 500);
        }

        setTimeout(function () {
            if (supporterMultiplier > 1 && earnedXP > earnedBasicXP) { // check if multiplier is greater than 1 + if it would actually make a difference
                supporterXpBoostAnimation(supporterMultiplier);
                animateSupporterBoostTimeout = setTimeout(() => {
                    earnedExperience.set(earnedXP);
                }, 3500);
            }
        }, 10);

    }
}

function playScoreincreaseSound() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            playSound("score_increase");
        }, 50 * i)
    }
}
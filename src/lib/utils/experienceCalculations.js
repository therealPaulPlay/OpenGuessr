// Calculate Level, XP until next level, fraction (how many percent of next level done) etc.
import { experience } from "$lib/stores/accountStore";
import { get } from "svelte/store";
// NOW TODO: apply this to progressRingLevel and progressRing, and resultLevelDisplay

export function getLevel() {
    return experienceCalculations(get(experience)).level;
}

export function getLevelFraction() {
    return experienceCalculations(get(experience)).fraction;
}

export function getRequiredLevelUpExperience() {
    return experienceCalculations(get(experience)).requiredForLevelUpgrade;
}

function experienceCalculations(xp) {
    if (xp == null) xp = 0;

    let requiredXP;
    const baseXP = 5000;
    const xpIncreaseRate = 1.1; // XP growth factor per level

    let templevel = 1;
    requiredXP = baseXP;

    // Calculate the level
    while (xp >= requiredXP) {
        xp -= requiredXP;
        templevel++;
        requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
    }

    return { fraction: (xp / requiredXP), requiredForLevelUpgrade: requiredXP - xp, level: templevel };
}
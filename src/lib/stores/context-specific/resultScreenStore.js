import { writable } from "svelte/store";

export const resultScreenEnabled = writable(false);
export const distanceText = writable("Distance not loaded.") // Distance, e.g. 15.000m or 345.45 km
export const motivationText = writable("Well done! Default Motivation!"); // Result screen text that comments on the result, e.g. "Very close!"
export const continueText = writable("Continue");
export const earnedExperience = writable(0);
export const streakText = writable("1 (default)");
export const lastDistance = writable();
export const lastExperienceCalculationAborted = writable(false);

export const experienceBarAnimated = writable(true);
export const showStreakDisplay = writable(true);
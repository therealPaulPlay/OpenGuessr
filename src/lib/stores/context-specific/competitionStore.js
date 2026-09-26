import { writable } from "svelte/store";

export const competitionData = writable();
export const competitionRound = writable(0);

// For result popup
export const competitionResultId = writable(null);
export const competitionResultRating = writable(false);

// For streak calendar
export const dailyStreakDays = writable([]);
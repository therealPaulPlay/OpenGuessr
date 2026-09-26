import { writable } from "svelte/store";

export const tutorialStep = writable(-1); // -1 = not retrieved from storage yet, 0 = hidden, 1, 2 etc. are different contents displayed
export const tutorial = writable(false);
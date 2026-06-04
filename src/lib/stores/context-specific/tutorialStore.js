import { writable } from "svelte/store";

export const tutorialStep = writable(0); // 0 = hidden, 1, 2 etc. are different contents displayed
export const tutorial = writable(false);
import { writable } from "svelte/store";

export const signupMessageText = writable("");
export const signupMessageColor = writable("white");
export const signupMessageShown = writable(false);
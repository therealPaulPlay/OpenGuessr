import { writable } from "svelte/store";

// Modes
export const imageGuesser = writable(false);
export const multiplayer = writable(false);
export const singleplayer = writable(true);

// Mode options

// Singleplayer
export const timeout = writable(0);
export const isSingleplayerNMPZ = writable(false);
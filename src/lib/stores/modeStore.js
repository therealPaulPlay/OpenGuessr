import { writable } from "svelte/store";

// Modes
export const imageGuesser = writable(false);
export const countryGuesser = writable(false);

// Singleplayer, Multiplayer or Competition
export const singleplayer = writable(true);
export const multiplayer = writable(false);
export const competition = writable(false);

// Mode Options -----------------------------------------------------

// Singleplayer
export const singleplayerTimeout = writable(0);
export const isSingleplayerNMPZ = writable(false);
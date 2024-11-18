import { writable } from "svelte/store";

// Modes
export const imageGuesser = writable(false);
export const countryGuesser = writable(false);

// Singleplayer or Multiplayer
export const singleplayer = writable(true);
export const multiplayer = writable(false);

// More Options -----------------------------------------------------

// Singleplayer
export const timeout = writable(0);
export const isSingleplayerNMPZ = writable(false);
import { writable, derived } from "svelte/store";
import { get } from "svelte/store";

// Modes
export const imageGuessr = writable(false);
export const countryGuessr = writable(false);

// Singleplayer, Multiplayer or Competition
export const multiplayer = writable(false);
export const competition = writable(false);
export const singleplayer = derived([multiplayer, competition], ([$multiplayer, $competition]) => {
    return !($multiplayer || $competition);
});

// Mode Options -----------------------------------------------------

// Singleplayer
export const singleplayerTimeout = writable(0);
export const isSingleplayerNMPZ = writable(false);
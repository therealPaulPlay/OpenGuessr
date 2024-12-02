// Platform settings, unique to Mobile, Game Platforms like CrazyGames etc.
import { writable } from "svelte/store";

// Settings
export const adsDisabled = writable(false);
export const preventExitPopup = writable(false);

// Platforms
export const crazyGames = writable(false);
// Platform settings, unique to Mobile, Game Platforms like CrazyGames etc.
import { writable } from "svelte/store";

// Settings
export const adsDisabled = writable(false);
export const preventExitPopup = writable(false);
export const disableExternalLinks = writable(false); // Such as other games in maps menu

// Platforms
export const crazyGames = writable(false);
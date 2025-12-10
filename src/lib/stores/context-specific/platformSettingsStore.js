// Platform settings, unique to Mobile, Game Platforms like CrazyGames etc.
import { derived, writable } from "svelte/store";
import { supporterLevel } from "../accountStore";

// Settings
export const preventFullscreen = writable(false);
export const disableAutoAuthentication = writable(false);

// Platforms
export const crazyGames = writable(false);
export const playlightSDK = writable();

// Ad settings
export const adsDisabled = derived([supporterLevel, crazyGames], ([$supporterLevel, $crazyGames]) => {
    return ($supporterLevel >= 2 || $crazyGames);
});
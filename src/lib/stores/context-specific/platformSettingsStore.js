// Platform settings, unique to Mobile, Game Platforms like CrazyGames etc.
import { derived, writable } from "svelte/store";
import { supporterLevel } from "../accountStore";

// Platforms
export const crazyGames = writable(false);
export const y8Games = writable(false);
export const playlightSDK = writable();

// Platform settings
export const adsDisabled = derived([supporterLevel, crazyGames, y8Games], ([$supporterLevel, $crazyGames, $y8Games]) => {
    return ($supporterLevel >= 2 || $crazyGames || $y8Games);
});
export const externalLinksDisabled = derived([crazyGames, y8Games], ([$crazyGames, $y8Games]) => $crazyGames || $y8Games);
export const preventFullscreen = derived([crazyGames, y8Games], ([$crazyGames, $y8Games]) => $crazyGames || $y8Games);
export const disableAutoAuthentication = derived([crazyGames, y8Games], ([$crazyGames, $y8Games]) => $crazyGames || $y8Games);
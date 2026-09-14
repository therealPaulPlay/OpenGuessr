// Platform settings, unique to Mobile, Game Platforms like CrazyGames etc.
import { derived, writable } from "svelte/store";
import { supporterLevel } from "../accountStore";

// Platforms
export const crazyGames = writable(false);
export const playlightSDK = writable();

// Platform settings
export const adsDisabled = derived([supporterLevel, crazyGames], ([$supporterLevel, $crazyGames]) => {
    return ($supporterLevel >= 2 || $crazyGames);
});
export const externalLinksDisabled = derived([crazyGames], ([$crazyGames]) => $crazyGames);
export const preventFullscreen = derived([crazyGames], ([$crazyGames]) => $crazyGames);
export const disableAutoAuthentication = derived([crazyGames], ([$crazyGames]) => $crazyGames);
// Platform settings, unique to Mobile, Game Platforms like CrazyGames etc.
import { derived, writable } from "svelte/store";
import { supporterLevel } from "../accountStore";

// Platforms
export const crazyGames = writable(false);
export const y8Games = writable(false);
export const playgama = writable(false);
export const playlightSDK = writable();
export const nativePlatform = writable(); // "ios", "android", "steam"
export const native = derived(nativePlatform, ($nativePlatform) => Boolean($nativePlatform));

// Platform settings
export const adsDisabled = derived([supporterLevel, crazyGames, y8Games, playgama, native], ([$supporterLevel, $crazyGames, $y8Games, $playgama, $native]) => {
    return ($supporterLevel >= 2 || $crazyGames || $y8Games || $playgama || $native);
});
export const externalLinksDisabled = derived([crazyGames, y8Games, playgama], ([$crazyGames, $y8Games, $playgama]) => $crazyGames || $y8Games || $playgama);
export const purchasesDisabled = derived([externalLinksDisabled, native], ([$externalLinksDisabled, $native]) => $externalLinksDisabled || $native);
export const preventFullscreen = derived([crazyGames, y8Games, playgama, nativePlatform], ([$crazyGames, $y8Games, $playgama, $nativePlatform]) => $crazyGames || $y8Games || $playgama || $nativePlatform == "ios" || $nativePlatform == "android");
export const autoAuthenticationDisabled = derived([crazyGames, y8Games, playgama], ([$crazyGames, $y8Games, $playgama]) => $crazyGames || $y8Games || $playgama);
export const analyticsDisabled = derived([playgama], ([$playgama]) => $playgama);
export const inviteLinksDisabled = derived([y8Games, playgama], ([$y8Games, $playgama]) => $y8Games || $playgama);
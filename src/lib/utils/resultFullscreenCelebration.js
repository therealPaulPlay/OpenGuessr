import { earnedExperience, fullscreenCelebrationNumber, showFullscreenCelebration } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";

let animationTimeout;

export function checkDisplayFullscreenCelebration() {
    if (get(earnedExperience) >= 5000) {
        fullscreenCelebrationNumber.set(Math.floor(get(earnedExperience) / 1000))
        clearTimeout(animationTimeout);
        showFullscreenCelebration.set(true);
        animationTimeout = setTimeout(() => (showFullscreenCelebration.set(false)), 1000);
    }
}
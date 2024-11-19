// This function can be used to animate number changes in elements (e.g. the XP that ticks up)
import { playSound } from "$lib/utils/soundManager";

export function animateIncrement(element, startValue, endValue, duration) {
    let startTime = null;
    let lastValue = startValue;
    let lastSoundPlayTime = 0; // Track the time of the last sound play
    const soundCooldown = 100; // Minimum time between sound plays (in milliseconds)

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1); // Progress from 0 to 1
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3); // Ease-out cubic function
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutCubic(progress));

        // Update only the XP part of the text while keeping the rest intact
        const originalText = element.dataset.originalText;
        element.innerHTML = originalText.replace(/(\+\d+)\s*(XP)/, `+${currentValue} $2`);

        // Check if value increased and enough time has passed since the last sound play
        if (currentValue > lastValue) {
            const now = Date.now();

            if (now - lastSoundPlayTime >= soundCooldown) {
                playSound("score_increase");
                lastSoundPlayTime = now; // Update the last sound play time
            }

            lastValue = currentValue;
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // Ensure it ends at the exact endValue
            element.innerHTML = originalText.replace(/(\+\d+)\s*(XP)/, `+${endValue} $2`);
        }
    }

    // Store the original text in a data attribute if not already done
    if (!element.dataset.originalText) {
        element.dataset.originalText = element.innerHTML;
    }

    requestAnimationFrame(step);
}
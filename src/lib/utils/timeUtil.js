import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { get } from "svelte/store";

let lastFetchedLocalTime = 0; // Stores local Date.now() when last fetch happened
let lastServerTimestamp = 0; // Stores server timestamp at that fetch
let pendingPromise = null; // Stores in-flight promise for concurrent calls

// In milliseconds, unix timestamp
export async function getServerTimestamp() {
    const now = Date.now(); // Current local time in ms

    // If last fetch was within 5 minutes, estimate time using the stored offset
    if (now - lastFetchedLocalTime < 300000) return lastServerTimestamp + Math.round((now - lastFetchedLocalTime));

    // If there's already a pending request, return that promise instead of creating a new one
    if (pendingPromise) return pendingPromise;

    // Create a new promise for the API call and store it
    pendingPromise = (async () => {
        // Timeout control: Abort request if it takes longer than 1s
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);

        try {
            const response = await fetch(get(accountUrl) + '/accounts/rooms/time/timestamp', {
                signal: controller.signal
            });

            if (!response.ok) throw new Error('Server responded with non-200 status');

            const data = await response.json();

            // Store the fetched server time and local time for accurate estimation
            lastFetchedLocalTime = Date.now();
            lastServerTimestamp = Math.round(data?.timestamp);
            return lastServerTimestamp;
        } catch (error) {
            console.error("Error getting time from server:", error);
            // Fallback: Use previous estimated time if available, otherwise local time
            return lastServerTimestamp
                ? lastServerTimestamp + Math.round((now - lastFetchedLocalTime))
                : Math.round(now);
        } finally {
            clearTimeout(timeout); // Ensure timeout is cleared
            pendingPromise = null; // Clear the pending promise when done
        }
    })();

    return pendingPromise;
}
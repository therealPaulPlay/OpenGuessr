let lastFetchedLocalTime = 0; // Stores local Date.now() when last fetch happened
let lastServerTimestamp = 0;  // Stores server timestamp at that fetch

// In seconds, unix timestamp
export async function getServerTimestamp() {
    const now = Date.now(); // Current local time in ms

    // If last fetch was within 120 seconds, estimate time using the stored offset
    if (now - lastFetchedLocalTime < 120000) {
        return lastServerTimestamp + Math.round((now - lastFetchedLocalTime) / 1000);
    }

    // Timeout control: Abort request if it takes longer than 1s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    try {
        const response = await fetch('https://accounts.openguessr.com/accounts/rooms/time/timestamp', {
            signal: controller.signal
        });

        if (!response.ok) throw new Error('Server responded with non-200 status');
        const data = await response.json();

        // Store the fetched server time and local time for accurate estimation
        lastFetchedLocalTime = Date.now();
        lastServerTimestamp = Math.round(data?.timestamp / 1000);

        return lastServerTimestamp;
    } catch (error) {
        console.error("Error getting time from server:", error);

        // Fallback: Use previous estimated time if available, otherwise local time
        return lastServerTimestamp
            ? lastServerTimestamp + Math.round((now - lastFetchedLocalTime) / 1000)
            : Math.round(now / 1000);
    } finally {
        clearTimeout(timeout); // Ensure timeout is cleared
    }
}
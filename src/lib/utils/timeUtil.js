export async function getServerTimestamp() {
    // If the server doesn't respond for > 1 second, grab local time instead
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    try {
        const response = await fetch('https://accounts.openguessr.com/accounts/rooms/time/timestamp', {
            signal: controller.signal
        });
        if (!response.ok) throw new Error('Server responded with non-200 status');
        const data = await response.json();
        clearTimeout(timeout);
        return Math.round(data?.timestamp / 1000);
    } catch (error) {
        console.error("Error getting time from server:", error);
        return Math.round(Date.now() / 1000);
    }
}
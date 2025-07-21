// Save round to round log (visible in Singleplayer Menus)
import { roundLog } from "$lib/stores/locationStore";

export function saveRoundToLog(mode, distance, coordinates) {
    try {
        let roundLogFromStorage = localStorage.getItem("roundLog");
        roundLogFromStorage = roundLogFromStorage ? JSON.parse(roundLogFromStorage) : [];
        roundLog.set(roundLogFromStorage);
    } catch (error) {
        console.error("Error parsing round log:", error);
        roundLog.set([]);
    }
    roundLog.update((log) => {
        const updatedLog = [[mode, distance, coordinates], ...log];
        if (updatedLog.length > 20) updatedLog.pop(); // Limit to 20 items
        localStorage.setItem("roundLog", JSON.stringify(updatedLog));
        return updatedLog;
    });
}
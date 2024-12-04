// Save round to round log (visible in Singleplayer Menus)
import { roundLog } from "$lib/stores/locationStore";

export function saveRoundToLog(mode, distance, coordinates) {
    roundLog.update((log) => {
        const updatedLog = [[mode, distance, coordinates], ...log];
        if (updatedLog.length > 20) updatedLog.pop(); // Limit to 20 items
        localStorage.setItem("roundLog", JSON.stringify(updatedLog));
        return updatedLog;
    });
}
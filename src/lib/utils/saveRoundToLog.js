import { roundLog } from "$lib/stores/locationStore";
import { competition, multiplayer, singleplayer } from "$lib/stores/modeStore";
import { get } from "svelte/store";

export function saveRoundToLog(distance, location) {
    const mode = get(singleplayer) ? "Singleplayer" : get(multiplayer) ? "Multiplayer" : get(competition) ? "Competition" : "Unknown";

    try {
        let roundLogFromStorage = localStorage.getItem("roundLog");
        roundLogFromStorage = roundLogFromStorage ? JSON.parse(roundLogFromStorage) : [];
        roundLog.set(roundLogFromStorage);
    } catch (error) {
        console.error("Error parsing round log:", error);
        roundLog.set([]);
    }

    roundLog.update((log) => {
        const updatedLog = [[mode, distance, location], ...log];
        if (updatedLog.length > 20) updatedLog.pop(); // Limit to 20 items
        localStorage.setItem("roundLog", JSON.stringify(updatedLog));
        return updatedLog;
    });
}
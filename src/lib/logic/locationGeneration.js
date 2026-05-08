import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import { get } from "svelte/store";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { savedMapBounds } from "$lib/stores/locationStore";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { changeMap } from "$lib/utils/changeMap";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";

// This is THE function to get locations (all others here are NOT export) - not the function to start a new round!
export async function getLocationCoordinates(type) {
    if (type == "MAP") return await getCoordsFromServer();
    else if (type == "MULTIPLAYER") return get(socket)?.storage?.location || [null, null, null];
    else if (type == "COMPETITION") return await getCompetitionCoordinates();
    else throw new Error("Incorrect location type set in locationGeneration.js!");
}

let loadedMap; // Exclusive to location generation, not a general variable!
let cachedLocations = [];

async function getCoordsFromServer() {
    const selectedMap = localStorage.getItem("selectedMap") || get(defaultMap);

    // Reset local cache if category was changed
    if (loadedMap !== selectedMap) {
        loadedMap = selectedMap;
        cachedLocations = [];
    }

    // If cache is empty, fetch 5 new locations
    if (cachedLocations.length === 0) {
        const response = await fetch(get(apiUrl) + "/locations", {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mapName: loadedMap
            })
        });

        if (response.ok) {
            const data = await response.json();
            savedMapBounds.set(data.bounds);
            cachedLocations = data.locations;
        } else {
            let errorMessage = response.status;
            try {
                const data = await response.json();
                if (data.error) errorMessage = data.error;
            } catch { }
            showConfirmPopup("Reset map?", "Your selected map was potentially removed or renamed.", () => {
                changeMap(get(defaultMap), true);
            });
            throw new Error(errorMessage);
        }
    }

    // Return and remove one location from cache
    if (cachedLocations.length > 0) {
        return cachedLocations.shift(); // [lat: number, lon: number, additionalData?: object]
    } else {
        throw new Error("No locations available in cache!");
    }
}

async function getCompetitionCoordinates() {
    return get(competitionData)?.locations[get(competitionRound)] ?? [];
}
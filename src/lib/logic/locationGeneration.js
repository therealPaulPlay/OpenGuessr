import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import { get } from "svelte/store";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { showNotification } from "$lib/utils/notifications";
import { savedMapBounds } from "$lib/stores/locationStore";

// This is THE function to get locations (all others here are NOT export) - not the function to start a new round!
export async function getLocationCoordinates(type) {
    if (type == "MAP") return await getCoordsFromServer();
    else if (type == "MULTIPLAYER") return get(socket)?.getStorage?.location;
    else if (type == "COMPETITION") return await getCompetitionCoordinates();
    else throw new Error("Incorrect location type set in locationGeneration.js!");
}

let loadedMapCategory; // Exclusive to location generation, not a general variable!
let cachedLocations = [];

async function getCoordsFromServer() {
    const selectedCategory = localStorage.getItem("selectedCategory") || "standard";

    // Reset local cache if category was changed
    if (loadedMapCategory !== selectedCategory) {
        loadedMapCategory = selectedCategory;
        cachedLocations = [];
    }

    // If cache is empty, fetch 5 new locations
    if (cachedLocations.length === 0) {
        const response = await fetch(get(accountUrl) + `/locations/${loadedMapCategory}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
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
            throw new Error(errorMessage);
        }
    }

    // Return and remove one location from cache
    if (cachedLocations.length > 0) {
        const location = cachedLocations.shift();
        const resultLat = location[0];
        const resultLon = location[1];
        const additionalProperty = location[2] ?? null;
        return [resultLat, resultLon, additionalProperty];
    } else {
        throw new Error("No locations available in cache!");
    }
}

async function getCompetitionCoordinates() {
    const resultLat = get(competitionData)?.locations[get(competitionRound)][0];
    const resultLon = get(competitionData)?.locations[get(competitionRound)][1];
    const resultLocationsArray = [resultLat, resultLon];
    return resultLocationsArray || [];
}
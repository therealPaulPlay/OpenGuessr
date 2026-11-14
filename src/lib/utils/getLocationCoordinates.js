import { competitionData, competitionRound } from "$lib/stores/context-specific/competitionStore";
import { get } from "svelte/store";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { defaultBounds, mapBounds } from "$lib/stores/locationStore";
import { showConfirmPopup, showErrorPopup } from "openguessr-ui";
import { changeMap } from "$lib/utils/changeMapUtils";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";

// This is THE function to get locations
// All coordinate providers must also set bounds
export async function getLocationCoordinates(type) {
    if (type == "SINGLEPLAYER") return await getCoordinatesFromServer();
    else if (type == "MULTIPLAYER") return getMultiplayerCoordinates();
    else if (type == "COMPETITION") return await getCompetitionCoordinates();
    else throw new Error("Incorrect location type passed to getLocationCoordinates() in getLocationCoordinates.js!");
}

// For singleplayer (from-server) generation
let loadedMap;
let cachedLocations = [];
let cachedBounds;

async function getCoordinatesFromServer() {
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
            cachedBounds = data.bounds;
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
        if (!cachedBounds) showErrorPopup("Singleplayer bounds error", "No singleplayer map bounds provided!", "No map bounds.");
        mapBounds.set(cachedBounds || get(defaultBounds)); // SET BOUNDS --------------------<<
        return cachedLocations.shift(); // [lat: number, lon: number, additionalData?: object]
    } else {
        throw new Error("No locations available in cache!");
    }
}

function getMultiplayerCoordinates() {
    if (!get(socket)?.storage?.mapBounds) showErrorPopup("Multiplayer bounds error", "No multiplayer map bounds provided!", "No map bounds.");
    mapBounds.set(get(socket)?.storage?.mapBounds || get(defaultBounds)); // SET BOUNDS ------------------------<<
    return get(socket)?.storage?.location || [null, null, null];
}

async function getCompetitionCoordinates() {
    mapBounds.set(get(defaultBounds)); // SET BOUNDS ----------------<<
    return get(competitionData)?.locations[get(competitionRound)] ?? [];
}
// This allows all maps to only show the area on the minimap that is really needed & to adjust the score calculation to the map size
import { savedMapBounds } from "$lib/stores/locationStore";
import { get } from "svelte/store";
import { competition, multiplayer } from "$lib/stores/modeStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { errorPopup } from "./errorHandling";

export function getMapBounds() {
    if (get(multiplayer)) {
        if (get(socket)?.getStorage?.mapBounds) return get(socket)?.getStorage?.mapBounds;
        else if (get(socket)?.getStorage?.gameStarted) errorPopup("Bounds error", "No multiplayer map bounds provided!", "No bounds.");
    }

    // If in a competition, set the map to the default
    if (get(competition)) return { zoom: 2, lat: 0, lng: 0, diameter: 360 };

    return get(savedMapBounds);
}
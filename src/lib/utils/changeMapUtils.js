import { goto } from "$app/navigation";
import { get } from "svelte/store";
import { browser } from "$app/environment";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { navigationMenu } from "$lib/stores/uiStore";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";

export async function changeMap(mapName, regenerate = false, goBackAfterNav = false) {
    localStorage.setItem("selectedMap", mapName);
    if (regenerate) await checkGenerationTypeAndGenerate();
    if (goBackAfterNav) goto("/multiplayer/host");
}

export function selectMap(name, { community = false, returnToMultiplayer = false } = {}) {
    const newMap = (community ? "community_" : "") + name;
    const currentMap = localStorage.getItem("selectedMap") ?? get(defaultMap); // No map stored means default is selected

    // Only regenerate if the new map differs from the current selection
    changeMap(newMap, currentMap !== newMap, returnToMultiplayer);
    if (returnToMultiplayer) return;

    navigationMenu.set(false);
    goto("/");
}

export function isMapSelected(name, community = false) {
    if (!browser) return false;

    const selectedMap = localStorage.getItem("selectedMap");
    if (community) name = "community_" + name;
    return selectedMap === name || (name === get(defaultMap) && !selectedMap);
}

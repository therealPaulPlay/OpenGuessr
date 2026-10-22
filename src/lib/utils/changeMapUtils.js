import { goto } from "$app/navigation";
import { get } from "svelte/store";
import { browser } from "$app/environment";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { mainMenu } from "$lib/stores/uiStore";
import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
import { tutorialStep } from "$lib/stores/context-specific/tutorialStore";
import { markTutorialCompleted } from "$lib/components/Tutorial.svelte";
import { multiplayerMap } from "$lib/stores/context-specific/multiplayerStore";

export async function changeMap(mapName, regenerate = false) {
    localStorage.setItem("selectedMap", mapName);
    if (regenerate) await checkGenerationTypeAndGenerate();
}

export function selectMap(name, { community = false, forMultiplayer = false, neverRegenerate = false } = {}) {
    const newMap = (community ? "community_" : "") + name;

    if (forMultiplayer) {
        multiplayerMap.set(newMap);
        goto("/multiplayer/host");
        return;
    }

    const currentMap = localStorage.getItem("selectedMap") ?? get(defaultMap); // No map stored means default is selected

    // Only regenerate if the new map differs from the current selection
    changeMap(newMap, !neverRegenerate && currentMap !== newMap);

    // Mark tutorial as completed (map was selected via e.g. straight visit to /maps, let player play the map instead of tutorial)
    if (get(tutorialStep) > 0) markTutorialCompleted();

    // Close main menu and bring to homepage
    mainMenu.set(false);
    goto("/");
}

export function isMapSelected(name, community = false, forMultiplayer = false) {
    if (!browser) return false;

    const selectedMap = forMultiplayer ? get(multiplayerMap) : localStorage.getItem("selectedMap");
    if (community) name = "community_" + name;
    return selectedMap === name || (name === get(defaultMap) && !selectedMap);
}

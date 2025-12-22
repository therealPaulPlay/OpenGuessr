import { fullscreenNavigation } from "$lib/stores/uiStore";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { get } from "svelte/store";

export async function changeMap(category, regenerate = false) {
    localStorage.setItem("selectedMap", category);
    if (regenerate) {
        fullscreenNavigation.set(false);
        await checkGenerationTypeAndGenerate();
    }
}
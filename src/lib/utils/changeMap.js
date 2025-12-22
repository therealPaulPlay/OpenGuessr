import { navigationMenu } from "$lib/stores/uiStore";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { get } from "svelte/store";

export async function changeMap(category, regenerate = false) {
    localStorage.setItem("selectedMap", category);
    if (regenerate) {
        navigationMenu.set(false);
        await checkGenerationTypeAndGenerate();
    }
}
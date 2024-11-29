import { resetMap } from "$lib/logic/miniMap";
import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { get } from "svelte/store";

export async function changeCategory(category, regenerate) {
    localStorage.setItem("selectedCategory", category);

    if (regenerate) {
        await checkGenerationTypeAndGenerate();

        if (!get(resultScreenEnabled)) {
            resetMap(); // Reset the map if mid game to clear (potential) markers
        }
    }
}
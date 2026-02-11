import { navigationMenu } from "$lib/stores/uiStore";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";

export async function changeMap(category, regenerate = false) {
    localStorage.setItem("selectedMap", category);
    if (regenerate) {
        navigationMenu.set(false);
        await checkGenerationTypeAndGenerate();
    }
}
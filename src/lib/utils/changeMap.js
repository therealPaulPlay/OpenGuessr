import { goto } from "$app/navigation";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";

export async function changeMap(category, regenerate = false, goBackAfterNav = false) {
    localStorage.setItem("selectedMap", category);
    if (regenerate) await checkGenerationTypeAndGenerate();
    if (goBackAfterNav) goto("/multiplayer/host");
}
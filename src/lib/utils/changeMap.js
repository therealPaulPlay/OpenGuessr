import { goto } from "$app/navigation";
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";

export async function changeMap(mapName, regenerate = false, goBackAfterNav = false) {
    localStorage.setItem("selectedMap", mapName);
    if (regenerate) await checkGenerationTypeAndGenerate();
    if (goBackAfterNav) goto("/multiplayer/host");
}
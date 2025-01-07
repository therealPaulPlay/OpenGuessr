import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { get } from "svelte/store";

export async function changeCategory(category, regenerate) {
    localStorage.setItem("selectedCategory", category);
    if (regenerate) await checkGenerationTypeAndGenerate();
}
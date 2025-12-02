import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { get } from "svelte/store";

export async function changeCategory(category, regenerate = false) {
    localStorage.setItem("selectedCategory", category);
    if (regenerate) await checkGenerationTypeAndGenerate();
}
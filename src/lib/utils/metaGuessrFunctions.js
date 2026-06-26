import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
import { metaGuessr } from "$lib/stores/modeStore";
import { get } from "svelte/store";
import { showResultScreenSlideup } from "./resultScreenSlideup";

let text = "No meta.";
let imageUrl = null;
let note = null;

export function setMetaGuessrMeta(meta = {}) {
    text = meta.text || "No meta.";
    imageUrl = meta.imageUrl ?? null;
    note = meta.note ?? null;
}

resultScreenEnabled.subscribe((value) => {
    if (value && get(metaGuessr)) showResultScreenSlideup("Meta", text, undefined, undefined, imageUrl, note);
});
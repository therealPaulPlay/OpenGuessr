
import { showSlideup, slideupButtonText, slideupCallback, slideupText, slideupTitle } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";

export function showResultScreenSlideup(title = "", text = "", buttonText = "Default", execFunction = null) {
	if (get(showSlideup)) return console.warn("Slideup is already open!");
	slideupTitle.set(title);
	slideupText.set(text);
	slideupButtonText.set(buttonText);
	slideupCallback.set(execFunction);
	showSlideup.set(true);
}
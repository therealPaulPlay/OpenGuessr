
import { errorPopup } from "$lib/utils/errorHandling";
import { showSlideup, slideupButtonText, slideupCallback, slideupText, slideupTitle } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";

export function showResultScreenSlideup(title = "", text = "", buttonText = "Default", execFunction = null) {
	slideupTitle.set(title);
	slideupText.set(text);
	slideupButtonText.set(buttonText);
	slideupCallback.set(execFunction);
	showSlideup.set(true);
}

import { showSlideup, slideupButtonText, slideupCallback, slideupText, slideupTitle } from "$lib/stores/context-specific/resultScreenSlideupStore";

export function showResultScreenSlideup(title = "", text = "", buttonText = "Default", execFunction = null) {
	slideupTitle.set(title);
	slideupText.set(text);
	slideupButtonText.set(buttonText);
	slideupCallback.set(execFunction);
	showSlideup.set(true);
}
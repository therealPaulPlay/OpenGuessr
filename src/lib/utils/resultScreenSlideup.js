
import { closeCallback, showSlideup, slideupButtonText, slideupCallback, slideupContent, slideupImageUrl, slideupNote, slideupText, slideupTitle } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";

export function showResultScreenSlideup(title = "", text = "", buttonText = "Default", execFunction = null, imageUrl = null, note = null, textContent = null, notInterestedFunction = null) {
	if (get(showSlideup)) return; // Slideup already open, skip
	slideupTitle.set(title);
	slideupText.set(text);
	slideupButtonText.set(buttonText);
	slideupCallback.set(execFunction);
	slideupImageUrl.set(imageUrl);
	slideupNote.set(note);
	slideupContent.set(textContent);
	closeCallback.set(notInterestedFunction);

	// Show it
	showSlideup.set(true);
}
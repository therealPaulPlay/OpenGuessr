// Display custom error messages
import { hideDisableOption, hideErrors, title, description, errorCode, popupOpen, closeButtonText, reload } from "$lib/stores/context-specific/errorPopupStore";
import { get } from "svelte/store"; // Get values from svelte stores using this

export function errorPopup(popupTitle, popupDescription, popupErrorCode, reloadPopup, hideDontShowAgainOption) {
  hideDisableOption.set(hideDontShowAgainOption || false);

  if (!get(hideErrors) || reloadPopup) { // if errors should be shown or it is a critical error that needs a reload, show the popup
    title.set(popupTitle)
    description.set(popupDescription);
   
    errorCode.set(popupErrorCode || "");

    closeButtonText.set(reloadPopup ? "Reload" : "Close");
    reload.set(reloadPopup || false);

    popupOpen.set(true);
  }
}

// Usage:
// errorPopup("Streetview link is invalid","Link: https://errorsareawesome.saidnooneever.ml", "Code 7: Link not found", false);

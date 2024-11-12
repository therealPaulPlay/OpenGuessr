// Display custom error messages
import { hideDisableOption, showErrors, title, description, errorCode, popupOpen, closeButtonText, reload } from "$lib/stores/errorPopupData";
import { get } from "svelte/store"; // Get values from svelte stores using this

export function errorPopup(popupTitle, popupDescription, popupErrorCode, reloadPopup, hideDontShowAgainOption) {
  hideDisableOption.set(hideDontShowAgainOption || false);

  if (get(showErrors) || reload) { // if errors should be shown or it is a critical error that needs a reload, show the popup
    title.set(popupTitle)
    description.set(popupDescription);
   
    errorCode.set(popupErrorCode || "");

    popupOpen.set(true);

    closeButtonText.set(reloadPopup ? "Reload" : "Close");
    reload.set(reloadPopup || false);
  }
}

// Usage:
// errorPopup("Streetview link is invalid","Link: https://errorsareawesome.saidnooneever.ml", "Testerror description", false);

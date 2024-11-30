import { confirmPopupVisible, confirmTitle, confirmDescription, confirmUsernameInput, confirmPasswordInput, confirmConfirmColor, confirmConfirmText, confirmShowConfirm, confirmExecuteFunction, confirmUsernameValue, confirmPasswordValue } from "$lib/stores/context-specific/confirmPopupStore";

export function showConfirmPopup(title, text, executeFunction, accountDelete, nameChange, messageOnly, confirmText, confirmColor) {

    confirmTitle.set(title);
    confirmDescription.set(text);
    confirmPasswordInput.set(Boolean(accountDelete));
    confirmUsernameInput.set(Boolean(nameChange));
    confirmConfirmText.set(confirmText || "Confirm");
    confirmConfirmColor.set(confirmColor || "");
    confirmExecuteFunction.set(executeFunction);
    
    // Reset input fields
    confirmUsernameValue.set("");
    confirmPasswordValue.set("");

    // Hide "Confirm" button if message only param is true
    confirmShowConfirm.set(!Boolean(messageOnly));

    confirmPopupVisible.set(true); // Show the popup
}
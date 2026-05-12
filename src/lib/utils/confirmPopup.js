import { confirmPopupVisible, confirmTitle, confirmDescription, confirmUsernameInput, confirmPasswordInput, confirmConfirmText, confirmExecuteFunction, confirmUsernameValue, confirmPasswordValue } from "$lib/stores/context-specific/confirmPopupStore";

export function showConfirmPopup(title, text, executeFunction, accountDelete, nameChange, confirmText) {
    confirmTitle.set(title);
    confirmDescription.set(text);
    confirmPasswordInput.set(Boolean(accountDelete));
    confirmUsernameInput.set(Boolean(nameChange));
    confirmConfirmText.set(confirmText || "Confirm");
    confirmExecuteFunction.set(executeFunction);

    // Reset input fields
    confirmUsernameValue.set("");
    confirmPasswordValue.set("");

    confirmPopupVisible.set(true); // Show the popup
}
import { confirmTitle, confirmDescription, confirmUsernameInput, confirmPasswordInput, confirmConfirmColor, confirmConfirmText, confirmShowConfirm, confirmExecuteFunction } from "$lib/stores/context-specific/confirmPopupStore";

export function showConfirmPopup(title, text, executeFunction, accountDelete, nameChange, messageOnly, confirmText, confirmColor) {

    confirmTitle.set(title);
    confirmDescription.set(text);
    confirmPasswordInput.set(Boolean(accountDelete));
    confirmUsernameInput.set(Boolean(nameChange));
    confirmConfirmText.set(confirmText || "Confirm");
    confirmConfirmColor.set(confirmColor || "");
    confirmExecuteFunction.set(executeFunction);

    if (accountDelete) {
        document.getElementById("accountDeletePassword").value = "";
    }

    if (nameChange) {
        document.getElementById("usernameInput").value = "";
    }

    confirmShowConfirm.set(!Boolean(messageOnly));
}
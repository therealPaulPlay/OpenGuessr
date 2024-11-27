import { notificationMarginTop, notificationOpacity, notificationText, acceptText, showAcceptButton, acceptFunction, dismissFunction } from "$lib/stores/context-specific/notificationStore";
import { get } from "svelte/store";

let hideNotificationTimeout;

export async function showNotification(text, acceptFunctionParam, dismissFunctionParam, showAccept, renameAcceptToLearnMore) {
    clearTimeout(hideNotificationTimeout);

    // If a notification is already shown, animate that away
    if (get(notificationOpacity) == "1") {
        hideNotification();

        await new Promise(resolve => setTimeout(resolve, 250));
    };

    notificationMarginTop.set("15px");
    notificationOpacity.set(1);

    notificationText.set(text);
    acceptText.set("Accept");

    if (showAccept) {
        showAcceptButton.set(true);
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 30000); // Much longer expiration time for notifications that ask for user action
    } else {
        showAcceptButton.set(false);
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 3000);
    }

    if (renameAcceptToLearnMore) {
        acceptText.set("?");
        clearTimeout(hideNotificationTimeout);
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 5000); // Shorter expiration for informational notifications
    }

    acceptFunction.set(acceptFunctionParam);
    dismissFunction.set(dismissFunctionParam);
}

export function hideNotification() {
    notificationMarginTop.set(0);
    notificationOpacity.set(0);
}
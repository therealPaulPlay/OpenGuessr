import { notificationVisible, notificationText, acceptText, acceptFunction, dismissFunction, clickableText, textClickFunction } from "$lib/stores/context-specific/notificationStore";
import { get } from "svelte/store";

let hideNotificationTimeout;

export async function showNotification(text, acceptFunctionParam, dismissFunctionParam, renameAcceptToView, clickableTextParam, textClickFunctionParam) {
    clearTimeout(hideNotificationTimeout);

    // If a notification is already shown, animate that away
    if (get(notificationVisible)) {
        hideNotification();

        await new Promise(resolve => setTimeout(resolve, 250));
    };

    // Show visible
    notificationVisible.set(true);

    // Set notification and button text
    notificationText.set(text);
    acceptText.set("Accept");

    // Clickable text inside notification, e.g. for profiles
    clickableText.set(clickableTextParam);
    textClickFunction.set(textClickFunctionParam);

    if (acceptFunctionParam) {
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 15000); // Much longer expiration time for notifications that ask for user action
    } else {
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 3000);
    }

    if (renameAcceptToView) {
        acceptText.set("View");
        clearTimeout(hideNotificationTimeout);
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 5000); // Shorter expiration for informational notifications
    }

    // Set functions
    acceptFunction.set(acceptFunctionParam);
    dismissFunction.set(dismissFunctionParam);
}

export function hideNotification() {
    notificationVisible.set(false);
}
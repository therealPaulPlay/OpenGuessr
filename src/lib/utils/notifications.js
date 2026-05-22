import { notificationVisible, notificationText, viewOnly, acceptFunction, dismissFunction, clickableText, textClickFunction } from "$lib/stores/context-specific/notificationStore";
import { get } from "svelte/store";

let hideNotificationTimeout;

export async function showNotification(text, acceptAction, dismissAction, viewOnlyParam, clickableTextParam, textClickFunctionParam) {
    clearTimeout(hideNotificationTimeout);

    // If a notification is already shown, animate that away
    if (get(notificationVisible)) {
        hideNotification();

        await new Promise(resolve => setTimeout(resolve, 250));
    };

    // Show visible
    notificationVisible.set(true);

    // Set notification state
    notificationText.set(text);
    viewOnly.set(viewOnlyParam);

    // Clickable text inside notification, e.g. for profiles
    clickableText.set(clickableTextParam);
    textClickFunction.set(textClickFunctionParam);

    if (viewOnlyParam) {
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 5000); // Shorter expiration for informational notifications
    } else if (acceptAction) {
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 15000); // Much longer expiration time for notifications that ask for user action
    } else {
        hideNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, 3000);
    }

    // Set functions
    acceptFunction.set(acceptAction);
    dismissFunction.set(dismissAction);
}

export function hideNotification() {
    notificationVisible.set(false);
}
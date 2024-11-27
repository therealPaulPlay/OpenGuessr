import { notificationElement, notificationText, acceptText, showAcceptButton, acceptFunction, dismissFunction } from "$lib/stores/context-specific/notificationStore";
import { get } from "svelte/store";

let hideNotificationTimeout;
let visibilityTimeout;

export async function showNotification(text, acceptFunctionParam, dismissFunctionParam, showAccept, renameAcceptToLearnMore) {
    clearTimeout(hideNotificationTimeout);
    clearTimeout(visibilityTimeout);

    // If a notification is already shown, animate that away
    if (get(notificationElement).style.opacity == "1" && get(notificationElement).style.visibility == "visible") {
        hideNotification();

        await new Promise(resolve => setTimeout(resolve, 250));
    };

    get(notificationElement).style.marginTop = "15px";
    get(notificationElement).style.visibility = "visible";
    get(notificationElement).style.opacity = "1";

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
    get(notificationElement).style.marginTop = "0";
    get(notificationElement).style.opacity = "0";
    clearTimeout(visibilityTimeout);

    visibilityTimeout = setTimeout(() => {
        get(notificationElement).style.visibility = "hidden";
    }, 200);
}
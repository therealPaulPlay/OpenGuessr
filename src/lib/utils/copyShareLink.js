import { showNotification } from "openguessr-ui";

export function copyShareLink(link) {
    const share = window.Capacitor?.Plugins?.Share;
    if (share) return share.share({ url: link }).catch(() => {});

    navigator.clipboard
        .writeText(link)
        .then(() => showNotification("Copied!"))
        .catch((error) => showNotification("Error: " + error));
}

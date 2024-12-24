import { chatHTML, savedGuestName } from "$lib/stores/context-specific/multiplayerStore";
import { distributeChat } from "$lib/logic/multiplayerLogic";
import { username } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { filterProfanity } from "$lib/utils/profanityCheck";

export function manuallySendChat(text) {
    if (text) {
        if (get(username) != null) {
            distributeChat(get(username) + ": " + text);
        } else {
            distributeChat(get(savedGuestName) + ": " + text);
        }
    }
}

export function resetChat() {
    chatHTML.set("");
}

// Add chat and check for profanity
export async function addToChat(text) {
    text = await filterProfanity(text);
    addTextToChat(text);
}

function addTextToChat(text) {
    const sanitizedText = sanitizeHTML(text); // Call a function to sanitize HTML
    chatHTML.set(get(chatHTML) + "<br>");

    if (sanitizedText.startsWith("System:")) {
        chatHTML.set(get(chatHTML) + `<span style="opacity: 0.75">${sanitizedText}</span>`);
    } else {
        chatHTML.set(get(chatHTML) + sanitizedText);
    }
}

function sanitizeHTML(text) {
    return text.replace(/<[^>]*>?/gm, ''); // Strip it of any malicious html (security)
}
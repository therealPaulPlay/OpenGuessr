import { chatHTML, peer, savedGuestName } from "$lib/stores/context-specific/multiplayerStore";
import { username } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { filterProfanity } from "$lib/utils/profanityCheck";

export function manuallySendChat(text) {
    if (!text) return;
    get(peer)?.updateStorage("chats", [...(get(peer)?.getStorage?.chats || []), get(username) || get(savedGuestName) + ": " + text]);
}

export function resetChat() {
    chatHTML.set("");
    previousChats = [];
}

let previousChats = [];

export function loadChat(chats) {
    if (previousChats == chats) return;
    previousChats = chats;
    try {
        chats.forEach(chat => {
            addToChat(chat);
        });
    } catch (error) {
        console.error("Error loading chat:", error);
    }
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
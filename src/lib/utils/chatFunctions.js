import { chatArray, socket, savedGuestName } from "$lib/stores/context-specific/multiplayerStore";
import { username } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { filterProfanity } from "$lib/utils/profanityCheck";

export function manuallySendChat(text) {
    if (!text) return;
    get(socket)?.updateStorageArray("chats", "add", (get(username) || get(savedGuestName)) + ": " + text);
}

export async function loadChat(chats) {
    const tempArray = [];
    try {
        for (const chat of chats) {
            const text = await filterProfanity(chat);
            const sanitizedText = sanitizeHTML(text);
            tempArray.push(sanitizedText);
        }
        chatArray.set(tempArray);
    } catch (error) {
        console.error("Error loading chat:", error);
    }
}

function sanitizeHTML(text) {
    return text.replace(/<[^>]*>?/gm, ""); // Strip malicious HTML (security)
}
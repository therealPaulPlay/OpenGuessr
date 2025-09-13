import { chatArray, socket, guestName } from "$lib/stores/context-specific/multiplayerStore";
import { username } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { censor } from "fast-profanity-filter";

export function manuallySendChat(text) {
    if (!text) return;
    get(socket)?.updateStorage("chats", "array-add", (get(username) || get(guestName)) + ": " + text);
}

export function loadChat(chats) {
    const tempArray = [];
    try {
        for (const chat of chats) {
            const text = censor(chat);
            tempArray.push(text);
        }
        chatArray.set(tempArray);
    } catch (error) {
        console.error("Error loading chat:", error);
    }
}
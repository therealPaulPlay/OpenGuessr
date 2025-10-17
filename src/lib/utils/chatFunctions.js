import { chatArray, socket, guestName } from "$lib/stores/context-specific/multiplayerStore";
import { username } from "$lib/stores/accountStore";
import { get } from "svelte/store";
import { censor } from "fast-profanity-filter";

export function sendChat(text) {
    if (!text) return;
    get(socket)?.updateStorage("chats", "array-add", { username: get(username) || get(guestName), clientId: get(socket)?.id, text });
}

export function loadAndProfanityCheckChat(chats) {
    const tempArray = [];
    try {
        for (const chat of chats) {
            chat.text = censor(chat.text);
            tempArray.push(chat);
        }
        chatArray.set(tempArray);
    } catch (error) {
        console.error("Error loading and censoring chats:", error);
    }
}
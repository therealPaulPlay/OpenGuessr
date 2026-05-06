import { writable } from "svelte/store";

export const friendRequestInboxContent = writable();
export const newFriendRequest = writable(false);
import { writable } from "svelte/store";

// Inbox
export const inboxContent = writable();
export const newFriendRequest = writable(false);

// Outbox
export const outboxContent = writable();

import { writable } from "svelte/store";
import { SvelteMap } from "svelte/reactivity";

export const hcClient = writable();

// Loaded lazily when first needed (popup open, notification etc.)
export const conversations = writable([]);
export const invites = writable([]);
export const participantActivities = writable([]);

// Currently open conversation in the popup
export const activeConversationId = writable(null);

export const aliasCache = new SvelteMap();
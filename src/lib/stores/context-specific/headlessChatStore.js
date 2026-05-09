import { writable, derived } from "svelte/store";
import { SvelteMap } from "svelte/reactivity";

export const hcClient = writable();

// Loaded lazily when first needed (popup open, notification etc.)
export const conversations = writable([]);
export const invites = writable([]);
export const participantActivities = writable([]);
export const initialDataLoaded = writable(false);

// Cold-start seed from getHasNew
export const coldStartHasNew = writable(null);

// Reactively derived from the per-domain stores once populated, falls back to the cold-start seed
export const hasNewMessageOrInvite = derived(
    [conversations, participantActivities, invites, initialDataLoaded, coldStartHasNew],
    ([convs, activities, invs, loaded, coldStart]) => {
        if (!loaded) return coldStart; // Exit if conversations, activities or invites aren't loaded yet
        const userId = localStorage.getItem("id");
        const newInvites = invs.some((i) => i.toParticipantId === userId && !i.seen);
        const newMessages = convs.some((c) => {
            const last = c.lastMessage;
            if (!last) return false;
            const activity = activities.find((a) => a.conversationId === c.conversationId);
            return !activity || new Date(last.createdAt) > new Date(activity.lastReadMessageCreatedAt);
        });
        return newMessages || newInvites;
    },
);

// Currently open conversation in the popup
export const activeConversationId = writable(null);

export const aliasCache = new SvelteMap();
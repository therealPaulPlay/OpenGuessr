import { Client } from "headless-chat/client";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import {
    hcClient,
    conversations,
    invites,
    participantActivities,
    activeConversationId,
    aliasCache,
    initialDataLoaded,
    coldStartHasNew,
} from "$lib/stores/context-specific/headlessChatStore";
import { messagesPopup } from "$lib/stores/uiStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { showNotification } from "$lib/utils/notifications";
import { showProfile } from "$lib/utils/showProfile";

async function dispatch(data) {
    await fetch(get(apiUrl) + "/headless-chat/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

const getAuthData = () => localStorage.getItem("bearer");

export async function initHeadlessChatClient() {
    const participantId = localStorage.getItem("id");
    if (!participantId) return console.warn("Tried to init headless chat client with invalid user ID!");

    try {
        // Only create instance if not already one created
        let client = get(hcClient);
        if (!client) {
            client = new Client(dispatch, participantId, getAuthData);
            hcClient.set(client);
        }

        // Subscribe to events that are always needed or cheap (should always happen, even if client is alr init)
        // Bundled into one envelope with onMany to avoid 3 round-trips via the separate onConversation etc.
        await client.onMany([
            { kind: "conversation", handlers: [handleConversationEvent] },
            { kind: "invite", handlers: [handleInviteEvent] },
            { kind: "participantActivity", handlers: [handleParticipantActivityEvent] },
        ]);
    } catch (error) {
        errorPopup("Headless-chat init failed", "Failed to initialize headless-chat and subscribe to events.", error.message);
    }
}

export function disposeHeadlessChatClient() {
    get(hcClient)?.dispose();
    hcClient.set(null);
    conversations.set([]);
    invites.set([]);
    participantActivities.set([]);
    activeConversationId.set(null);
    aliasCache.clear();
    notifiedMessageIds.clear();
    initialDataLoaded.set(false);
    coldStartHasNew.set(null);
}

let initialLoadPromise = null; // Avoid loading multiple times if load is already active

// Load initial data for conversations + invites + participant activity
export async function headlessChatInitialLoad() {
    if (get(initialDataLoaded)) return;
    if (initialLoadPromise) return initialLoadPromise;

    // Exit if not initialized / connected to SSE yet
    const client = get(hcClient);
    if (!client) return errorPopup("Failed to laod conversations", "Headless-chat client instance is not defined.");

    initialLoadPromise = (async () => {
        try {
            const [convs, acts, invs] = await Promise.all([
                client.getConversations(),
                client.getParticipantActivities(),
                client.getInvites(),
            ]);
            conversations.set(convs);
            participantActivities.set(acts);
            invites.set(invs);
            // Set only after populating conversations + activities + invites
            initialDataLoaded.set(true);
        } catch (error) {
            errorPopup(
                "Failed to load messages",
                "An error occured trying to load conversations, participant activities and invites.",
                error.message,
            );
        } finally {
            initialLoadPromise = null;
        }
    })();

    return initialLoadPromise;
}

// FIFO of recently notified message ids so reaction/edit re-emits don't re-trigger the notification
const notifiedMessageIds = new Map();

async function handleConversationEvent({ conversationId, data }) {
    // If the update is null, remove the conversation (means the convo was deleted)
    if (data == null) {
        conversations.update((list) => list.filter((c) => c.conversationId !== conversationId));
        if (get(activeConversationId) === conversationId) activeConversationId.set(null); // Clear active conversation if it was deleted
        return;
    }

    conversations.update((list) => {
        const without = list.filter((c) => c.conversationId !== conversationId);
        const next = [data, ...without];
        next.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
        return next;
    });

    const last = data.lastMessage;
    if (!last || last.deleted || last.systemEvent) return;

    // Don't notify for own messages, while the popup is open, or for messages we've already notified about
    if (last.participantId === localStorage.getItem("id") || get(messagesPopup)) return;
    if (notifiedMessageIds.has(last.messageId)) return;
    notifiedMessageIds.set(last.messageId, true);
    if (notifiedMessageIds.size > 200) notifiedMessageIds.delete(notifiedMessageIds.keys().next().value);

    const author = await getAliasCached(last.participantId);
    const preview = last.message.length > 10 ? last.message.slice(0, 10) + "…" : last.message;
    showNotification(
        `Message "${preview}" from %s.`,
        () => {
            activeConversationId.set(conversationId);
            messagesPopup.set(true);
        },
        null,
        true,
        author,
        () => showProfile(last.participantId),
    );
}

async function handleInviteEvent({ conversationId, toParticipantId, data }) {
    // Null means the invite was deleted, remove it
    if (data == null) {
        invites.update((list) =>
            list.filter(
                (i) => !(i.conversation.conversationId === conversationId && i.toParticipantId === toParticipantId),
            ),
        );
        return;
    }

    // New invite, add it
    invites.update((list) => [data, ...list]);

    // Exit if the invite that was created is outgoing (this user created it), only notify if it's an incoming invite
    const userId = localStorage.getItem("id");
    if (data.fromParticipantId === userId) return;

    // Notify user about incoming invite
    const fromAlias = await getAliasCached(data.fromParticipantId);
    showNotification(
        "Conversation invite from %s.",
        async () => {
            try {
                await get(hcClient).acceptInvite(data.conversation.conversationId);
                activeConversationId.set(data.conversation.conversationId);
                messagesPopup.set(true);
            } catch (error) {
                errorPopup("Failed to accept invite", "An error occured trying to accept an invite.", error.message);
            }
        },
        async () => {
            try {
                await get(hcClient).declineInvite(data.conversation.conversationId);
            } catch (error) {
                errorPopup("Failed to decline invite", "An error occured trying to decline a conversation invite.", error.message);
            }
        },
        false,
        fromAlias,
        () => showProfile(data.fromParticipantId),
    );
}

function handleParticipantActivityEvent({ conversationId, data }) {
    // Null means the activity row was deleted (conversation gone or participant removed)
    if (data == null) {
        participantActivities.update((list) => list.filter((a) => a.conversationId !== conversationId));
        return;
    }

    // Update the activity
    participantActivities.update((list) => {
        const idx = list.findIndex(
            (a) => a.conversationId === data.conversationId && a.participantId === data.participantId,
        );
        return idx === -1 ? [...list, data] : list.with(idx, data);
    });
}

const aliasLoadPromises = new Map(); // Avoid loading the same alias multiple times if a load is already active

// Batch-load aliases into the cache for a set of participant IDs, skipping any already cached or currently in-flight
export async function loadAliases(participantIds) {
    const toFetch = participantIds.filter((id) => !aliasCache.has(id) && !aliasLoadPromises.has(id));
    if (!toFetch.length) return;

    const promise = (async () => {
        try {
            const aliases = await get(hcClient).getAliases(toFetch);
            for (const id of toFetch) {
                const found = aliases?.find((a) => a.participantId === id);
                aliasCache.set(id, found?.alias || "Unknown");
            }
        } catch (error) {
            console.error("Error fetching aliases:", error);
            for (const id of toFetch) aliasCache.set(id, "Unknown");
        } finally {
            for (const id of toFetch) aliasLoadPromises.delete(id);
        }
    })();
    for (const id of toFetch) aliasLoadPromises.set(id, promise);
    await promise;
}

export async function getAliasCached(participantId) {
    if (participantId === "server") return "System";
    if (aliasCache.has(participantId)) return aliasCache.get(participantId);
    await (aliasLoadPromises.get(participantId) ?? loadAliases([participantId]));
    return aliasCache.get(participantId) ?? "Unknown";
}

// Open a conversation with this participant
// Friends auto-accept server-side, non-friends get an invite they need to accept before seeing the message
export async function openDirectMessageWith(participantId) {
    try {
        const response = await fetch(get(apiUrl) + "/headless-chat/conversation-with-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("bearer"),
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                targetParticipantId: participantId,
            }),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || response.status);
        }
        const { conversationId } = await response.json();
        activeConversationId.set(conversationId);
        messagesPopup.set(true);
    } catch (error) {
        errorPopup(
            "Failed to start conversation",
            "An error occured trying to open a conversation with this user.",
            error.message,
        );
    }
}
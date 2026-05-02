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
} from "$lib/stores/context-specific/headlessChatStore";
import { messagesPopup } from "$lib/stores/uiStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { showNotification } from "$lib/utils/notifications";
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { showProfile } from "$lib/utils/showProfile";

async function dispatch(data) {
    try {
        await fetch(get(apiUrl) + "/headless-chat/receive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    } catch (error) {
        errorPopup(
            "Failed to send headless-chat request",
            "An error occured trying to communicate with the headless-chat server.",
            error.message,
        );
    }
}

const getAuthData = () => localStorage.getItem("bearer");

let conversationsLoaded = false;

export async function initHeadlessChatClientIfNotAlready() {
    const participantId = localStorage.getItem("id");
    if (!participantId) return console.warn("Tried to init headless chat client with invalid user ID!");

    let client = get(hcClient);
    if (!client) {
        client = new Client(dispatch, participantId, getAuthData);
        hcClient.set(client);
    }

    // Subscribe to events that are always subscribed (cheap)
    await client.onConversation(handleConversationEvent);
    await client.onInvite(handleInviteEvent);
}

export function disposeHeadlessChatClient() {
    get(hcClient)?.dispose();
    hcClient.set(undefined);
    conversations.set([]);
    invites.set([]);
    participantActivities.set([]);
    activeConversationId.set(null);
    aliasCache.clear();
    conversationsLoaded = false;
}

let convsInvitesLoadPromise = null; // Avoid loading multiple times if load is already active

export async function loadConversationsAndInvites() {
    if (conversationsLoaded) return;
    if (convsInvitesLoadPromise) return convsInvitesLoadPromise;

    // Exit if not initialized / connected to SSE yet
    const client = get(hcClient);
    if (!client) return errorPopup("Failed to laod conversations", "Headless-chat client is not yet initialized.");

    const userId = localStorage.getItem("id");

    convsInvitesLoadPromise = (async () => {
        try {
            const [convs, acts, invs] = await Promise.all([
                client.getConversations(userId),
                client.getParticipantActivities(),
                client.getInvites(userId),
            ]);
            conversations.set(convs);
            participantActivities.set(acts);
            invites.set(invs);
            conversationsLoaded = true;
        } catch (error) {
            errorPopup(
                "Failed to load messages",
                "An error occured trying to load conversations and invites.",
                error.message,
            );
        } finally {
            convsInvitesLoadPromise = null;
        }
    })();

    return convsInvitesLoadPromise;
}

async function handleConversationEvent({ conversationId, data }) {
    // If the update is null, remove the conversations (means the convo was deleted)
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

    // Don't notify for the current user's own messages or while the popup is open
    if (last.participantId === localStorage.getItem("id") || get(messagesPopup)) return;

    const author = await getAliasCached(last.participantId);
    const preview = last.message.length > 10 ? last.message.slice(0, 10) + "…" : last.message;
    showNotification(
        `Message "${preview}" from %s`,
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
    if (data.fromParticipantId !== userId) return;

    // Notify user about incoming invite
    const fromAlias = await getAliasCached(data.fromParticipantId);
    showNotification(
        "Conversation invite from %s",
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
                aliasCache.set(id, found?.alias || "Error");
            }
        } catch (error) {
            console.error("Error fetching aliases:", error);
            for (const id of toFetch) aliasCache.set(id, "Error");
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
    return aliasCache.get(participantId) ?? "Error";
}

// Open a conversation with this participant
// Friends auto-accept server-side, non-friends are warned with a confirm popup before the request
export async function openDirectMessageWith(participantId, isFriend) {
    const openConversation = async () => {
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
    };

    if (isFriend) await openConversation();
    else showConfirmPopup(
        "Start conversation?",
        "Since you are not friends, they need to accept your conversation invite before seeing your messages.",
        openConversation,
    );
}
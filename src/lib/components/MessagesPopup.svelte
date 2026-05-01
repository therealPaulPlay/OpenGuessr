<script module>
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

	let hcClient;

	// Helpers -----------------
	const getAuthToken = async () => localStorage.getItem("bearer");

	async function sendHeadlessChatRequest(data) {
		try {
			await fetch(get(apiUrl) + "/headless-chat/receive", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
		} catch (error) {
			errorPopup(
				"Error sending headless-chat request",
				"An error occured trying to communicate with the headless-chat server.",
				error.message,
			);
		}
	}

	// Client configuration --------------
	export function initHeadlessChatClientIfNotAlready() {
		if (!hcClient) hcClient = new Client(sendHeadlessChatRequest, localStorage.getItem("id"), getAuthToken);

		// Always keep conversations subscribed to be informed about new messages
		// Always re-subscribe since this is called on SSE disconnects
		hcClient.onConversation(async ({ conversationId, conversation }) => {
			conversations.map((c) => (c.conversationId === conversationId ? conversation : c));
			const newMessage = conversation.lastMessage || null;
			const newMessageAuthor = await getAliasCached(newMessage.participantId);

			showNotification(
				"New message from %s",
				() => {
					messagesPopup.set(true); // Open messages
					currentConversationId = conversationId; // Set conversation to the one the message is from
				},
				null,
				true,
				newMessageAuthor,
				() => {
					showProfile(newMessage.participantId);
				},
			);
		});
	}

	export function disposeHeadlessChatClient() {
		hcClient?.dispose();
		hcClient = null; // Garbage collect
	}
</script>

<script>
	import { messagesPopup } from "$lib/stores/uiStore";
	import { onMount } from "svelte";
	import Popup from "./ui/Popup.svelte";
	import { Client } from "headless-chat";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { get } from "svelte/store";
	import { showNotification } from "$lib/utils/notifications";
	import { SvelteMap } from "svelte/reactivity";
	import { showProfile } from "$lib/utils/showProfile";
	import MessageItem from "./MessageItem.svelte";

	const MESSAGES_FETCH_AMOUNT = 100;

	// Data
	let conversations = $state([]);
	let loadedMessages = $state([]);
	let aliasCache = new SvelteMap();

	// State values
	let isLoadingMessages = $state(false);
	let currentConversationId = $state();

	onMount(async () => {
		conversations = await hcClient.getConversations();
	});

	// Fetch messages if conversation is open & none are loaded
	$effect(() => {
		if (!isLoadingMessages && !loadedMessages.length && currentConversationId) {
			isLoadingMessages = true;
			hcClient.getMessages(currentConversationId, null, false, MESSAGES_FETCH_AMOUNT);
			isLoadingMessages = false;
		}
	});

	// Get the alias for a given participant ID, return from cache if available
	async function getAliasCached(participantId) {
		if (aliasCache.get(participantId)) return aliasCache.get(participantId);
		let alias;
		try {
			[{ alias }] = await hcClient.getAliases([participantId]);
			aliasCache.set(participantId, alias); // Cache
		} catch (error) {
			console.error("Error fetching alias:", error);
			alias = "Error";
		}
		return alias;
	}
</script>

<Popup z={971} slim={true} bind:open={$messagesPopup}>
	<div class="popup-title">
		<h1>Messages</h1>
	</div>

	<div class="horizontal-flex">
		<div class="sidebar">
			{#if conversations.legnth}
				{#each conversations as c}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="conversation-item"
						role="button"
						tabindex="0"
						onclick={() => {
							if (currentConversationId === c.conversationId) return; // Already opened
							currentConversationId = c.conversationId;
							loadedMessages = []; // Clear
						}}
					>
						<!-- Display conversation name as "Alias, Alias and 3 more" and limit each Alias here to 10 char otherwise truncate -->
						<!-- also display the latest message truncated if available, otherwise show "No messages yet." -->
					</div>
				{/each}
			{:else}
				<p class="loading-text">Loading...</p>
			{/if}
		</div>
		<div class="messages-view">
			<!-- todo load more messages when scrolling up -->
			{#if loadedMessages.length}
				{#each loadedMessages as message}
					<MessageItem {message} />
				{/each}
			{:else if isLoadingMessages}
				<p class="loading-text">Loading...</p>
			{:else}
				<p class="loading-text">No messages to display.</p>
			{/if}
		</div>
	</div>
</Popup>

<style>
	.horizontal-flex {
		display: flex;
		justify-content: center;
		gap: var(--layout-margin);
	}

	.loading-text {
		opacity: 0.5;
		margin: auto;
		text-align: center;
	}

	.conversation-item {
		width: 100%;
		padding: var(--box-margin);
	}

	.sidebar {
		width: fit-content;
		display: flex;
		flex-direction: column;
		max-width: 150px;
	}

	.messages-view {
		display: flex;
		padding: var(--box-margin);
		gap: var(--box-margin);
		flex-direction: column;
		justify-content: center;
	}
</style>

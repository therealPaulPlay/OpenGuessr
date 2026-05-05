<script>
	import { onDestroy, tick } from "svelte";
	import { SvelteMap } from "svelte/reactivity";
	import { get } from "svelte/store";
	import { X, SendHorizonal } from "@lucide/svelte";
	import Popup from "./ui/Popup.svelte";
	import MessageItem from "./MessageItem.svelte";
	import MessagesSidebar from "./MessagesSidebar.svelte";
	import { messagesPopup } from "$lib/stores/uiStore";
	import { hcClient, activeConversationId, aliasCache } from "$lib/stores/context-specific/headlessChatStore";
	import { headlessChatInitialLoad, getAliasCached, loadAliases } from "$lib/logic/headlessChatLogic";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { tooltip } from "$lib/utils/tooltip";
	import { playSound } from "$lib/utils/soundManager";

	const PAGE_SIZE = 50;
	const INDICATOR_REFRESH_MS = 2000;
	const BOTTOM_SLACK_PX = 60; // Reserved space below the last message so new messages can appear and disappear smoothly

	let messages = $state([]);
	let remainingMore = $state(0);
	let isInitialMessagesLoad = $state(false);
	let isLoadingMore = $state(false);
	let indicators = $state([]);
	let replyTo = $state(null);
	let replyToAlias = $state("Unknown");
	let inputValue = $state("");

	let messagesContainer = $state();
	let messageHandler = null;
	let indicatorHandler = null;
	let lastIndicatorAt = 0;
	let openGeneration = 0; // Bumped per setActiveConversation call, lets stale runs bail before writing state
	let lastSyncedConversationId = null; // Last id setActiveConversation has synced to, prevents redundant resyncs

	// Cache for referenced (replied-to) messages that aren't loaded, value is Message | null (null = gone from server)
	let referenceCache = new SvelteMap();
	let referenceLoadIds = new Set(); // In-flight dedup for getMessage calls

	// Off all event handlers that are conversation specific on unmount
	onDestroy(offConvSpecificEvents);

	messagesPopup.subscribe((value) => {
		// Load conversations, activity and invites the first time the popup opens
		if (value) {
			headlessChatInitialLoad(); // Only runs once
		} else {
			activeConversationId.set(null);
			offConvSpecificEvents(); // Unmount conversation specific handlers on popup close
		}
	});

	// Watch the activeConversationId store so external triggers (notifications, profile DM button) sync the popup
	$effect(() => {
		const id = $activeConversationId;
		const popup = $messagesPopup;
		if (!popup) {
			lastSyncedConversationId = null; // Always re-sync on re-open of the popup
			return;
		}
		if (id === lastSyncedConversationId) return;
		lastSyncedConversationId = id;
		setActiveConversation(id);
	});

	async function setActiveConversation(id) {
		const sequence = ++openGeneration; // Bump so any prior in-flight openConversation selection sees itself as stale

		messages = [];
		remainingMore = 0;
		replyTo = null;
		indicators = [];
		referenceCache.clear();
		referenceLoadIds.clear();
		isInitialMessagesLoad = Boolean(id);

		await offConvSpecificEvents();
		if (id) await openConversation(id, sequence);
	}

	async function openConversation(conversationId, thisGen) {
		const client = get(hcClient);
		if (!client) return;
		const isStale = () => thisGen !== openGeneration; // Check if this load is from an old load generation

		try {
			messageHandler = (m) => mergeIncomingMessage(m);
			await client.onMessage(conversationId, messageHandler);

			indicatorHandler = (list) => {
				const userId = localStorage.getItem("id");
				indicators = list.filter((i) => i.participantId !== userId);
			};
			await client.onIndicators(conversationId, indicatorHandler);

			const result = await client.getMessages(conversationId, null, false, PAGE_SIZE);
			if (isStale()) return; // If no longer the lastest gen, exit

			messages = result.messages;
			remainingMore = result.remainingInDirection;
			await Promise.all([loadMissingAliases(messages), loadMissingReferences(messages)]);
		} catch (error) {
			if (!isStale()) {
				errorPopup(
					"Failed to load messages",
					"An error occured trying to load messages for this conversation.",
					error.message,
				);
			}
		} finally {
			if (!isStale()) isInitialMessagesLoad = false;
		}
	}

	// Check through all aliases from messages to see if any new ones need to be fetched
	function loadMissingAliases(messageList) {
		const ids = new Set();
		for (const m of messageList) {
			if (m.participantId !== "server" && !aliasCache.has(m.participantId)) ids.add(m.participantId);
			const sysId = m.systemEvent?.participantId;
			if (sysId && !aliasCache.has(sysId)) ids.add(sysId);
		}
		return ids.size ? loadAliases([...ids]) : Promise.resolve(); // Skips any already-fetched (in-flight or already resolved) ones
	}

	// Bulk-fetch any referenced messages that aren't already in the loaded page or the reference cache
	async function loadMissingReferences(messageList) {
		const client = get(hcClient);
		if (!client) return;

		const toFetch = [];
		for (const m of messageList) {
			const refId = m.messageOptions?.referenceMessageId;
			if (!refId) continue;
			if (referenceCache.has(refId) || referenceLoadIds.has(refId)) continue;
			if (messages.some((x) => x.messageId === refId)) continue;
			toFetch.push(refId);
		}
		if (!toFetch.length) return;

		for (const id of toFetch) referenceLoadIds.add(id);
		try {
			const fetched = await client.getMessagesByIds(toFetch);
			const found = new Map(fetched.map((m) => [m.messageId, m]));
			for (const id of toFetch) referenceCache.set(id, found.get(id) ?? null); // null means gone from database, deleted messages still come back with deleted: true
		} catch (error) {
			console.error("Error fetching referenced messages:", error);
		} finally {
			for (const id of toFetch) referenceLoadIds.delete(id);
		}
	}

	function mergeIncomingMessage(message) {
		// Ignore messages from other conversations (stale handler before off completes)
		if (message.conversationId !== $activeConversationId) return;

		const idx = messages.findIndex((m) => m.messageId === message.messageId);
		if (idx === -1) {
			messages = [...messages, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
			loadMissingAliases([message]);
			loadMissingReferences([message]);
			return;
		}

		// Update in place (edit, reaction, soft-delete)
		messages = messages.with(idx, message);
	}

	async function loadOlder() {
		if (isLoadingMore || isInitialMessagesLoad || remainingMore <= 0 || !messages.length) return;
		isLoadingMore = true;

		const oldest = messages[0];

		try {
			const { messages: older, remainingInDirection } = await get(hcClient).getMessages(
				$activeConversationId,
				oldest.messageId,
				false,
				PAGE_SIZE,
			);
			messages = [...older, ...messages];
			remainingMore = remainingInDirection;
			loadMissingAliases(older);
			loadMissingReferences(older);
		} catch (error) {
			errorPopup("Failed to load older messages", "An error occured trying to load more messages.", error.message);
		} finally {
			isLoadingMore = false;
		}

		// IntersectionObserver only fires on intersection changes, so manually retrigger if the sentinel is still in view (user out-scrolled this load)
		await tick();
		if (messagesContainer && messagesContainer.scrollTop < 500 && remainingMore > 0) loadOlder();
	}

	async function offConvSpecificEvents() {
		const client = get(hcClient);
		const promises = [];
		if (messageHandler) promises.push(client?.offMessage(messageHandler));
		if (indicatorHandler) promises.push(client?.offIndicators(indicatorHandler));
		messageHandler = null;
		indicatorHandler = null;
		await Promise.all(promises);
	}

	async function sendCurrent() {
		const text = inputValue.trim();
		if (!text) return;

		// Snapshot inputs, then clear
		const conversationId = $activeConversationId;
		const reference = replyTo?.messageId ?? null;
		inputValue = "";
		replyTo = null;

		try {
			await get(hcClient).sendMessage(conversationId, text, { referenceMessageId: reference, isForwarded: false });
		} catch (error) {
			errorPopup("Failed to send message", "An error occured trying to send your message.", error.message);
		}
	}

	let typingParticipants = $derived(
		indicators.map((i) => ({
			participantId: i.participantId,
			alias: aliasCache.get(i.participantId) ?? "Unknown",
		})),
	);

	// Scroll to the rest position when bottom content changes or right after a conversation finishes loading
	let lastBottomSignature = "";
	let wasLoading = false;

	$effect(() => {
		const signature = `${messages.length}:${indicators.length}`;
		const finishedLoad = wasLoading && !isInitialMessagesLoad;
		const changed = signature !== lastBottomSignature;
		lastBottomSignature = signature;
		wasLoading = isInitialMessagesLoad;
		if (isInitialMessagesLoad || !messagesContainer || (!changed && !finishedLoad)) return;

		const distanceFromBottom =
			messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
		if (!finishedLoad && distanceFromBottom > BOTTOM_SLACK_PX + 400) return; // 400px is the margin the user needs to be in for auto-scroll

		tick().then(() => {
			if (!messagesContainer) return;
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight - messagesContainer.clientHeight - BOTTOM_SLACK_PX,
				behavior: finishedLoad ? "instant" : "smooth", // Instant scroll for the initial load, smooth ones from there on
			});
		});
	});
</script>

<Popup z={971} bind:open={$messagesPopup}>
	<div class="popup-title">
		<h1>Messages</h1>
	</div>

	<div class="layout">
		<MessagesSidebar />

		<div class="messages-pane">
			<div class="messages-view">
				{#if !$activeConversationId}
					<p class="loading-text">No conversation selected.</p>
				{:else if isInitialMessagesLoad}
					<p class="loading-text">Loading...</p>
				{:else if !messages.length}
					<p class="loading-text">No messages yet.</p>
				{:else}
					<div class="messages-view-inner of-top of-bottom of-length-0.5" bind:this={messagesContainer}>
						{#if remainingMore > 0}
							<p
								class="loading-more"
								{@attach (node) => {
									const observer = new IntersectionObserver(
										(entries) => {
											if (entries[0].isIntersecting) loadOlder();
										},
										{ root: messagesContainer, rootMargin: "500px 0px 0px 0px", threshold: 0 },
									);
									observer.observe(node);
									return () => observer.disconnect();
								}}
							>
								Loading...
							</p>
						{/if}

						{#each messages as message, i (message.messageId)}
							{#if message.systemEvent}
								<div class="system-note">
									<div class="system-note-line"></div>
									<p>
										{#if message.systemEvent.type === "messagesRemoved"}
											Old messages removed
										{:else}
											{aliasCache.get(message.systemEvent.participantId) || "Unknown"}
											{message.systemEvent.type === "participantJoined" ? "joined" : "left"}
										{/if}
									</p>
									<div class="system-note-line"></div>
								</div>
							{:else}
								<MessageItem
									{message}
									referencedMessage={message.messageOptions?.referenceMessageId
										? (messages.find((m) => m.messageId === message.messageOptions.referenceMessageId) ??
											referenceCache.get(message.messageOptions.referenceMessageId) ??
											null)
										: null}
									isContinuation={i > 0 && messages[i - 1].participantId === message.participantId}
									onreply={async (m) => {
										replyTo = m;
										replyToAlias = await getAliasCached(m.participantId);
									}}
								/>
							{/if}
						{/each}

						{#each typingParticipants as participant (participant.participantId)}
							<MessageItem
								isTyping
								isContinuation={messages.at(-1)?.participantId === participant.participantId}
								message={{ participantId: participant.participantId, reactions: [], deleted: false }}
							/>
						{/each}
					</div>
				{/if}
			</div>

			{#if $activeConversationId}
				<div class="send-box">
					{#if replyTo}
						<div class="reply-preview">
							<p class="reply-preview-text">
								<span style:opacity="0.5">Replying to&nbsp;</span>{replyToAlias}
							</p>
							<button
								class="standardButton white reply-close"
								onclick={() => {
									playSound("basic_button");
									replyTo = null;
								}}
							>
								<X size={20} strokeWidth={2.25} />
							</button>
						</div>
					{/if}

					<div class="send-row">
						<input
							type="text"
							maxlength="2000"
							placeholder="Your message..."
							bind:value={inputValue}
							onkeydown={async (event) => {
								if (event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
									await sendCurrent();
									return;
								}

								// Refresh typing indicator at most every INDICATOR_REFRESH_MS while typing
								const now = Date.now();
								if (now - lastIndicatorAt > INDICATOR_REFRESH_MS && $activeConversationId) {
									lastIndicatorAt = now;
									get(hcClient)
										?.setIndicator($activeConversationId)
										.catch((e) => console.error("Indicator failed:", e));
								}
							}}
						/>
						<button
							class="standardButton white"
							use:tooltip={{ text: "Send message" }}
							disabled={!inputValue.trim()}
							onclick={() => {
								playSound("basic_button");
								sendCurrent();
							}}
						>
							<SendHorizonal strokeWidth={2.25} size={22} style="margin-bottom: -2px;" />
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</Popup>

<style>
	.popup-title {
		margin-bottom: var(--layout-margin);
	}

	.layout {
		display: flex;
		gap: var(--layout-margin);
		height: min(600px, calc(100dvh - 250px));
	}

	.messages-pane {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		min-width: 0;
	}

	.messages-view {
		flex-grow: 1;
		display: flex;
		overflow: hidden;
		position: relative;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		box-sizing: border-box;
	}

	.messages-view-inner {
		width: 100%;
		height: 100%;
		padding: var(--box-margin);
		padding-top: calc(60px + var(--box-margin) * 2);
		padding-bottom: calc(60px + var(--box-margin) * 2);
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		overflow-y: auto;
		scrollbar-width: none;
		box-sizing: border-box;
	}

	.system-note {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
	}

	.system-note p {
		opacity: 0.5;
		font-size: 20px;
		max-width: 75%;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.system-note-line {
		flex-grow: 1;
		height: 2px;
		background-color: white;
		opacity: 0.15;
		border-radius: var(--box-margin);
	}

	.loading-text {
		opacity: 0.5;
		margin: auto;
		text-align: center;
	}

	.loading-more {
		opacity: 0.5;
		text-align: center;
		box-sizing: border-box;
		padding: var(--box-margin);
	}

	.send-box {
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
	}

	.reply-preview {
		display: flex;
		align-items: center;
		gap: var(--content-margin);
	}

	.reply-preview-text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		padding-inline: var(--content-margin);
	}

	.reply-close {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		padding: 0;
	}

	.send-row {
		display: flex;
		gap: var(--box-margin);
	}

	.send-row input {
		flex-grow: 1;
		width: 0;
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
	}

	@media all and (max-width: 800px) {
		.layout {
			flex-direction: column;
			max-height: min(550px, calc(100dvh - 250px));
		}
	}
</style>

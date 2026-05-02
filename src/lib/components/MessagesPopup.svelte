<script>
	import { onDestroy, tick } from "svelte";
	import { get } from "svelte/store";
	import { X, MailPlus, SendHorizonal } from "@lucide/svelte";
	import Popup from "./ui/Popup.svelte";
	import MessageItem from "./MessageItem.svelte";
	import MessagesSidebar from "./MessagesSidebar.svelte";
	import { messagesPopup } from "$lib/stores/uiStore";
	import {
		hcClient,
		conversations,
		participantActivities,
		activeConversationId,
		aliasCache,
	} from "$lib/stores/context-specific/headlessChatStore";
	import { loadConversationsAndInvites, getAliasCached, loadAliases } from "$lib/logic/headlessChatLogic";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { tooltip } from "$lib/utils/tooltip";
	import { playSound } from "$lib/utils/soundManager";

	const PAGE_SIZE = 50;
	const INDICATOR_REFRESH_MS = 2000;
	const BOTTOM_SLACK_PX = 60; // Reserved space below the last message so new messages can appear and disappear smoothly

	let messages = $state([]);
	let remainingMore = $state(0);
	let isLoadingPage = $state(false);
	let isLoadingMore = $state(false);
	let indicators = $state([]);
	let replyTo = $state(null);
	let replyToAlias = $state("...");
	let inputValue = $state("");

	let messagesContainer = $state();
	let messageHandler = null;
	let indicatorHandler = null;
	let lastIndicatorAt = 0;
	let openGeneration = 0; // Bumped per setActiveConversation call, lets stale runs bail before writing state
	let lastSyncedConversationId = null; // Last id setActiveConversation has synced to, prevents redundant resyncs

	// Off all event handlers that are conversation specific on unmount
	onDestroy(offEventHandlers);

	// Lazy load conversations / invites the first time the popup opens
	$effect(() => {
		if ($messagesPopup) loadConversationsAndInvites();
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
		isLoadingPage = Boolean(id);

		await offEventHandlers();
		if (id) await openConversation(id, sequence);
	}

	async function openConversation(conversationId, thisGen) {
		const client = get(hcClient);
		if (!client) return;

		// Check if this load is from an old load generation
		const isStale = () => thisGen !== openGeneration;

		// Preload aliases for everyone currently in the conversation so messages render synchronously
		const conv = get(conversations).find((c) => c.conversationId === conversationId);
		if (conv) loadAliases(conv.participants);

		try {
			messageHandler = (m) => mergeIncomingMessage(m);
			await client.onMessage(conversationId, messageHandler);

			indicatorHandler = (list) => {
				const userId = localStorage.getItem("id");
				indicators = list.filter((i) => i.participantId !== userId);
			};
			await client.onIndicators(conversationId, indicatorHandler);

			const { messages: page, remainingInDirection } = await client.getMessages(conversationId, null, false, PAGE_SIZE);
			const acts = await client.getParticipantActivities();

			if (isStale()) return; // If no longer the lastest gen, exit

			messages = page;
			remainingMore = remainingInDirection;
			$participantActivities = acts;
			loadMissingAliases(page);
		} catch (error) {
			if (!isStale()) {
				errorPopup(
					"Failed to load messages",
					"An error occured trying to load messages for this conversation.",
					error.message,
				);
			}
		} finally {
			if (!isStale()) isLoadingPage = false;
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
		if (ids.size) loadAliases([...ids]); // Skips any already-fetched (in-flight or already resolved) ones
	}

	function mergeIncomingMessage(message) {
		// Ignore messages from other conversations (stale handler before off completes)
		if (message.conversationId !== $activeConversationId) return;

		const idx = messages.findIndex((m) => m.messageId === message.messageId);
		if (idx === -1) {
			messages = [...messages, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
			loadMissingAliases([message]);
			return;
		}

		// Update in place (edit, reaction, soft-delete)
		messages = messages.with(idx, message);
	}

	async function loadOlder() {
		if (isLoadingMore || isLoadingPage || remainingMore <= 0 || !messages.length) return;
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
		} catch (error) {
			errorPopup("Failed to load older messages", "An error occured trying to load more messages.", error.message);
		} finally {
			isLoadingMore = false;
		}
	}

	async function offEventHandlers() {
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
			alias: aliasCache.get(i.participantId) ?? "...",
		})),
	);

	// Scroll to the rest position when bottom content changes or right after a conversation finishes loading
	let lastBottomSignature = "";
	let wasLoading = false;
	
	$effect(() => {
		const signature = `${messages.length}:${indicators.length}`;
		const finishedLoad = wasLoading && !isLoadingPage;
		const changed = signature !== lastBottomSignature;
		lastBottomSignature = signature;
		wasLoading = isLoadingPage;
		if (isLoadingPage || !messagesContainer || (!changed && !finishedLoad)) return;

		const distanceFromBottom =
			messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
		if (!finishedLoad && distanceFromBottom > BOTTOM_SLACK_PX + 100) return;

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
			{#if !$activeConversationId}
				<div class="empty-state">
					<MailPlus size={48} strokeWidth={1.5} style="opacity: 0.4;" />
					<p style="opacity: 0.5;">Select a conversation to start messaging.</p>
				</div>
			{:else}
				<div class="messages-view">
					{#if isLoadingPage && !messages.length}
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
											{aliasCache.get(message.systemEvent.participantId) || "..."}
											{message.systemEvent.type === "participantJoined" ? "joined" : "left"}
										</p>
										<div class="system-note-line"></div>
									</div>
								{:else}
									<MessageItem
										{message}
										referencedMessage={message.messageOptions?.referenceMessageId
											? messages.find((m) => m.messageId === message.messageOptions.referenceMessageId)
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
							disabled={!$activeConversationId}
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

	.empty-state {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
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

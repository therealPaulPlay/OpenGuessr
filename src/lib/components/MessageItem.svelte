<script>
	import { get } from "svelte/store";
	import { Reply, SmilePlus, Trash2 } from "@lucide/svelte";
	import { hcClient } from "$lib/stores/context-specific/headlessChatStore";
	import { getAliasCached } from "$lib/logic/headlessChatLogic";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { showProfile } from "$lib/utils/showProfile";
	import { tooltip } from "$lib/utils/tooltip";
	import { playSound } from "$lib/utils/soundManager";
	import { messagesPopup } from "$lib/stores/uiStore";

	const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

	let { message, referencedMessage = null, onreply, isTyping = false, isContinuation = false } = $props();

	let userId = localStorage.getItem("id");
	let isOwn = $derived(message.participantId === userId);

	let alias = $state("...");
	let referencedAlias = $state("...");
	let reactionPickerOpen = $state(false);

	$effect(() => {
		(async () => (alias = await getAliasCached(message.participantId)))();
	});

	$effect(() => {
		if (!referencedMessage) return;
		(async () => (referencedAlias = await getAliasCached(referencedMessage.participantId)))();
	});

	async function toggleReaction(emoji) {
		reactionPickerOpen = false;
		try {
			// Server deduplicates
			await get(hcClient).addReaction(message.messageId, emoji);
		} catch (error) {
			errorPopup("Failed to react", "An error occured trying to update a reaction.", error.message);
		}
	}

	// Group reactions by emoji for compact display
	let groupedReactions = $derived.by(() => {
		const groups = new Map();

		for (const r of message.reactions) {
			const existing = groups.get(r.content) ?? { count: 0, mine: false };
			existing.count += 1;
			if (r.participantId === userId) existing.mine = true;
			groups.set(r.content, existing);
		}

		return [...groups.entries()];
	});

	let timestamp = $derived(new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
</script>

<div class="message-row" class:own={isOwn}>
	<div class="message-block">
		{#if !isOwn && !isContinuation}
			<button
				class="alias-button"
				onclick={() => {
					$messagesPopup = false;
					showProfile(message.participantId);
				}}>{alias}</button
			>
		{/if}

		<div class="bubble-with-actions" class:own-aligned={isOwn}>
			<div class="bubble" class:own-bubble={isOwn} class:deleted-bubble={message.deleted}>
				{#if isTyping}
					<div class="typing-dots">
						<span class="typing-dot"></span>
						<span class="typing-dot"></span>
						<span class="typing-dot"></span>
					</div>
				{:else}
					{#if referencedMessage}
						<div class="reference">
							<span class="reference-author">{referencedAlias}</span>
							<span class="reference-text">
								{referencedMessage.deleted ? "Deleted message" : referencedMessage.message}
							</span>
						</div>
					{/if}

					<p style:white-space="pre-wrap" style:opacity={message.deleted ? "0.5" : ""}>
						{#if message.deleted}
							Deleted message
						{:else}
							{message.message}
						{/if}
					</p>
				{/if}
			</div>

			{#if !isTyping && !message.deleted}
				<div class="actions" style:flex-direction={isOwn ? "" : "row-reverse"}>
					<span class="timestamp">{timestamp}</span>
					<div class="action-buttons">
						{#if !isOwn}
							<button
								class="standardButton white action-button"
								use:tooltip={{ text: "React" }}
								onclick={() => {
									playSound("basic_button");
									reactionPickerOpen = !reactionPickerOpen;
								}}
							>
								<SmilePlus size={18} strokeWidth={2.25} />
							</button>
						{/if}
						{#if isOwn}
							<button
								class="standardButton white action-button"
								use:tooltip={{ text: "Delete" }}
								onclick={async () => {
									playSound("basic_button");
									try {
										await get(hcClient).deleteMessage(message.messageId);
									} catch (error) {
										errorPopup(
											"Failed to delete message",
											"An error occured trying to delete your message.",
											error.message,
										);
									}
								}}
							>
								<Trash2 size={18} strokeWidth={2.25} />
							</button>
						{/if}
						<button
							class="standardButton white action-button"
							use:tooltip={{ text: "Reply" }}
							onclick={() => {
								playSound("basic_button");
								onreply?.(message);
							}}
						>
							<Reply size={18} strokeWidth={2.25} />
						</button>
					</div>
					{#if reactionPickerOpen}
						<div class="reaction-picker">
							{#each REACTION_EMOJIS as emoji}
								<button class="reaction-pick" onclick={() => toggleReaction(emoji)}>{emoji}</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if !isTyping && groupedReactions.length}
			<div class="reactions" class:own-aligned={isOwn}>
				{#each groupedReactions as [emoji, group] (emoji)}
					<button class="reaction-chip" class:mine={group.mine} onclick={() => toggleReaction(emoji)}>
						<span>{emoji}</span>
						<span class="reaction-count">{group.count}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.message-row {
		display: flex;
		align-items: flex-start;
		gap: var(--content-margin);
		position: relative;
	}

	.message-row.own {
		flex-direction: row-reverse;
	}

	.message-block {
		display: flex;
		flex-direction: column;
		gap: var(--content-margin);
		max-width: 75%;
	}

	.alias-button {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		padding: 0;
		opacity: 0.5;
		font-size: 18px;
		transition: opacity 250ms ease;
		text-align: left;
		width: fit-content;
	}

	.alias-button:hover {
		opacity: 0.25;
	}

	.bubble-with-actions {
		display: flex;
		align-items: flex-end;
		gap: var(--content-margin);
	}

	.bubble-with-actions.own-aligned {
		flex-direction: row-reverse;
	}

	.bubble {
		background-color: var(--box-color);
		box-shadow: var(--bulb-shadow);
		border-radius: var(--box-margin);
		padding: var(--content-margin) var(--panel-margin);
		overflow-wrap: anywhere;
	}

	.bubble p {
		font-size: 20px;
	}

	.bubble.own-bubble {
		background-color: rgba(255, 255, 255, 0.15);
	}

	.bubble.deleted-bubble {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.typing-dots {
		display: flex;
		gap: var(--content-margin);
		align-items: center;
		justify-content: center;
		height: 22px;
	}

	.typing-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: white;
		opacity: 0.5;
		animation: typing-pulse 1200ms ease-in-out infinite;
	}

	.typing-dot:nth-child(2) {
		animation-delay: 200ms;
	}
	.typing-dot:nth-child(3) {
		animation-delay: 400ms;
	}

	@keyframes typing-pulse {
		0%,
		60%,
		100% {
			opacity: 0.25;
		}
		30% {
			opacity: 1;
		}
	}

	.reference {
		display: flex;
		flex-direction: column;
		margin-bottom: var(--content-margin);
		background-color: var(--box-color-dark);
		box-shadow: var(--box-shadow);
		border-radius: var(--content-margin);
		padding: var(--content-margin);
		padding-inline: var(--panel-margin);
		opacity: 0.75;
	}

	.reference-author {
		font-size: 18px;
		opacity: 0.75;
	}

	.reference-text {
		font-size: 18px;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.reactions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--content-margin);
	}

	.reactions.own-aligned {
		justify-content: flex-end;
	}

	.reaction-chip {
		display: flex;
		align-items: center;
		gap: var(--content-margin);
		background-color: var(--box-color);
		box-shadow: var(--bulb-shadow);
		border-radius: var(--box-margin);
		padding: 2px var(--content-margin);
		cursor: pointer;
		transition: background-color 250ms ease;
	}

	.reaction-chip.mine {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.reaction-count {
		opacity: 1;
		font-size: 16px;
		padding-right: 3px;
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		align-items: center;
		margin-top: auto;
		gap: var(--box-margin);
		opacity: 0;
		transition: opacity 150ms ease;
		position: relative;
	}

	.bubble-with-actions:hover .actions {
		opacity: 1;
	}

	.timestamp {
		font-size: 18px;
		opacity: 0.5;
		white-space: nowrap;
	}

	.action-buttons {
		display: flex;
		gap: var(--content-margin);
	}

	.action-button {
		padding: 2px;
		height: 35px;
		border-radius: var(--box-margin);
	}

	.reaction-picker {
		position: absolute;
		bottom: 100%;
		margin-bottom: var(--content-margin);
		display: flex;
		gap: var(--content-margin);
		padding: var(--panel-margin);
		background-color: var(--panel-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		backdrop-filter: blur(10px);
		z-index: 1;
	}

	.reaction-pick {
		background: none;
		cursor: pointer;
		padding: var(--content-margin);
		transition: opacity 250ms ease;
	}

	.reaction-pick:hover {
		opacity: 0.5;
	}
</style>

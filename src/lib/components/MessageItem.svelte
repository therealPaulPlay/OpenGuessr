<script>
	import { get } from "svelte/store";
	import { computePosition, flip, shift } from "@floating-ui/dom";
	import { Reply, SmilePlus, Trash2 } from "@lucide/svelte";
	import { hcClient } from "$lib/stores/context-specific/headlessChatStore";
	import { getAliasCached } from "$lib/logic/headlessChatLogic";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { showProfile } from "$lib/utils/showProfile";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { messagesPopup } from "$lib/stores/uiStore";

	const REACTION_EMOJIS = ["👍", "❤️", "😂", "😢"];

	let { message, referencedMessage = null, onreply, isTyping = false, isContinuation = false } = $props();

	let userId = localStorage.getItem("id");
	let isOwn = $derived(message.participantId === userId);

	let alias = $state("Unknown");
	let referencedAlias = $state("Unknown");
	let reactionPickerOpen = $state(false);
	let reactButtonElement = $state();
	let reactionPickerElement = $state();
	let actionsElement = $state();

	$effect(() => {
		(async () => (alias = await getAliasCached(message.participantId)))();
	});

	$effect(() => {
		if (!referencedMessage) return;
		(async () => (referencedAlias = await getAliasCached(referencedMessage.participantId)))();
	});

	async function toggleReaction(emoji) {
		reactionPickerOpen = false;
		const existing = message.reactions.find((r) => r.participantId === userId && r.content === emoji);
		try {
			if (existing)
				await get(hcClient).removeReaction(existing.reactionId); // Remove, don't replace
			else await get(hcClient).addReaction(message.messageId, emoji); // Add new reaction
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
		{#if !isContinuation}
			<button
				class="alias-button"
				onclick={() => {
					$messagesPopup = false;
					showProfile(message.participantId);
				}}>{isOwn ? "You" : alias}</button
			>
		{/if}

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={actionsElement}
			class="bubble-with-actions"
			class:own-aligned={isOwn}
			onpointerleave={(e) => {
				if (e.pointerType === "touch" || !reactionPickerOpen) return;
				if (actionsElement?.contains(e.relatedTarget) || reactionPickerElement?.contains(e.relatedTarget)) return;
				reactionPickerOpen = false;
			}}
		>
			<div
				class="bubble"
				class:own-bubble={isOwn}
				class:deleted-bubble={message.deleted}
				class:has-reference={Boolean(referencedMessage)}
			>
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
						{message.deleted ? "Deleted message" : message.message}
					</p>
				{/if}
			</div>

			{#if !isTyping && !message.deleted}
				<div class="actions" style:flex-direction={isOwn ? "" : "row-reverse"}>
					<span class="timestamp">{timestamp}</span>
					<div class="action-buttons">
						{#if !isOwn}
							<button
								bind:this={reactButtonElement}
								class="standardButton white action-button"
								{@attach tooltip({ text: "React" })}
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
								{@attach tooltip({ text: "Delete" })}
								onclick={() => {
									playSound("basic_button");
									showConfirmPopup(
										"Delete message?",
										"This will remove the message for everyone in the conversation.",
										async () => {
											try {
												await get(hcClient).deleteMessage(message.messageId);
											} catch (error) {
												errorPopup(
													"Failed to delete message",
													"An error occured trying to delete your message.",
													error.message,
												);
											}
										},
									);
								}}
							>
								<Trash2 size={18} strokeWidth={2.25} />
							</button>
						{/if}
						<button
							class="standardButton white action-button"
							{@attach tooltip({ text: "Reply" })}
							onclick={() => {
								playSound("basic_button");
								onreply?.(message);
							}}
						>
							<Reply size={18} strokeWidth={2.25} />
						</button>
					</div>
					{#if reactionPickerOpen}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							bind:this={reactionPickerElement}
							class="reaction-picker-wrapper"
							popover="manual"
							onpointerleave={(e) => {
								if (e.pointerType === "touch") return;
								if (!actionsElement?.contains(e.relatedTarget)) reactionPickerOpen = false;
							}}
							{@attach (node) => {
								const panel = node.querySelector(".reaction-picker");
								Object.assign(panel.style, {
									transform: "scale(0)",
									opacity: "0",
									filter: "blur(15px)",
									transition: "transform 150ms ease, opacity 150ms ease, filter 150ms ease",
								});
								node.showPopover();

								computePosition(reactButtonElement, node, {
									placement: "top",
									middleware: [flip(), shift({ padding: 5 })],
								}).then(({ x, y }) => {
									Object.assign(node.style, { left: x + "px", top: y + "px" });
									requestAnimationFrame(() => Object.assign(panel.style, { transform: "scale(1)", opacity: "1", filter: "blur(0)" }));
								});

								const onPointerDown = (e) => {
									if (!node.contains(e.target) && !reactButtonElement?.contains(e.target)) reactionPickerOpen = false;
								};
								document.addEventListener("pointerdown", onPointerDown);
								return () => {
									document.removeEventListener("pointerdown", onPointerDown);
									node.hidePopover();
								};
							}}
						>
							<div class="tooltip reaction-picker">
								{#each REACTION_EMOJIS as emoji}
									<button class="reaction-pick" onclick={() => toggleReaction(emoji)}>{emoji}</button>
								{/each}
							</div>
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
	}

	.alias-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		opacity: 0.5;
		font-size: 18px;
		transition: opacity 250ms ease;
		text-align: left;
		width: fit-content;
		margin-left: 3px;
	}

	.message-row.own .alias-button {
		align-self: flex-end;
		margin-left: 0;
		margin-right: 3px;
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
		max-width: 250px;
	}

	.has-reference {
		min-width: 100px;
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
		width: 0;
		min-width: 100%;
		margin-bottom: var(--content-margin);
		background-color: var(--box-color-dark);
		box-shadow: var(--box-shadow);
		border-radius: var(--content-margin);
		padding: var(--content-margin);
		padding-inline: var(--panel-margin);
		opacity: 0.75;
		box-sizing: border-box;
	}

	.reference-author {
		font-size: 18px;
		opacity: 0.75;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reference-text {
		font-size: 18px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		gap: 3px;
		background-color: var(--box-color);
		box-shadow: var(--bulb-shadow);
		border-radius: var(--box-margin);
		padding: 2px var(--content-margin);
		cursor: pointer;
		transition: background-color 250ms ease;
	}

	.reaction-chip span {
		font-size: 16px;
	}

	.reaction-chip.mine {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.reaction-count {
		opacity: 1;
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

	.reaction-picker-wrapper {
		margin: 0;
		padding: 0 0 var(--box-margin) 0;
		background: none;
		border: none;
		box-shadow: none;
		backdrop-filter: none;
	}

	.reaction-picker {
		display: flex;
		gap: var(--content-margin);
		padding: var(--panel-margin);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		transform-origin: bottom;
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

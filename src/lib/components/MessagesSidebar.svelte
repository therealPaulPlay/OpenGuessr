<script>
	import { get } from "svelte/store";
	import { flip } from "svelte/animate";
	import { X } from "@lucide/svelte";
	import { messagesPopup } from "$lib/stores/uiStore";
	import {
		hcClient,
		conversations,
		invites,
		participantActivities,
		activeConversationId,
		aliasCache,
	} from "$lib/stores/context-specific/headlessChatStore";
	import { loadAliases } from "$lib/logic/headlessChatLogic";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { showProfile } from "$lib/utils/showProfile";
	import { tooltip } from "$lib/utils/tooltip";
	import { playSound } from "$lib/utils/soundManager";
	import Chip from "./ui/Chip.svelte";

	let userId = $derived(localStorage.getItem("id"));
	let myInvites = $derived($invites.filter((i) => i.toParticipantId === userId));

	// Builds a label from a conversation's participants, excluding the current user
	function buildTitle(participants) {
		const me = localStorage.getItem("id");
		const others = participants.filter((p) => p !== me);
		if (!others.length) return "Just you";

		return others.map((p) => aliasCache.get(p) ?? "Unknown").join(", ");
	}

	let conversationTitles = $derived.by(() => {
		const map = new Map();
		const missing = new Set();
		for (const c of $conversations) {
			map.set(c.conversationId, buildTitle(c.participantIds));
			for (const p of c.participantIds) if (!aliasCache.has(p)) missing.add(p);
		}
		// Kick off any missing alias loads
		if (missing.size) loadAliases([...missing]);
		return map;
	});

	function hasUnread(conversation) {
		const last = conversation.lastMessage;
		if (!last || last.participantId === localStorage.getItem("id")) return false;

		const activity = $participantActivities.find((a) => a.conversationId === conversation.conversationId);
		if (!activity) return true;

		return new Date(last.createdAt) > new Date(activity.lastReadMessageCreatedAt);
	}
</script>

<div class="sidebar">
	<div class="sidebar-inner of-top of-bottom">
		{#if myInvites.length}
			<p class="sidebar-heading">Invites</p>
			{#each myInvites as invite (invite.conversation.conversationId)}
				<div class="invite-item">
					<p class="invite-text">
						From <button
							class="invite-link"
							onclick={() => {
								$messagesPopup = false;
								showProfile(invite.fromParticipantId);
							}}>{conversationTitles.get(invite.conversation.conversationId) ?? "Unknown"}</button
						>
					</p>
					<div class="invite-buttons">
						<button
							class="standardButton"
							onclick={async () => {
								playSound("basic_button");
								try {
									await get(hcClient).acceptInvite(invite.conversation.conversationId);
									$activeConversationId = invite.conversation.conversationId;
								} catch (error) {
									errorPopup("Failed to accept invite", "An error occured trying to accept an invite.", error.message);
								}
							}}>Accept</button
						>
						<button
							class="standardButton white"
							onclick={async () => {
								playSound("basic_button");
								try {
									await get(hcClient).declineInvite(invite.conversation.conversationId);
								} catch (error) {
									errorPopup(
										"Failed to decline invite",
										"An error occured trying to decline a conversation invite.",
										error.message,
									);
								}
							}}><X size={20} strokeWidth={2.25} /></button
						>
					</div>
				</div>
			{/each}
			<p class="sidebar-heading">Conversations</p>
		{/if}

		{#if $conversations.length}
			{#each $conversations as c (c.conversationId)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					animate:flip={{ duration: 250 }}
					class="conversation-item"
					class:active={$activeConversationId === c.conversationId}
					role="button"
					tabindex="0"
					onclick={() => {
						if ($activeConversationId === c.conversationId) return;
						$activeConversationId = c.conversationId;
					}}
				>
					<div class="conversation-content">
						<div class="conversation-title">
							<span class="conversation-name">{conversationTitles.get(c.conversationId) ?? "Unknown"}</span>
						</div>
						<div class="conversation-preview">
							{#if hasUnread(c)}
								<Chip text="New" italic={true} red={true} />
							{/if}
							<span class="conversation-preview-text">
								{#if c.lastMessage?.deleted}
									Deleted message
								{:else if c.lastMessage?.systemEvent}
									System message
								{:else if c.lastMessage && c.lastMessage.message}
									{c.lastMessage.message}
								{:else}
									No messages
								{/if}
							</span>
						</div>
					</div>
					<button
						class="standardButton white leave-button"
						use:tooltip={{ text: "Leave" }}
						onclick={(e) => {
							e.stopPropagation();
							playSound("basic_button");
							showConfirmPopup(
								"Leave conversation?",
								"You will no longer be able to participate in this conversation.",
								async () => {
									try {
										await get(hcClient).leaveConversation(c.conversationId);
										if ($activeConversationId === c.conversationId) activeConversationId.set(null);
									} catch (error) {
										errorPopup(
											"Failed to leave conversation",
											"An error occured trying to leave this conversation.",
											error.message,
										);
									}
								},
							);
						}}
					>
						<X size={20} strokeWidth={2.25} />
					</button>
				</div>
			{/each}
		{:else}
			<p class="loading-text">No conversations.</p>
		{/if}
	</div>
</div>

<style>
	.sidebar {
		min-width: 35%;
		width: 200px;
		overflow: hidden;
		position: relative;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		box-sizing: border-box;
	}

	.sidebar-inner {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		padding: var(--box-margin);
		overflow-y: auto;
		scrollbar-width: none;
		box-sizing: border-box;
	}

	.sidebar-heading {
		opacity: 0.5;
		font-size: 18px;
		padding-inline: var(--content-margin);
		margin-top: var(--content-margin);
	}

	.conversation-item {
		display: flex;
		align-items: center;
		gap: var(--content-margin);
		padding: var(--box-margin);
		border-radius: var(--content-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		cursor: pointer;
		transition: background-color 250ms ease;
	}

	.conversation-content {
		flex-grow: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.conversation-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.conversation-item.active {
		background-color: rgba(255, 255, 255, 0.15);
	}

	.conversation-title {
		display: flex;
		align-items: center;
		gap: var(--content-margin);
	}

	.conversation-name {
		flex-grow: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
	}

	.leave-button {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		padding: 0;
	}

	.conversation-preview {
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
		font-size: 18px;
		line-height: 28px;
		min-width: 0;
	}

	.conversation-preview-text {
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		min-width: 0;
	}

	.invite-item {
		padding: var(--box-margin);
		border-radius: var(--box-margin);
		background-color: rgba(255, 255, 255, 0.05);
		display: flex;
		flex-direction: column;
		gap: var(--content-margin);
	}

	.invite-text {
		font-size: 18px;
		overflow-wrap: break-word;
	}

	.invite-link {
		color: white;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-decoration: underline;
	}

	.invite-buttons {
		display: flex;
		gap: var(--content-margin);
	}

	.invite-buttons .standardButton {
		flex: 1;
		padding-inline: var(--content-margin);
	}

	.loading-text {
		opacity: 0.5;
		margin: auto;
		text-align: center;
	}

	@media all and (max-width: 800px) {
		.sidebar {
			width: 100%;
			min-width: 0;
			max-height: 180px;
		}
	}
</style>

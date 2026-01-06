<script>
	import { chatArray, chatMutedPlayers, socket } from "$lib/stores/context-specific/multiplayerStore";
	import { sendChat } from "$lib/utils/chatFunctions";
	import { playSound } from "$lib/utils/soundManager";
	import RemainingGuessesDisplay from "$lib/components/RemainingGuessesDisplay.svelte";
	import { MessageSquareWarning, SendHorizonal } from "@lucide/svelte";
	import { tooltip } from "$lib/utils/tooltip";
	import { chatManagePopup } from "$lib/stores/uiStore";
	import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
	import { get } from "svelte/store";

	let { inPanel = true, isTeamChat = false } = $props();

	let chatMessageBoxElement = $state();
	let inputValue = $state();

	// Watch for changes to chatArray and scroll to bottom automatically
	$effect(() => {
		isTeamChat; // Re-run effect when this changes
		if ($chatArray && $chatMutedPlayers && chatMessageBoxElement)
			chatMessageBoxElement.scrollTop = chatMessageBoxElement.scrollHeight;
	});

	let displayedChatArray = $derived.by(() => {
		return ($chatArray || []).filter((chat) => {
			return (
				!$chatMutedPlayers?.includes(chat.clientId) &&
				(isTeamChat ? chat.teamIndex == getTeamFromClientId(get(socket)?.id) : chat.teamIndex == null)
			);
		});
	});
</script>

<RemainingGuessesDisplay {inPanel} />
<div class="multiplayerChatMessages of-top of-bottom" bind:this={chatMessageBoxElement}>
	<p>
		{#if displayedChatArray.length}
			{#each displayedChatArray as chat}
				<span style="overflow-wrap: break-word;"
					><span style:opacity={chat.clientId == "server" ? 0.75 : 1}>{chat.username}:</span>
					<span style:opacity={0.75}>{chat.text}</span></span
				>
				<br />
			{/each}
		{:else}
			<span style="opacity: 0.25; font-style: italic; margin: auto;">No messages.</span>
		{/if}
	</p>
</div>
<div class="chatButtonArea" class:chatButtonAreaInPopup={!inPanel}>
	<input
		maxlength="100"
		type="text"
		id="multiplayerMessageInput"
		placeholder="Your message..."
		bind:value={inputValue}
		onkeydown={(event) => {
			if (event.key == "Enter") {
				event.preventDefault();
				sendChat(inputValue, isTeamChat ? getTeamFromClientId(get(socket)?.id) : null);
				inputValue = "";
			}
		}}
	/>
	<button
		use:tooltip={{ text: "Send message" }}
		id="multiplayerSendButton"
		class="standardButton white"
		onclick={() => {
			playSound("basic_button");
			sendChat(inputValue, isTeamChat ? getTeamFromClientId(get(socket)?.id) : null);
			inputValue = "";
		}}
	>
		<SendHorizonal strokeWidth={2} size={22} style="margin-right: -2px; margin-top: 3px" />
	</button>
	<button
		class="standardButton white"
		use:tooltip={{ text: "Moderation" }}
		onclick={() => {
			playSound("basic_button");
			$chatManagePopup = true;
		}}
	>
		<MessageSquareWarning strokeWidth={2} size={22} style="margin-right: -2px; margin-top: 3px;" />
	</button>
</div>

<style>
	.chatButtonArea {
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
		width: 100%;
	}

	.chatButtonAreaInPopup {
		padding: var(--box-margin);
		box-sizing: border-box;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		gap: var(--box-margin);
	}

	.multiplayerChatMessages {
		width: calc(100% - 6px);
		line-height: 1.6;
		display: flex;
		overflow-y: scroll;
		scrollbar-width: none;
		flex-grow: 1;
		padding-inline: 3px;
		position: relative;
	}

	.multiplayerChatMessages p {
		margin-top: auto;
		max-width: 100%;
	}

	#multiplayerSendButton {
		padding-inline: 12px;
	}

	#multiplayerMessageInput {
		padding: var(--box-margin);
		height: 20px;
		flex-grow: 1;
		width: 0;
		overflow-x: auto;
		text-wrap: wrap;
	}
</style>

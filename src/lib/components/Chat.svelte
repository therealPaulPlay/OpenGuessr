<script>
	import { chatArray, chatMutedPlayers } from "$lib/stores/context-specific/multiplayerStore";
	import { sendChat } from "$lib/utils/chatFunctions";
	import { playSound } from "$lib/utils/soundManager";
	import RemainingGuessesDisplay from "$lib/components/RemainingGuessesDisplay.svelte";
	import { MessageSquareWarning, SendHorizonal } from "@lucide/svelte";
	import { tooltip } from "$lib/utils/tooltip";
	import { chatManagePopup } from "$lib/stores/uiStore";

	let { inPanel = true } = $props();

	let chatMessageBoxElement = $state();
	let inputValue = $state();

	// Watch for changes to chatArray and scroll to bottom automatically
	$effect(() => {
		if ($chatArray && $chatMutedPlayers && chatMessageBoxElement)
			chatMessageBoxElement.scrollTop = chatMessageBoxElement.scrollHeight;
	});
</script>

<RemainingGuessesDisplay />
<div
	class="multiplayerChatMessages of-top of-bottom"
	bind:this={chatMessageBoxElement}
	style:height={inPanel ? "calc(100% - 48px)" : "calc(100% - 50px - var(--box-margin) * 2)"}
	style:margin-bottom={inPanel ? "var(--panel-margin)" : "var(--box-margin)"}
>
	<p>
		{#if $chatArray && Array.isArray($chatArray)}
			{#each $chatArray as chat}
				{#if !$chatMutedPlayers?.includes(chat.clientId)}
					<span style="overflow-wrap: break-word;"
						><span style:opacity={chat.clientId == "server" ? 0.75 : 1}>{chat.username}:</span>
						<span style:opacity={0.75}>{chat.text}</span></span
					>
					<br />
				{/if}
			{/each}
		{/if}
	</p>
</div>
<div class="chatArea" class:chatAreaInPopup={!inPanel}>
	<input
		maxlength="100"
		type="text"
		id="multiplayerMessageInput"
		placeholder="Your message..."
		bind:value={inputValue}
		onkeydown={(event) => {
			if (event.key == "Enter") {
				event.preventDefault();
				sendChat(inputValue);
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
			sendChat(inputValue);
			inputValue = "";
		}}
	>
		<SendHorizonal strokeWidth={2} size={22} style="margin-right: -2px; margin-top: 3px" />
	</button>
	<button
		class="standardButton white"
		use:tooltip={{ text: "Manage participants" }}
		onclick={() => {
			playSound("basic_button");
			$chatManagePopup = true;
		}}
	>
		<MessageSquareWarning strokeWidth={2} size={22} style="margin-right: -2px; margin-top: 3px;" />
	</button>
</div>

<style>
	.chatArea {
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
	}

	.chatAreaInPopup {
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

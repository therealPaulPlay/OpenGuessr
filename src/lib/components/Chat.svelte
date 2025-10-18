<script>
	import { chatArray, chatMutedPlayers, chatVisible } from "$lib/stores/context-specific/multiplayerStore";
	import { sendChat } from "$lib/utils/chatFunctions";
	import { playSound } from "$lib/utils/soundManager";
	import RemainingGuessesDisplay from "$lib/components/RemainingGuessesDisplay.svelte";
	import { MessageSquareWarning, MoveVertical, SendHorizonal } from "lucide-svelte";
	import { tooltip } from "$lib/utils/tooltip";
	import { chatManagePopup } from "$lib/stores/uiStore";

	let chatMessageBoxElement = $state();
	let inputValue = $state();
	let chatHeight = $state(150); // Default height
	let isResizing = $state(false);
	let startY = $state(0);
	let startHeight = $state(0);

	// Handle mouse events for resizing
	function startResize(e) {
		isResizing = true;
		startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY; // Handle both mouse and touch events
		startHeight = chatHeight;
		if (e.type === "touchstart") e.preventDefault(); // Prevent default to stop scrolling during touch
	}

	function handleResize(e) {
		if (!isResizing) return;
		if (e.type === "touchmove") e.preventDefault(); // Prevent default to stop scrolling during touch

		// Get current position from either mouse or touch event
		const currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
		const delta = startY - currentY;
		const newHeight = Math.max(150, Math.min(500, startHeight + delta));
		chatHeight = newHeight;
	}

	function stopResize() {
		isResizing = false;
	}

	// Watch for changes to chatArray and scroll to bottom automatically
	$effect(() => {
		if ($chatArray && $chatMutedPlayers && chatMessageBoxElement)
			chatMessageBoxElement.scrollTop = chatMessageBoxElement.scrollHeight;
	});
</script>

<svelte:document onmousemove={handleResize} ontouchmove={handleResize} onmouseup={stopResize} ontouchend={stopResize} />

<div class="chatContainer" style:display={$chatVisible ? "flex" : "none"}>
	<div class="multiplayerChat barMenu" style:height="{chatHeight}px">
		<!-- svelte-ignore a11y_role_has_required_aria_props -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="resize-handle"
			onmousedown={startResize}
			ontouchstart={startResize}
			class:active={isResizing}
			role="scrollbar"
		>
			<MoveVertical size={16} strokeWidth={3} />
		</div>
		<RemainingGuessesDisplay />
		<div class="multiplayerChatMessages of-top of-bottom" bind:this={chatMessageBoxElement}>
			<p>
				{#if $chatArray}
					{#each $chatArray as chat}
						{#if !$chatMutedPlayers?.includes(chat.clientId)}
							<span style="overflow-wrap: break-word;" style:opacity={chat.clientId == "server" ? 0.75 : 1}
								>{chat.username}: {chat.text}</span
							>
							<br />
						{/if}
					{/each}
				{/if}
			</p>
		</div>
		<div class="bottomMultiplayerChatArea">
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
	</div>
</div>

<style>
	.multiplayerChat {
		width: 100%;
		min-height: 150px;
		max-height: 500px;
		overflow: hidden;
		display: block !important;
		padding: var(--panel-margin);
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		transition: opacity 250ms ease;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 36px;
		cursor: ns-resize;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--panel-color);
		color: white;
		opacity: 0;
		z-index: 2;
		transition: opacity 250ms ease;
		box-shadow: var(--button-shadow);
		backdrop-filter: blur(10px);
	}

	.resize-handle:hover,
	.resize-handle.active {
		opacity: 1;
	}

	.chatContainer {
		left: 10px;
		bottom: 74px;
		z-index: 10;
		position: fixed;
		height: fit-content;
		width: 300px;
		gap: 8px;
	}

	.bottomMultiplayerChatArea {
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
	}

	.multiplayerChatMessages {
		width: calc(100% - 6px);
		line-height: 1.6;
		display: flex;
		overflow-y: scroll;
		scrollbar-width: none;
		height: calc(100% - 48px);
		padding-inline: 3px;
		margin-bottom: 8px;
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
		padding: 10px;
		height: 20px;
		flex-grow: 1;
		width: 0;
		overflow-x: auto;
		text-wrap: wrap;
	}

	@media all and (max-width: 1200px) {
		.multiplayerChat {
			display: none !important;
		}
	}
</style>

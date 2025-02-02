<script>
	import { chatArray, chatVisible } from "$lib/stores/context-specific/multiplayerStore";
	import { manuallySendChat } from "$lib/utils/chatFunctions";
	import { playSound } from "$lib/utils/soundManager";
	import RemainingGuessesDisplay from "$lib/components/RemainingGuessesDisplay.svelte";
	import { MoveVertical, SendHorizonal } from "lucide-svelte";

	let multiplayerChatMessages = $state();
	let inputValue = $state();
	let chatHeight = $state(150); // Default height
	let isResizing = $state(false);
	let startY = $state(0);
	let startHeight = $state(0);

	// Handle mouse events for resizing
	function startResize(e) {
		isResizing = true;
		// Handle both mouse and touch events
		startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
		startHeight = chatHeight;

		// Add both mouse and touch event listeners
		document.addEventListener("mousemove", handleResize);
		document.addEventListener("touchmove", handleResize, { passive: false });
		document.addEventListener("mouseup", stopResize);
		document.addEventListener("touchend", stopResize);

		// Prevent default touch behavior to avoid scrolling
		if (e.type === "touchstart") e.preventDefault();
	}

	function handleResize(e) {
		if (!isResizing) return;
		// Prevent default to stop scrolling during touch
		if (e.type === "touchmove") e.preventDefault();

		// Get current position from either mouse or touch event
		const currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
		const delta = startY - currentY;
		const newHeight = Math.max(150, Math.min(500, startHeight + delta));
		chatHeight = newHeight;
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener("mousemove", handleResize);
		document.removeEventListener("mouseup", stopResize);
		document.removeEventListener("mouseup", stopResize);
		document.removeEventListener("touchend", stopResize);
	}

	chatArray.subscribe((value) => {
		try {
			if (multiplayerChatMessages) {
				setTimeout(() => {
					multiplayerChatMessages.scrollTop = multiplayerChatMessages.scrollHeight;
				}, 150);
			}
		} catch (error) {
			console.error("Error setting chat box scroll value:", error);
		}
	});
</script>

<div class="chatContainer" style:display={$chatVisible ? "flex" : "none"}>
	<div id="multiplayerChat" style:height="{chatHeight}px">
		<!-- svelte-ignore a11y_role_has_required_aria_props -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="resize-handle"
			onmousedown={startResize}
			ontouchstart={startResize}
			class:active={isResizing}
			role="scrollbar"
		>
			<MoveVertical size={16} />
		</div>
		<RemainingGuessesDisplay />
		<div id="multiplayerChatMessages" bind:this={multiplayerChatMessages}>
			<p id="multiplayerMessageBox" contenteditable="false">
				{#if $chatArray}
					{#each $chatArray as chat}
						{#if chat.startsWith("System")}
							<span style="opacity: 0.75">{chat}</span>
						{:else}
							{chat}
						{/if}
						<br />
					{/each}
				{/if}
			</p>
		</div>
		<div id="bottomMultiplayerChatArea">
			<input
				maxlength="100"
				type="text"
				id="multiplayerMessageInput"
				placeholder="Type your message..."
				bind:value={inputValue}
				onkeydown={(event) => {
					if (event.key == "Enter") {
						event.preventDefault();
						manuallySendChat(inputValue);
						inputValue = "";
					}
				}}
			/>
			<button
				id="multiplayerSendButton"
				class="standardButton"
				onclick={() => {
					playSound("basic_button");
					manuallySendChat(inputValue);
					inputValue = "";
				}}
			>
				<SendHorizonal strokeWidth={2.5} size={22} style="margin-right: -2px; margin-top: 2px" />
			</button>
		</div>
	</div>
</div>

<style>
	#multiplayerChat {
		width: 100%;
		min-height: 150px;
		max-height: 500px;
		border-radius: 10px;
		overflow: hidden;
		flex-direction: column;
		align-items: center;
		display: flex;
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
		font-size: 20px;
		position: relative;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 35px;
		cursor: ns-resize;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--box-color);
		backdrop-filter: blur(20px);
		color: white;
		opacity: 0;
		z-index: 2;
		transition: opacity 250ms ease;
	}

	.resize-handle:hover,
	.resize-handle.active {
		opacity: 1;
	}

	.chatContainer {
		left: 10px;
		bottom: 76px;
		justify-content: flex-end;
		align-items: center;
		z-index: 10;
		position: fixed;
		height: fit-content;
		flex-direction: column;
		width: 300px;
		gap: 8px;
	}

	#bottomMultiplayerChatArea {
		display: flex;
		justify-content: space-around;
		align-items: center;
		width: 100%;
	}

	#multiplayerChatMessages {
		height: 100%;
		width: 100%;
		overflow-y: scroll;
		display: flex;
		scrollbar-width: none;
		flex-direction: column;
		margin-top: 5px;
	}

	#multiplayerMessageBox {
		color: white;
		margin: 10px;
		line-height: 1.7;
		margin-top: auto;
		font-size: 20px;
	}

	#multiplayerSendButton {
		height: 38px;
		margin: 8px;
		margin-left: 8px;
		padding-inline: 12px;
	}

	#multiplayerMessageInput {
		padding: 10px;
		border: none;
		border-radius: 5px;
		font-size: 20px;
		height: 17px;
		overflow: scroll;
		text-wrap: wrap;
		flex-grow: 1;
		margin: 8px;
		margin-right: 0px;
	}

	@media all and (max-width: 1200px) {
		#multiplayerChat {
			display: none;
		}
	}
</style>

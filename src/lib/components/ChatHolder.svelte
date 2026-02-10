<script>
	import { chatVisible } from "$lib/stores/context-specific/multiplayerStore";
	import { MoveVertical } from "@lucide/svelte";
	import Chat from "./Chat.svelte";
	import ChatTabSwitcher from "./ChatTabSwitcher.svelte";

	const CHAT_DEFAULT_HEIGHT = 194;
	const CHAT_MAX_HEIGHT = 508;

	let chatHeight = $state(CHAT_DEFAULT_HEIGHT); // Default height
	let isResizing = $state(false);
	let startY = $state(0);
	let startHeight = $state(0);
	let isTeamChat = $state(false);

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
		const newHeight = Math.max(CHAT_DEFAULT_HEIGHT, Math.min(CHAT_MAX_HEIGHT, startHeight + delta));
		chatHeight = newHeight;
	}

	function stopResize() {
		isResizing = false;
	}
</script>

<svelte:document onmousemove={handleResize} ontouchmove={handleResize} onmouseup={stopResize} ontouchend={stopResize} />

{#if $chatVisible}
	<div class="chat-holder">
		<ChatTabSwitcher bind:isTeamChat inPanel={true} />
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div class="multiplayer-chat barMenu" style:height="{chatHeight}px" style:min-height="{CHAT_DEFAULT_HEIGHT}px" style:max-height="{CHAT_MAX_HEIGHT}px">
			<!-- svelte-ignore a11y_role_has_required_aria_props -->
			<div
				class="resize-handle"
				onmousedown={startResize}
				ontouchstart={startResize}
				class:active={isResizing}
				role="scrollbar"
			>
				<MoveVertical size={16} strokeWidth={3} />
			</div>
			<Chat {isTeamChat} />
		</div>
	</div>
{/if}

<style>
	.chat-holder {
		left: 10px;
		bottom: 76px;
		z-index: 10;
		position: fixed;
		height: fit-content;
		width: 300px;
		gap: var(--panel-margin);
	}

	.multiplayer-chat {
		width: 100%;
		overflow: hidden;
		flex-direction: column;
		box-sizing: border-box;
		transition: none;
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

	/* Hide on mobile */
	@media (orientation: portrait) and (max-width: 800px) {
		.chat-holder {
			display: none !important;
		}
	}
</style>

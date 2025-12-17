<script>
	import { chatVisible } from "$lib/stores/context-specific/multiplayerStore";
	import { MoveVertical } from "@lucide/svelte";
	import Chat from "./Chat.svelte";

	let chatHeight = $state(172); // Default height
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
		const newHeight = Math.max(172, Math.min(500, startHeight + delta));
		chatHeight = newHeight;
	}

	function stopResize() {
		isResizing = false;
	}
</script>

<svelte:document onmousemove={handleResize} ontouchmove={handleResize} onmouseup={stopResize} ontouchend={stopResize} />

<div class="chatHolder" style:display={$chatVisible ? "flex" : "none"}>
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div class="multiplayerChat barMenu" style:height="{chatHeight}px">
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
		<Chat />
	</div>
</div>

<style>
	.chatHolder {
		left: 10px;
		bottom: 74px;
		z-index: 10;
		position: fixed;
		height: fit-content;
		width: 300px;
		gap: var(--panel-margin);
	}

	.multiplayerChat {
		width: 100%;
		min-height: 172px;
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

	/* Hide on mobile */
	@media (orientation: portrait) and (max-width: 800px) {
		.multiplayerChat {
			display: none !important;
		}
	}
</style>

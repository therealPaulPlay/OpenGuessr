<!-- Used for the singleplayer timer countdown -->
<script>
	import {
		timerCountdownOverlay,
		timerCountdownOverlayTitle,
	} from "$lib/stores/context-specific/timerCountdownOverlayStore";
	import { inMenu } from "$lib/stores/uiStore";
	import { fade } from "svelte/transition";
</script>

{#if $timerCountdownOverlay && !$inMenu}
	<div transition:fade={{ duration: 150 }} id="timer-countdown">
		<h1>{$timerCountdownOverlayTitle}</h1>
	</div>
{/if}

<style>
	#timer-countdown {
		position: fixed;
		inset: 0;
		z-index: 3;
		overflow: hidden;
		backdrop-filter: blur(var(--strong-blur));
		background-color: rgba(0, 0, 0, 0.2);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		user-select: none;
	}

	#timer-countdown h1 {
		font-size: 75px;
		text-shadow: 2px 2px 15px var(--dark-shadow-color);
		margin-bottom: var(--layout-margin);
	}

	@media all and (max-width: 1200px) {
		#timer-countdown h1 {
			font-size: 45px;
		}
	}
</style>

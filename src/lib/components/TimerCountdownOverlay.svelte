<!-- Used for the singleplayer timer countdown -->
<script>
	import { page } from "$app/state";
	import {
		timerCountdownOverlay,
		timerCountdownOverlayTitle,
	} from "$lib/stores/context-specific/timerCountdownOverlayStore";
	import { fade } from "svelte/transition";
</script>

{#if $timerCountdownOverlay}
	<div transition:fade={{ duration: 150 }} id="timerCountdown" style:display={page.url.pathname !== "/" ? "none" : ""}>
		<h1>{$timerCountdownOverlayTitle}</h1>
	</div>
{/if}

<style>
	#timerCountdown {
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

	#timerCountdown h1 {
		font-size: 75px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: var(--layout-margin);
	}

	@media all and (max-width: 1200px) {
		#timerCountdown h1 {
			font-size: 45px;
		}
	}
</style>

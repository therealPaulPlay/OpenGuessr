<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { loadingScreenVisible } from "$lib/stores/uiStore";
</script>

<div
	class="loadingOverlay"
	style:opacity={$loadingScreenVisible || $resultScreenEnabled ? "100%" : "0%"}
	style:transition={$resultScreenEnabled ? "none" : "opacity 150ms ease"}
>
	<img src="/img/compass_spinner.png" alt="Loading new streetview" class="spinner" />
</div>

<style>
	.loadingOverlay {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		opacity: 0%;
		pointer-events: none;
		background-color: #11121f;
		position: fixed;
		inset: 0 0 0 0; /* Top, right, bottom, left */
		z-index: 6;
		box-shadow: 0 0 500px rgba(165, 176, 251, 0.25) inset;
	}
</style>

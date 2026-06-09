<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { loadingScreenVisible } from "$lib/stores/uiStore";
	import { fade } from "svelte/transition";
</script>

{#if $loadingScreenVisible || $resultScreenEnabled}
	<div class="loading-overlay" transition:fade={{ duration: 150 }}>
		<img src="/img/compass_spinner.png" fetchpriority="high" alt="Loading" class="spinner" />
	</div>
{/if}

<style>
	.loading-overlay {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		pointer-events: none;
		background-color: #11121f;
		position: fixed;
		inset: 0 0 0 0; /* Top, right, bottom, left */
		z-index: 6;
		box-shadow: 0 0 500px rgba(165, 176, 251, 0.25) inset;
	}
</style>

<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { inMenu, loadingScreenVisible } from "$lib/stores/uiStore";
	import { quadOut } from "svelte/easing";
	import { fade } from "svelte/transition";

	let initialPageLoad = $state(true); // Only true for the first location that gets loaded with the page

	$effect(() => {
		if (!$loadingScreenVisible && initialPageLoad) initialPageLoad = false;
	});
</script>

{#if $loadingScreenVisible || $resultScreenEnabled}
	<div
		class="loading-overlay"
		transition:fade={{
			duration: initialPageLoad ? 500 : 150,
			delay: initialPageLoad ? 500 : undefined,
			easing: initialPageLoad ? quadOut : undefined,
		}}
	>
		{#if !$inMenu}
			<img src="/img/compass_spinner.png" fetchpriority="high" alt="Loading" class="spinner" transition:fade />
		{/if}
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

<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { inMenu, loadingScreenVisible } from "$lib/stores/uiStore";
	import { quadOut } from "svelte/easing";
	import { fade } from "svelte/transition";
	import { LoadingSpinner } from "openguessr-ui";

	let initialPageLoad = $state(true); // Only true for the first location that gets loaded with the page
	$effect(() => {
		if (!$loadingScreenVisible && initialPageLoad) initialPageLoad = false;
	});
</script>

{#if $loadingScreenVisible || $resultScreenEnabled}
	<!-- Only fade slowly when launched to the main menu (e.g.resultScreenEnabled not for ?play-map)-->
	{const slowInitialFade = $derived(initialPageLoad && $inMenu)}
	<div
		class="loading-overlay"
		transition:fade={{
			duration: slowInitialFade ? 500 : 150,
			delay: slowInitialFade ? 500 : undefined,
			easing: slowInitialFade ? quadOut : undefined,
		}}
	>
		{#if !$inMenu}
			<div style:display="flex" transition:fade={{ duration: 150 }}>
				<LoadingSpinner />
			</div>
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

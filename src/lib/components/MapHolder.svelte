<script>
	let { children } = $props();
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { mapHovered } from "$lib/stores/context-specific/mapStore";
</script>

<div id="map-holder" class="map-holder safe-margin-bottom" class:map-hover={$mapHovered} class:map-holder-to-result={$resultScreenEnabled}>
	{@render children?.()}
</div>

<style>
	.map-holder {
		position: fixed;
		display: flex;
		right: 70px;
		bottom: 76px;
		align-items: flex-end;
		flex-direction: column;
		z-index: 9;
		pointer-events: none;
		width: max(20%, calc(200px + var(--panel-margin) * 2));
		transition:
			width 150ms ease,
			bottom 150ms ease,
			right 150ms ease,
			opacity 250ms ease;
	}

	.map-hover {
		width: 55%;
	}

	/* map holder class on result screen */
	:global(.map-holder-to-result) {
		bottom: 0 !important;
		right: 0 !important;
		left: 0 !important;
		margin: 0 !important;
		z-index: 12 !important;
		width: 100% !important;
		height: 100% !important;
		opacity: 100% !important;
		visibility: visible !important;
		transition: none !important;
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.map-holder {
			width: 100%;
			right: 0;
			bottom: 0;
			z-index: 10;
			margin-bottom: 0 !important;
		}
	}
</style>

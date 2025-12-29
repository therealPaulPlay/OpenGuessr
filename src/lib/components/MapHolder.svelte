<script>
	let { children } = $props();
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { mapHovered } from "$lib/stores/context-specific/mapStore";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
</script>

<div
	id="map-holder"
	class="regular-map-size map-holder"
	class:map-hover={$mapHovered}
	class:map-holder-to-result={$resultScreenEnabled}
	class:map-holder-ad-shift={!$adsDisabled}
>
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
	}

	.regular-map-size {
		width: max(20%, 216px);
		height: max(23%, 150px);
		transition:
			height 150ms ease,
			width 150ms ease,
			opacity 250ms ease;
	}

	.map-hover {
		width: 55%;
		height: 55%;
	}

	/* map Holder class on result screen */
	:global(.map-holder-to-result) {
		bottom: 0 !important;
		right: 0 !important;
		left: 0 !important;
		padding-inline: 0 !important;
		z-index: 12 !important;
		width: 100% !important;
		height: 100% !important;
		opacity: 100% !important;
		visibility: visible !important;
		border-radius: 0 !important;
		transition: none !important;
	}

	:global(.mapHolderToResult #floatingMapButton) {
		display: none !important;
	}

	@media (orientation: portrait) and (max-width: 800px) {
		/* Shift up to fit ad */
		.map-holder-ad-shift {
			bottom: 136px;
		}

		.map-holder {
			height: 50%;
			width: calc(100% - calc(var(--box-margin) * 2));
			right: var(--box-margin) !important;
		}
	}

	@media (pointer: coarse) {
		.map-holder {
			min-height: 250px;
		}
	}
</style>

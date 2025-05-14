<script>
	let { children } = $props();
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { mapHovered } from "$lib/stores/context-specific/mapStore";
	import { supporterLevel } from "$lib/stores/accountStore";
	import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
</script>

<div
	id="mapHolder"
	class="regularMapSize mapHolder"
	class:mapHover={$mapHovered}
	class:mapHolderToResult={$resultScreenEnabled}
	class:mapHolderAdShift={$supporterLevel < 2 && !$adsDisabled}
>
	{@render children?.()}
</div>

<style>
	.mapHolder {
		position: fixed;
		display: flex;
		right: 70px;
		bottom: 76px;
		min-width: 216px;
		min-height: 150px;
		align-items: flex-end;
		flex-direction: column;
		z-index: 9;
		pointer-events: none;
	}

	.regularMapSize {
		width: 20%;
		height: 20%;
		transition:
			height 150ms ease,
			width 150ms ease,
			opacity 250ms ease,
			margin 250ms ease;
	}

	/* map Holder class on result screen */
	:global(.mapHolderToResult) {
		bottom: 0 !important;
		right: 0 !important;
		left: 0 !important;
		padding-inline: 0 !important;
		z-index: 12 !important;
		width: 100% !important;
		height: 100% !important;
		margin: 0 !important;
		opacity: 100% !important;
		visibility: visible !important;
		border-radius: 0 !important;
		transition: none !important;
	}

	:global(.mapHolderToResult #floatingMapButton) {
		display: none !important;
	}

	@media all and (orientation: landscape) and (max-width: 1200px) {
		.mapHolder {
			width: 25%;
			height: 25%;
		}
	}

	.mapHover {
		width: 55%;
		height: 55%;
	}

	@media (orientation: portrait) and (max-width: 1200px) {
		.mapHolder {
			height: 50%;
			width: calc(100% - calc(var(--box-margin) * 2));
			right: var(--box-margin) !important;
		}
	}

	/* Shift up to fit ad */
	@media (orientation: portrait) and (max-width: 800px) {
		.mapHolderAdShift {
			bottom: 134px;
		}
	}
</style>

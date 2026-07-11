<script>
	import { mapExpanded, mapHovered, map } from "$lib/stores/context-specific/mapStore";
	import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { isElementClickable } from "$lib/utils/checkIfElementIsClickable";
	import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
	import { initMap } from "$lib/logic/miniMap";
	import { get } from "svelte/store";
	import { onMount } from "svelte";
	import { MediaQuery } from "svelte/reactivity";
	import { countryGuessr } from "$lib/stores/modeStore";

	let mapElement = $state();
	let mapResizeObserver;
	let mapResizeTimeout;
	let lastPointerType = $state("mouse");
	let mapOpen = $derived($mapExpanded && (!$countryGuessr || $resultScreenEnabled));

	const mobilePortrait = new MediaQuery("(orientation: portrait) and (max-width: 800px)");

	function handleMapHover() {
		if (lastPointerType === "touch") return;
		clearTimeout(mapResizeTimeout);
		mapHovered.set(true);
	}

	function handleMapUnhover() {
		if (lastPointerType === "touch") return;
		mapResizeTimeout = setTimeout(() => {
			mapHovered.set(false);
		}, 250);
	}

	onMount(async () => {
		await import("leaflet");
		initMap();
		mapResizeObserver = new ResizeObserver(() => get(map)?.invalidateSize());
		mapResizeObserver.observe(mapElement);

		return () => mapResizeObserver?.disconnect();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	id="map"
	role="region"
	tabindex="0"
	onkeyup={(event) => {
		// Allow for pressing the space bar to guess
		if (event.key === " " && get(confirmButtonActive) && isElementClickable(mapElement)) {
			event.stopPropagation();
			confirmButtonClicks();
		}
	}}
	onpointerover={(event) => {
		lastPointerType = event.pointerType;
	}}
	onmouseenter={handleMapHover}
	onmouseleave={handleMapUnhover}
	bind:this={mapElement}
	style:height={mapOpen ? (mobilePortrait.current ? "35dvh" : $mapHovered ? "55dvh" : "max(18dvh, 150px)") : "0"}
	style:margin-top={mapOpen ? undefined : "calc(var(--box-margin) * -1)"}
	class:map-full-opacity-result={Boolean($resultScreenEnabled)}
></div>

<style>
	#map {
		cursor: crosshair;
		pointer-events: auto;
		width: 100%;
		opacity: 60%;
		z-index: 0; /* Ensure all map tiles stay in this stacking context on z-0 */
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		border-top-right-radius: var(--box-margin);
		border-top-left-radius: var(--box-margin);
		background: #e8e4dc;
		box-shadow: 0 2px 20px rgba(5, 6, 10, 0.15);
		transition:
			opacity 250ms ease,
			border-radius 150ms ease,
			margin-top 150ms ease,
			top 150ms ease,
			height 150ms ease;
		overflow: hidden;
		outline: none;
	}

	#map:hover {
		opacity: 100%;
	}

	/* On mobile, the map doesn't fade out if it's not being hovered over */
	@media (orientation: portrait) and (max-width: 800px) {
		#map {
			opacity: 100%;
		}
	}

	.map-full-opacity-result {
		opacity: 1 !important;
		border-radius: 0 !important;
		top: -60px;
		position: fixed !important;
		height: calc(100dvh + 60px) !important;
		transition: none !important;
	}

	:global(.leaflet-bottom, .leaflet-control-attribution) {
		display: none;
	}

	/* Smoother zoom animation compared to default cubic-bezier */
	:global(.leaflet-zoom-anim .leaflet-zoom-animated) {
		transition: transform 0.25s linear !important;
	}

	:global(.leaflet-tooltip) {
		padding: 1px;
		padding-inline: 6px;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
		margin-top: -18px;
	}

	:global(.leaflet-tooltip-right) {
		margin-left: 22px !important;
	}

	:global(.leaflet-interactive) {
		cursor: crosshair !important;
	}

	:global(.gm-style .gm-style-iw) {
		font-size: 16px;
		text-align: center;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding-bottom: 0;
		padding-inline: 0;
		padding-right: var(--layout-margin);
	}

	:global(.gm-style-iw-ch) {
		display: none;
	}

	:global(.gm-style iframe + div) {
		border: none !important;
	}

	:global(.gm-style-iw-d) {
		overflow: visible !important;
		margin-right: 20px !important;
	}

	:global(.leaflet-control-layers-toggle) {
		background-image: url("/img/map_layer_icon.png") !important;
		background-size: 23px 23px !important;
	}

	:global(.leaflet-control-layers-list) {
		padding-inline: var(--panel-margin);
		padding-bottom: 3px;
	}

	:global(.leaflet-control-layers-selector[type="radio"]) {
		appearance: none;
		box-sizing: border-box;
		box-shadow: none;
		margin-right: var(--content-margin);
		width: 16px;
		height: 16px;
		border: 2px solid white;
		border-radius: 50%;
		display: inline-grid;
		place-content: center;
		vertical-align: middle;
		background-color: transparent;
		transition: background-color 250ms ease;
	}

	:global(.leaflet-control-layers-selector[type="radio"]:hover) {
		background-color: var(--box-color-dark);
	}

	:global(.leaflet-control-layers-selector[type="radio"]::before) {
		content: "";
		width: 8px;
		height: 8px;
		border-radius: 100%;
		background-color: var(--brand-color);
		opacity: 0;
		transition: opacity 250ms ease;
	}

	:global(.leaflet-control-layers-selector[type="radio"]:checked::before) {
		opacity: 1;
	}

	:global(.leaflet-touch .leaflet-control-layers) {
		border: none !important;
		margin: var(--box-margin);
	}

	:global(.leaflet-control-layers) {
		background-color: var(--panel-color) !important;
		box-shadow: var(--button-shadow) !important;
		backdrop-filter: blur(var(--weak-blur)) !important;
		color: white !important;
	}

	:global(.leaflet-touch .leaflet-control-layers-toggle) {
		width: 35px !important;
		height: 35px !important;
	}

	:global(.leaflet-control-layers-selector) {
		top: -2px !important;
	}

	:global(.leaflet-control-layers-base) {
		font-size: 18px !important;
		line-height: 30px !important;
	}
</style>

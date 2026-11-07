<script>
	import { mapExpanded, mapHovered } from "$lib/stores/context-specific/mapStore";
	import { playSound } from "$lib/utils/soundManager";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { ArrowDown, ArrowDownRight, ArrowUpLeft } from "@lucide/svelte";
	import { blur } from "svelte/transition";
	import { countryGuessr } from "$lib/stores/modeStore";
	import { inMenu } from "$lib/stores/uiStore";
	import { MAP_SIZE_TRANSITION_DURATION } from "./Map.svelte";

	let { children } = $props();

	let toggleMapButton = $state();
</script>

<div class="toggle-container">
	{#if !$resultScreenEnabled && !$countryGuessr && $mapExpanded && !$inMenu}
		<div class="floating-close-container">
			{@render children?.()}
			<div class="bar-menu floating-map-close-menu" transition:blur={{ duration: MAP_SIZE_TRANSITION_DURATION }}>
				<button
					class="standard-button bright floating-button"
					aria-label="Toggle minimap"
					bind:this={toggleMapButton}
					onclick={() => {
						mapExpanded.set(false);
						playSound("toggle_button");
					}}
				>
					<ArrowDown strokeWidth={2.25} size={22} />
				</button>
			</div>
		</div>
		<div class="resize-handle bar-menu">
			<button
				class="standard-button bright center-button"
				aria-label="Resize minimap"
				onclick={() => {
					playSound("basic_button");
					mapHovered.set(!$mapHovered);
				}}
			>
				{#if !$mapHovered}
					<ArrowUpLeft strokeWidth={2.25} size={22} />
				{:else}
					<ArrowDownRight strokeWidth={2.25} size={22} />
				{/if}
			</button>
		</div>
	{/if}
</div>

<style>
	.resize-handle {
		margin-right: auto;
		margin-bottom: var(--box-margin);
	}

	.center-button {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.floating-map-close-menu {
		display: none;
		pointer-events: auto;
		margin-left: auto;
		margin-right: var(--box-margin);
		gap: var(--box-margin);
	}

	.toggle-container {
		margin-top: auto;
		width: 100%;
	}

	.floating-close-container {
		display: flex;
		gap: var(--box-margin);
		width: 100%;
	}

	.floating-button {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.floating-map-close-menu {
			display: block;
		}
		.floating-close-container {
			margin-bottom: var(--box-margin);
		}
		.resize-handle {
			display: none;
		}
	}

	@media (pointer: fine) {
		.resize-handle {
			display: none;
		}
	}
</style>

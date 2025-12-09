<script>
	import { onMount } from "svelte";
	import { mapExpanded, mapHovered } from "$lib/stores/context-specific/mapStore";
	import { get } from "svelte/store";
	import { playSound } from "$lib/utils/soundManager";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { ArrowDown, X, ArrowDownRight, ArrowUpLeft } from "@lucide/svelte";
	import { blur } from "svelte/transition";
	import { countryGuessr } from "$lib/stores/modeStore";

	let toggleMapButton = $state();
</script>

<div class="toggle-container">
	{#if !$resultScreenEnabled && !$countryGuessr && $mapExpanded}
		<div class="barMenu floatingMapCloseMenu" transition:blur={{ duration: 250 }}>
			<button
				class="standardButton white floatingButton"
				bind:this={toggleMapButton}
				onclick={() => {
					mapExpanded.set(false);
					playSound("floating_button");
				}}
			>
				<ArrowDown strokeWidth={2.25} size={22} />
			</button>
		</div>
		<div class="resize-handle barMenu">
			<button
				class="standardButton white centerButton"
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
		margin-bottom: var(--panel-margin);
	}

	.centerButton {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.floatingMapCloseMenu {
		display: none;
		pointer-events: auto;
		margin-left: auto;
		margin-bottom: var(--panel-margin);
	}

	.toggle-container {
		margin-top: auto;
		width: 100%;
	}

	.floatingButton {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (orientation: portrait) and (max-width: 800px) {
		.floatingMapCloseMenu {
			display: block;
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

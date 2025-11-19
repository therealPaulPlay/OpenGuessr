<script>
	import { onMount } from "svelte";
	import { mapExpanded, mapHovered } from "$lib/stores/context-specific/mapStore";
	import { get } from "svelte/store";
	import { playSound } from "$lib/utils/soundManager";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { ArrowDown, X } from "lucide-svelte";
	import { blur } from "svelte/transition";
	import { countryGuessr } from "$lib/stores/modeStore";
	import { ArrowDownRight, ArrowUpLeft } from "lucide-svelte";

	let toggleMapButton = $state();
</script>

<div class="marginTop">
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
			<button class="standardButton white centerButton" onclick={() => mapHovered.set(!$mapHovered)}>
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
		margin-bottom: var(--box-margin);
		margin-right: auto;
	}

	.centerButton {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.floatingMapCloseMenu {
		margin-bottom: var(--box-margin);
		display: none;
		pointer-events: auto;
		margin-left: auto;
	}

	.marginTop {
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

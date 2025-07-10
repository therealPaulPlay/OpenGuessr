<script>
	import { onMount } from "svelte";
	import { mapExpanded } from "$lib/stores/context-specific/mapStore";
	import { get } from "svelte/store";
	import { playSound } from "$lib/utils/soundManager";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { ArrowDown, X } from "lucide-svelte";
	import { blur } from "svelte/transition";
	import { countryGuessr } from "$lib/stores/modeStore";

	let toggleMapButton = $state();
</script>

<div class="marginTop">
	{#if $mapExpanded && !$resultScreenEnabled && !$countryGuessr}
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
	{/if}
</div>

<style>
	.floatingMapCloseMenu {
		margin-bottom: var(--box-margin);
		display: none;
		pointer-events: auto;
	}

	.marginTop {
		margin-top: auto;
	}

	.floatingButton {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (orientation: portrait) and (max-width: 1200px) {
		.floatingMapCloseMenu {
			display: flex;
		}
	}
</style>

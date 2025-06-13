<script>
	import { onMount } from "svelte";
	import { mapExpanded, mapVisible } from "$lib/stores/context-specific/mapStore";
	import { get } from "svelte/store";
	import { playSound } from "$lib/utils/soundManager";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	let toggleMapButton = $state();

	function toggleMapClick() {
		mapExpanded.set(!get(mapExpanded)); // Invert mapExpandedp
		playSound("floating_button");
	}

	onMount(() => {
		window.addEventListener("resize", (event) => {
			if (window.innerHeight < window.innerWidth) mapExpanded.set(true); // If changed to landscape, expand the map again
		});
	});
</script>

<div
	class="floatingMapButton"
	style:visibility={$mapVisible && !$resultScreenEnabled ? "visible" : "hidden"}
	style={$mapExpanded ? "margin-bottom: var(--box-margin);" : ""}
>
	<button
		class="standardButton white floatingButtonColor"
		bind:this={toggleMapButton}
		onclick={toggleMapClick}
	>
		<img id="toggleMapImage" src="/img/map_icon.png" alt="Toggle Minimap." />
	</button>
</div>

<style>
	.floatingMapButton {
		display: none;
		pointer-events: auto;
		margin-top: auto;
		z-index: 10;
		padding: var(--panel-margin);
		border-radius: 10px;
		color: white;
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		align-items: center;
		max-height: 60px;
	}

	.floatingButtonColor {
		height: unset;
	}

	#toggleMapImage {
		width: 28px;
		height: 28px;
		padding-top: 5px;
		border-radius: 5px;
	}

	@media (orientation: portrait) and (max-width: 1200px) {
		.floatingMapButton {
			display: flex;
		}
	}
</style>

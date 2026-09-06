<!-- The IFrame that the StreetView / Panorama is in -->
<script>
	import { iframeElement, panoramaSrc } from "$lib/stores/locationStore";
	import { panoramaFilter, nmpz } from "$lib/stores/context-specific/restrictionStore";

	let { onload } = $props();
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<iframe
	id="panorama-iframe"
	referrerpolicy="no-referrer-when-downgrade"
	style:filter={$panoramaFilter || "none"}
	style:pointer-events={$nmpz ? "none" : ""}
	frameborder="0"
	{onload}
	bind:this={$iframeElement}
	src={$panoramaSrc}
></iframe>

<style>
	#panorama-iframe {
		transition: all 250ms;
		background-color: var(--panorama-background);
		user-select: none;
		position: fixed;
		top: -75px; /* Cut off the name display area in the SV */
		left: 0;
		bottom: 0;
		right: 0;
		width: 100%;
		height: calc(100% + 75px);
		border: none;
		z-index: 0;
	}
</style>

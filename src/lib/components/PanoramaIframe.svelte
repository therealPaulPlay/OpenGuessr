<!-- The IFrame that the StreetView / Panorama is in -->
<script>
	import { iframeElement, panoramaSrc } from "$lib/stores/locationStore";
	import { panoramaFilter, nmpz } from "$lib/stores/context-specific/restrictionStore";

	let { onload, zoomScale = 1 } = $props();
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<iframe
	id="panorama-iframe"
	referrerpolicy="no-referrer-when-downgrade"
	style:filter={$panoramaFilter || "none"}
	style:pointer-events={$nmpz ? "none" : ""}
	style:scale={zoomScale}
	frameborder="0"
	{onload}
	bind:this={$iframeElement}
	src={$panoramaSrc}
></iframe>

<style>
	#panorama-iframe {
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
		transition: scale 400ms cubic-bezier(0.25, 1, 0.5, 1);
	}
</style>

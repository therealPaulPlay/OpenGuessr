<!-- The IFrame that the StreetView / Panorama is in -->
<script>
	import { iframeElement, initialIframeLoad, panoramaSrc } from "$lib/stores/locationStore";
	import NmpzPanorama from "$lib/components/PanoramaCustomViewer.svelte";
	import { loadingScreenVisible } from "$lib/stores/uiStore";
	import { checkStartSingleplayerTimer } from "$lib/utils/singleplayerTimer";
	import { checkStartCompetitionTimer } from "$lib/logic/competitionLogic";
	import { panoramaFilter, nmpz } from "$lib/stores/context-specific/restrictionStore";

	const handleLoad = () => {
		if ($initialIframeLoad) {
			try {
				// Start non-multiplayer timers after iframe load (to ensure short timer values work fairly)
				checkStartSingleplayerTimer();
				checkStartCompetitionTimer();
			} catch (error) {
				console.error("Error in panorama load callback:", error);
			}
		}

		initialIframeLoad.set(false);

		setTimeout(function () {
			$loadingScreenVisible = false;
		}, 300);
	};

	// Custom viewer state -------------------------------------------------

	// When the custom panorama viewer fails, fall back to the iFrame
	let tileViewerFailed = $state(false);

	// Reset every new round
	$effect(() => {
		$panoramaSrc;
		tileViewerFailed = false;
	});
</script>

{#if $nmpz && !tileViewerFailed}
	<NmpzPanorama onload={handleLoad} onfail={() => (tileViewerFailed = true)} />
{:else}
	<!-- svelte-ignore a11y_missing_attribute -->
	<iframe
		id="panorama-iframe"
		referrerpolicy="no-referrer-when-downgrade"
		style:filter={$panoramaFilter || "none"}
		style:pointer-events={$nmpz ? "none" : ""}
		frameborder="0"
		onload={handleLoad}
		bind:this={$iframeElement}
		src={$panoramaSrc}
	></iframe>
{/if}

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

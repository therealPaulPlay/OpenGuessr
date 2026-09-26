<script>
	import PanoramaIframe from "$lib/components/PanoramaIframe.svelte";
	import PanoramaCustomViewer from "$lib/components/PanoramaCustomViewer.svelte";
	import { initialPanoramaLoad, panoramaSrc } from "$lib/stores/locationStore";
	import { inMenu, loadingScreenVisible } from "$lib/stores/uiStore";
	import { innerWidth, innerHeight } from "svelte/reactivity/window";
	import { checkStartSingleplayerTimer } from "$lib/utils/singleplayerTimer";
	import { checkStartCompetitionTimer } from "$lib/logic/competitionLogic";
	import { nmpz } from "$lib/stores/context-specific/restrictionStore";

	const handleLoad = () => {
		if ($initialPanoramaLoad) {
			try {
				// Start non-multiplayer timers after iframe load (to ensure short timer values work fairly)
				checkStartSingleplayerTimer();
				checkStartCompetitionTimer();
			} catch (error) {
				console.error("Error in panorama load callback:", error);
			}
		}

		initialPanoramaLoad.set(false);

		setTimeout(function () {
			$loadingScreenVisible = false;
		}, 300);
	};

	// Menu zoom -----------------------------------------------------------
	const MENU_ZOOM_CROP = 100; // Minimum crop 100px on every border, but maintain aspect ratio

	const zoomScale = $derived.by(() => {
		const shortestSide = Math.min(innerWidth.current ?? 0, innerHeight.current ?? 0);
		if (!$inMenu || !shortestSide) return 1;
		return (shortestSide + MENU_ZOOM_CROP * 2) / shortestSide; // Calculate zoom required
	});

	// Custom viewer state -------------------------------------------------

	// When the custom panorama viewer fails, fall back to the iFrame
	// It mostly fails when the location doesn't exist, so we display the iFrame that shows the Google error
	let tileViewerFailed = $state(false);

	// Reset every new round
	$effect(() => {
		$panoramaSrc;
		tileViewerFailed = false;
	});
</script>

{#if $nmpz && !tileViewerFailed}
	<PanoramaCustomViewer onload={handleLoad} onfail={() => (tileViewerFailed = true)} {zoomScale} />
{:else}
	<PanoramaIframe onload={handleLoad} {zoomScale} />
{/if}

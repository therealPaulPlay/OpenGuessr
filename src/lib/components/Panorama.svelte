<script>
	import PanoramaIframe from "$lib/components/PanoramaIframe.svelte";
	import PanoramaCustomViewer from "$lib/components/PanoramaCustomViewer.svelte";
	import { initialPanoramaLoad, panoramaSrc } from "$lib/stores/locationStore";
	import { loadingScreenVisible } from "$lib/stores/uiStore";
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
	<PanoramaCustomViewer onload={handleLoad} onfail={() => (tileViewerFailed = true)} />
{:else}
	<PanoramaIframe onload={handleLoad} />
{/if}

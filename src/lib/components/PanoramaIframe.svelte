<!-- The IFrame that the StreetView / Panorama is in -->
<script>
  import { iframeElement, initialIframeLoad } from "$lib/stores/locationStore";
  import { loadingScreenVisible } from "$lib/stores/uiStore";
  import { applySingleplayerSettings } from "$lib/utils/applySingleplayerSettings";
  import { checkStartCompetitionRound } from "$lib/logic/competitionLogic";

  const handleLoad = () => {
    if ($initialIframeLoad) {
      try {
        applySingleplayerSettings(); // Apply singleplayer options / settings (NMPZ, timer etc.) if Singleplayer, otherwise disable all
        checkStartCompetitionRound(); // Check if currently playing competition and start timer + new round if so
      } catch (error) {
        console.error("Error after Iframe Load (in handleLoad function):", error);
      }
    }

    initialIframeLoad.set(false);

    setTimeout(function () {
      $loadingScreenVisible = false;
    }, 300);
  };
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<iframe
  id="PanoramaIframe"
  referrerpolicy="no-referrer-when-downgrade"
  frameborder="0"
  onload={handleLoad}
  src="/loader"
  bind:this={$iframeElement}
></iframe>

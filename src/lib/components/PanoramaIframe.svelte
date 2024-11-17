<!-- The IFrame that the StreetView / Panorama is in -->
<script>
  import { panoramaLink, reloadPanorama, loadPanorama } from "$lib/stores/locationStore";
  import { imageGuesser, multiplayer } from "$lib/stores/modeStore";
  import { loadingScreenVisible } from "$lib/stores/uiStore";
  import { get } from "svelte/store";

  const streetviewAPIKey = "AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs";

  let iframe = $state();
  let initialIframeLoad = true;

  export function loadIframe(lat, long) {
    if (!$imageGuesser || $multiplayer) {
      panoramaLink.set(
        "https://www.google.com/maps/embed/v1/streetview?location=" +
          lat +
          "," +
          long +
          "&key=" +
          streetviewAPIKey +
          "&fov=90",
      ); // API key (last part of URL)
    } else {
      panoramaLink.set("/loader");
    }

    iframe.setAttribute("src", get(panoramaLink)); // Apply manually, to avoid URL override on move (where the URL changes)
    initialIframeLoad = true;
  }

  loadPanorama.set(loadPanorama);

  export function reload() {
    $loadingScreenVisible = true;
    iframe.setAttribute("src", get(panoramaLink));
    window.setTimeout(() => {
      $loadingScreenVisible = false;
    }, 400);
  }

  reloadPanorama.set(reload);

  const handleLoad = () => {
    if (initialIframeLoad) {
      try {
        applySingleplayerSettings(); // Check if the user is playing hard mode + apply changes if yes
        checkStartCompetitionRound(); // Check if currently playing competition and start timer + new round if so
      } catch (error) {
        console.error("Error after Iframe Load (in handleLoad function):", error);
      }
    }

    initialIframeLoad = false;

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
  bind:this={iframe}
></iframe>

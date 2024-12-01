<script>
  import { mapExpanded, mapVisible, mapHovered, map } from "$lib/stores/context-specific/mapStore";
  import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
  import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
  import { isElementClickable } from "$lib/utils/checkIfElementIsClickable";
  import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
  import { initMap } from "$lib/logic/miniMap";
  import { get } from "svelte/store";
  import { onMount } from "svelte";

  let mapResizeTimeout;

  function handleMapHover() {
    if (window.matchMedia("(min-width: 1200px)").matches) {
      clearTimeout(mapResizeTimeout);
      mapHovered.set(true);
    }
  }

  function handleMapUnhover() {
    mapResizeTimeout = setTimeout(() => {
      mapHovered.set(false);
    }, 250);
  }

  // Allow the user to guess with the space bar (instead of clicking on "Guess")
  function spaceBarGuess(event) {
    if (event.key === " ") {
      if (get(confirmButtonActive) && isElementClickable(document.getElementById("map"))) {
        confirmButtonClicks();
      }
    }
  }

  function onMapHover() {
    get(map).invalidateSize();
  }

  onMount(() => {
    initMap();

    try {
      new ResizeObserver(onMapHover).observe(document.getElementById("map"));
    } catch (error) {
      console.error("Resize oberser unsupported. Err: " + error);
    }
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
  id="map"
  role="region"
  tabindex="0"
  onmouseenter={handleMapHover}
  onmouseleave={handleMapUnhover}
  onkeyup={spaceBarGuess}
  style:visibility={$mapVisible ? "" : "hidden"}
  style:max-height={$mapExpanded ? "100%" : "0%"}
  class:mapFullOpacityResult={Boolean($resultScreenEnabled)}
>
  {#if !$map && $mapVisible}
    <div id="mapPlaceholderBeforeLoad"></div>
  {/if}
</div>

<style>
  #map {
    cursor: crosshair;
    pointer-events: auto;
    width: 100%;
    height: 100%;
    z-index: 9;
    opacity: 60%;
    border-radius: 10px;
    margin-bottom: 10px;
    max-height: 100%;
    background: #e8e4dc;
    box-shadow: 0 2px 30px rgba(71, 71, 71, 0.5);
    transition:
      opacity 250ms ease,
      max-height 250ms ease,
      margin 250ms ease;
    overflow: hidden;
  }

  #map:focus {
    outline: none;
  }

  #map * {
    font-family: Roboto;
  }

  .mapFullOpacityResult {
    opacity: 1 !important;
    border-radius: 0 !important;
    top: -60px;
    position: fixed !important;
    visibility: visible !important;
    max-height: calc(100% + 60px) !important;
    height: calc(100% + 60px) !important;
  }

  #mapPlaceholderBeforeLoad {
    width: 100%;
    height: 100%;
    left: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url("/img/map_preview.webp");
    background-size: cover;
    background-position: center;
    transition: opacity 500ms ease;
    pointer-events: none;
  }

  :global(.mk-map-view) {
    border-radius: 10px;
  }

  :global(.leaflet-bottom, .leaflet-control-attribution) {
    pointer-events: none;
    display: none;
  }

  :global(.leaflet-tooltip) {
    padding: 1px;
    padding-inline: 6px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
    margin-top: -18px;
    margin-left: 23px;
  }

  :global(.leaflet-interactive) {
    cursor: crosshair !important;
  }

  :global(.gm-style .gm-style-iw) {
    font-size: 16px;
    text-align: center;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding-bottom: 0;
    padding-inline: 0;
    padding-right: 15px;
  }

  :global(.gm-style-iw-ch) {
    display: none;
  }

  :global(.gm-style iframe + div) {
    border: none !important;
  }

  :global(.gm-style-iw-d) {
    overflow: visible !important;
    margin-right: 20px !important;
  }

  #map:hover {
    opacity: 100%;
  }

  :global(map::selection) {
    outline: none;
  }

  :global(.leaflet-control-layers-toggle) {
    background-image: url("/img/map_layer_icon.png") !important;
    background-size: 23px 23px !important;
  }

  :global(.leaflet-touch .leaflet-control-layers) {
    border: none;
  }

  :global(.leaflet-touch .leaflet-control-layers-toggle) {
    width: 35px;
    height: 35px;
  }

  :global(.leaflet-control-layers-selector) {
    top: -2px;
  }

  :global(.leaflet-control-layers-base) {
    font-size: 18px;
    line-height: 30px;
  }

  @media all and (max-width: 1200px) {
    /* On mobile, the map doesn't fade out if it's not being hovered over */
    #map {
      opacity: 100%;
    }
  }
</style>

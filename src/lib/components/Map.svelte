<script>
  import { mapExpanded, mapVisible } from "$lib/stores/context-specific/mapStore";
</script>

{#if $mapVisible}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div id="map" tabindex="0" style:max-height={$mapExpanded ? "100%" : "0%"}>
    <div id="mapPlaceholderBeforeLoad"></div>
  </div>
{/if}

<style>
  #map {
    cursor: crosshair;
    pointer-events: auto;
    width: 100%;
    height: 100%;
    z-index: 9;
    opacity: 60%;
    border-radius: 10px;
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

  :global(#map:hover) {
    opacity: 100%;
  }

  :global(map::selection) {
    outline: none;
  }
</style>

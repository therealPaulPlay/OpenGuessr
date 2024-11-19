<script>
  let { children } = $props();
  import { mapHolderMarginRight } from "$lib/stores/context-specific/mapStore";
  import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
</script>

<div id="mapHolder" class="regularMapSize mapHolder" class:mapHolderToResult={$resultScreenEnabled} style:margin-right={$mapHolderMarginRight}>
  {@render children?.()}
</div>

<style>
  .mapHolder {
    position: fixed;
    display: flex;
    right: 0;
    bottom: 65px;
    padding-inline: 10px;
    align-items: flex-end;
    flex-direction: column;
    margin-bottom: 10px;
    max-height: 100%;
    z-index: 9;
    pointer-events: none;
  }

  .regularMapSize {
    width: 22%;
    height: 20%;
    transition:
      height 150ms ease,
      width 150ms ease,
      opacity 250ms ease,
      max-height 250ms ease,
      margin 250ms ease;
  }

  /* map Holder class on result screen */
  :global(.mapHolderToResult) {
    bottom: 0;
    padding-inline: 0;
    z-index: 12;
    width: 100%;
    height: 100%;
    transition: none;
    margin: 0 !important;
    opacity: 100% !important;
    visibility: visible !important;
    border-radius: 0 !important;
    max-height: 100% !important;
    transition: none !important;
  }

  :global(.mapHolderToResult #floatingMapButton) {
    display: none !important;
  }

  @media all and (max-width: 1200px) {
    .mapHolder {
      height: 50%;
      width: calc(100% - 20px);
      margin-right: 0 !important;
    }
  }

  @media all and (orientation: landscape) and (max-width: 1200px) {
    .mapHolder {
      width: 30%;
      height: 45%;
    }
  }

  @media (orientation: portrait) and (max-width: 800px) {
    .mapHolder {
      bottom: 125px;
    }
  }
</style>

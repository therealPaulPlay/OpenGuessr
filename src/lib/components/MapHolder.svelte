<script>
  let { children } = $props();
  import { mapHolderMarginRight } from "$lib/stores/context-specific/mapStore";
  import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
  import { mapHovered } from "$lib/stores/context-specific/mapStore";
</script>

<div
  id="mapHolder"
  class="regularMapSize mapHolder"
  class:mapHover={$mapHovered}
  class:mapHolderToResult={$resultScreenEnabled}
  style:margin-right={$mapHolderMarginRight}
>
  {@render children?.()}
</div>

<style>
  .mapHolder {
    position: fixed;
    display: flex;
    right: 0;
    bottom: 76px;
    padding-inline: 10px;
    min-height: 150px;
    align-items: flex-end;
    flex-direction: column;
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
    bottom: 0 !important;
    padding-inline: 0 !important;
    z-index: 12 !important;
    width: 100% !important;
    height: 100% !important;
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

  @media all and (orientation: landscape) and (max-width: 1200px) {
    .mapHolder {
      width: 30%;
      height: 30%;
    }
  }

  .mapHover {
    width: 60%;
    height: 55%;
  }

  @media ((orientation: portrait) or (max-width: 800px)) and (max-width: 1200px) {
    .mapHolder {
      height: 50%;
      width: calc(100% - 20px);
      margin-right: 0 !important;
    }
  }

  /* Shift up to fit ad */
  @media (orientation: portrait) and (max-width: 800px) {
    .mapHolder {
      bottom: 135px;
    }
  }
</style>

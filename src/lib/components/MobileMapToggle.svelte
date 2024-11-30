<script>
  import { onMount } from "svelte";
  import { mapExpanded, mapVisible } from "$lib/stores/context-specific/mapStore";
  import { get } from "svelte/store";
  import { playSound } from "$lib/utils/soundManager";
  let toggleMapButton = $state();

  function toggleMapClick() {
    mapExpanded.set(!get(mapExpanded)); // Invert mapExpandedp
    playSound("floating_button");
  }

  onMount(() => {
    window.addEventListener("resize", (event) => {
      mapExpanded.set(true);
    });
  });
</script>

<button
  id="floatingMapButton"
  style:visibility={$mapVisible ? "visible" : "hidden"}
  class="standardButton white floatingMapButton"
  bind:this={toggleMapButton}
  onclick={toggleMapClick}
  style={$mapExpanded ? "margin-bottom: 10px;" : ""}
>
  <img id="toggleMapImage" src="/img/map_icon.png" alt="Toggle Minimap." />
</button>

<style>
  .floatingMapButton {
    display: none;
    pointer-events: auto;
    margin-top: auto;
    z-index: 10;
    font-size: 25px;
    padding: 8px;
    border-radius: 10px;
    user-select: none;
    color: white;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    align-items: center;
    max-height: 65px;
  }

  #toggleMapImage {
    width: 30px;
    height: 30px;
    border-radius: 5px;
    padding: 8px;
  }

  @media all and (max-width: 1200px) {
    #floatingMapButton {
      display: flex;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import { mapExpanded, hideToggleMap } from "$lib/stores/context-specific/mapStore";
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

  function hideToggleMapButtonIfMobile(hide) {
    if (window.innerHeight > window.innerWidth) {
      if (hide) {
        toggleMapButton.style.visibility = "hidden";
      } else {
        toggleMapButton.style.visibility = "visible";
      }
    }
  }

  hideToggleMap.set(hideToggleMapButtonIfMobile); // Assign function to store variable, to make it accesible anywhere
</script>

<button
  id="floatingMapButton"
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
    width: 35px;
    height: 35px;
    border-radius: 5px;
    padding: 8px;
  }

  @media all and (max-width: 1200px) {
    #floatingMapButton {
      display: flex;
    }
  }
</style>

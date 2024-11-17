<script>
  import Popup from "$lib/components/Popup.svelte";
  import { helpPopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
</script>

{#if $helpPopup}
<Popup>
  <div class="popup-title">
    <h1>How to play</h1>
  </div>
  <ul class="nolistdots">
    <li>
      <h3>🔍 Look at the Street View image</h3>
      <p class="listMarginLeft">Study the streetview image carefully and explore the surroundings.</p>
    </li>
    <li>
      <h3>🎯 Guess where you are</h3>
      <p class="listMarginLeft">Pinpoint the location on the world map. Be precise for higher scores!</p>
    </li>
    <li>
      <h3>👥 Challenge your friends</h3>
      <p class="listMarginLeft">Compete against friends in multiplayer modes and competitions.</p>
    </li>
  </ul>
  <button id="helpClose" class="standardButton white closeButton" onclick={() => {
    playSound("basic_button");
    helpPopup.set(false);
  }}>Let's go!</button>
</Popup>
{/if}

<style>
  .nolistdots {
    list-style-type: none;
    padding: 10px 0;
  }

  .listMarginLeft {
    margin-left: 35px;
  }
</style>

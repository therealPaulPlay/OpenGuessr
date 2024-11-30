<script>
  import Popup from "$lib/components/Popup.svelte";
  import { helpPopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import { Search, Goal, Users } from "lucide-svelte";
</script>

{#if $helpPopup}
<Popup verySlim=true >
  <div class="popup-title">
    <h1>How to play</h1>
  </div>
  <ul class="nolistdots">
    <li>
      <h3><Search size=25 />  Look at the Street View image</h3>
      <p class="listMarginLeft">Study the streetview image carefully and explore the surroundings.</p>
    </li>
    <li>
      <h3><Goal size=25 />  Guess where you are</h3>
      <p class="listMarginLeft">Pinpoint the location on the world map. Be precise for higher scores!</p>
    </li>
    <li>
      <h3><Users size=25 />  Challenge your friends</h3>
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
    margin-left: 40px;
    opacity: 0.75;
  }
</style>

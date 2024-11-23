<!-- This is being shown when joining a multiplayer round via a link. It displays the loading status and shows if joining is possible -->
<script>
  import Popup from "$lib/components/Popup.svelte";
  import { linkJoinPopup } from "$lib/stores/uiStore";
  import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
</script>

{#if $linkJoinPopup}
  <Popup verySlim="true">
    <div class="popup-title">
      <h1 id="socialHeader">Joining...</h1>
    </div>
    <p id="linkjoinStatus">Status: {$multiplayerStatus}</p>
    <br />
    <button id="linkJoinClose" class="standardButton white closeButton">Close</button>
  </Popup>
{/if}

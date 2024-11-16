<script>
  import { loadingScreenVisible } from "$lib/stores/uiStore";
</script>

{#if $loadingScreenVisible}
  <div id="BeforeOverlay">
    <img src="/img/compass_spinner.png" alt="Loading new streetview" id="spinner" class="spinner" />
    <p id="loadingText">Loading...</p>
  </div>
{/if}

<style>
  #BeforeOverlay {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    opacity: 100%;
    background-color: #13151c;
    transition: all 250ms ease;
    position: fixed;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 6;
    box-shadow: 0 0 700px rgba(255, 176, 176, 0.2) inset;
  }

  #loadingText {
    color: white;
    opacity: 0.3;
    font-size: 25px;
    text-align: center;
  }
</style>

<script>
  import { singleplayerNMPZ } from "$lib/stores/uiStore";
</script>

{#if $singleplayerNMPZ}
  <div id="nmpzSingleplayerBackground"></div>
{/if}

<style>
  #nmpzSingleplayerBackground {
    position: fixed;
    overflow: hidden;
    width: 100%;
    height: 100%;
    z-index: 1;
    top: 0;
  }
</style>

<script>
  import { blink } from "$lib/stores/context-specific/restrictionStore";
</script>

{#if $blink}
  <div id="blinkBackground"></div>
{/if}

<style>
  #blinkBackground {
    position: fixed;
    overflow: hidden;
    width: 100%;
    height: 100%;
    z-index: 1;
    animation: restrictionFade 2s infinite;
    transition: oapcity 500ms ease;
    pointer-events: none;
    top: 0;
    background-color: black;
  }

  @keyframes restrictionFade {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }
  }
</style>

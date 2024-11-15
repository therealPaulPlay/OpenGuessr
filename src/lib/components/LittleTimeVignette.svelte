<!-- Red Vignette, shown when the timer runs low -->
<script>
  import { littleTimeVignette } from "$lib/stores/UIStore";
</script>

{#if $littleTimeVignette}
  <div id="littleTimeVignette"></div>
{/if}

<style>
  #littleTimeVignette {
    position: fixed;
    overflow: hidden;
    width: 100%;
    height: 100%;
    z-index: 1;
    box-shadow: 0 0 350px rgba(254, 0, 0, 0.5) inset;
    pointer-events: none;
    transition: opacity 500ms ease;
    top: 0;
  }
</style>

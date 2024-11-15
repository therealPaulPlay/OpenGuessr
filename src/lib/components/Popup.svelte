<script>
  import { onMount, onDestroy } from "svelte";
  let { children, z } = $props();

  let animateClass = $state("");

  onMount(() => {
    // Trigger the popup animation
    animateClass = "animate";
  });

  onDestroy(() => {
    animateClass = "";
  });
</script>

<div class="popupHolder">
  <div class="uiWindow {animateClass}" style:z-index={z}>
    {@render children?.()}
  </div>
</div>

<style>
  .popupHolder {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(30, 30, 30, 0.7);
    pointer-events: auto;
    z-index: 100; /* Default Z-Index, can be changed with Prop */
  }

  .uiWindow {
    width: 45%;
    min-width: 300px;
    max-width: 600px;
    max-height: 90%;
    font-size: 25px;
    padding: 25px 25px 10px;
    border-radius: 10px;
    text-align: left;
    z-index: 900;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: var(--menu-background);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 100px rgba(5, 6, 10, 0.5);
    color: white;
    pointer-events: auto;
    transition:
      opacity 250ms ease,
      transform 250ms ease;
  }

  .animate {
    animation: popupFadeIn 200ms ease-in-out;
  }

  @keyframes popupFadeIn {
    0% {
      transform: scale(0.99);
    }

    50% {
      transform: scale(1.01);
    }

    100% {
      transform: scale(1);
    }
  }

  @media all and (max-width: 1200px) {
    .uiWindow {
      font-size: 22px;
    }
  }
</style>

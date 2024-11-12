<script>
  import { imageGuesser } from "$lib/stores/modeStore.js";

  let overlay = $state();
  let image = $state();
  let background = $state();

  export function setImageGuessrEnabled(enable) {
    $imageGuesser = enable;

    if (enable) {
      image.style.transform = "rotate(" + Math.floor(Math.random() * 10 - 5) + "deg)";

      // Apply image loading styles
      image.classList.add("guessImageLoading");
      background.classList.add("guessImageLoading");

      // Clear the background styles
      image.style.backgroundImage = "";
      background.style.backgroundImage = "";
    }
  }

  function scaleUp(event) {
    const image = event.target;
    image.style.transform += " scale(1.01)";
  }

  function scaleDown(event) {
    const image = event.target;
    image.style.transform = image.style.transform.replace(" scale(1.01)", "");
  }

  // CONVERT this to a url prop later?
  export function loadImageFromUrl(url) {
    // Preload the image to ensure it is loaded before setting it as background
    const img = new Image();
    img.src = url;

    img.onload = function () {
      // Set the background image once it's loaded
      image.style.backgroundImage = `url(${url})`;
      background.style.backgroundImage = `url(${url})`;

      // Remove the loading class to apply any transitions
      setTimeout(() => {
        image.classList.remove("guessImageLoading");
        background.classList.remove("guessImageLoading");
      }, 200);
    };
  }
</script>

<div
  id="imageGuesserOverlay"
  bind:this={overlay}
  style:display={$imageGuesser ? "flex" : "none"}
  style:opacity={$imageGuesser ? "1" : "0"}
  style:pointerEvents={$imageGuesser ? "auto" : "none"}
>
  <div
    id="imageGuesserImage"
    class="guessImageLoading"
    bind:this={image}
    onmouseenter={scaleUp}
    onmouseleave={scaleDown}
    role="img"
  ></div>
  <p id="imageGuesserAttribution">
    CC0 Images by <a class="noTextDecoration" href="https://commons.wikimedia.org/" target="_blank">Wikimedia</a>
  </p>
  <div id="imageGuesserBackground" class="guessImageLoading" bind:this={background}></div>
</div>

<style>
  #imageGuesserOverlay {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    z-index: 2;
    transition:
      opacity 250ms ease,
      transform 2000ms ease,
      filter 250ms ease;
    transform: scale(1);
    overflow: hidden;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
    user-select: none;
    background-color: rgb(22, 22, 22);
  }

  #imageGuesserImage {
    max-width: 40%;
    max-height: 70%;
    width: 100%;
    height: 100%;
    transition:
      transform 250ms ease,
      filter 250ms ease,
      opacity 500ms ease;
    pointer-events: auto;
    z-index: 2;
    opacity: 1;
    background-size: contain; /* Maintain aspect ratio */
    background-position: center;
    background-repeat: no-repeat;
    filter: drop-shadow(10px 0px 0px rgb(255, 255, 255)) drop-shadow(0px 10px 0px rgb(255, 255, 255))
      drop-shadow(-10px 0px 0px rgb(255, 255, 255)) drop-shadow(0px -10px 0px rgb(255, 255, 255));
  }

  #imageGuesserAttribution {
    font-size: 22px;
    color: white;
    opacity: 0.5;
    z-index: 2;
    margin-bottom: 10vh;
    margin-top: 10px;
  }

  #imageGuesserBackground {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 1;
    filter: brightness(0.5) blur(50px);
    background-size: cover;
    transition: opacity 500ms ease;
    opacity: 1;
  }

  .guessImageLoading {
    opacity: 0 !important;
  }
</style>

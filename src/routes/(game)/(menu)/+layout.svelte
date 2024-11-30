<script>
  let { children } = $props();
  import { playSound } from "$lib/utils/soundManager";
  import Notification from "$lib/components/Notification.svelte";
  import { goto } from "$app/navigation";
  import { Home } from "lucide-svelte";

  function goBack() {
    history.back();
  }
</script>

<nav class="menuNavBar">
  <button
    class="backButton standardButton white"
    onclick={() => {
      playSound("basic_button");
      goBack();
    }}
  >
    <img src="/img/arrow_icon.png" alt="Expand or close arrow" class="backButtonArrowIcon" />
    Back</button
  >
  <button
    class="backButton standardButton white"
    onclick={() => {
      playSound("basic_button");
      goto("/");
    }}
  >
    <span class="homeButtonIcon"><Home strokeWidth={2.25} /></span></button
  >
</nav>

<div class="background"></div>

<main class="content">
  <Notification belowNavbar={false} />
  <div class="container">
    {@render children?.()}
  </div>
</main>

<style>
  .background {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(18, 18, 28, 0.9);
    z-index: 90;
    backdrop-filter: blur(15px);
  }

  .backButton {
    width: fit-content;
    height: 50px;
    border-radius: 10px;
    margin: 10px;
    text-decoration: none;
    line-height: 35px;
    pointer-events: auto;
  }

  .homeButtonIcon {
    vertical-align: -6px;
  }

  .backButtonArrowIcon {
    width: 25px;
    height: 25px;
    transform: rotate(90deg);
    vertical-align: -5px;
  }

  .backButton:hover {
    filter: brightness(0.7);
  }

  .menuNavBar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    padding: 15px;
    z-index: 99;
    pointer-events: none;
  }

  .content {
    overflow-y: auto;
    overflow-x: hidden;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 91;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 30px;
  }

  .container {
    max-width: 1100px;
    padding: 20px;
    padding-top: 100px;
    width: calc(100% - 40px);
  }

  @media (max-width: 1500px) {
    .backButton {
      background-color: rgb(78, 77, 87); /* Switch to solid color, to avoid transparent overlaps */
    }
  }
</style>

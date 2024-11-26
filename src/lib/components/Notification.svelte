<script>
  import {
    notificationElement,
    notificationText,
    acceptText,
    showAcceptButton,
    dismissFunction,
    acceptFunction,
  } from "$lib/stores/context-specific/notificationStore";
  import { hideNotification } from "$lib/utils/notifications";
  import { playSound } from "$lib/utils/soundManager";

  function accept() {
    if ($acceptFunction) {
      try {
        $acceptFunction();
      } catch (error) {
        console.error("Error executing notification function:", error);
      }
    }

    playSound("basic_button");
    hideNotification();
  }

  function dismiss() {
    if ($dismissFunction) {
      try {
        $dismissFunction();
      } catch (error) {
        console.error("Error executing notification function:", error);
      }
    }

    playSound("basic_button");
    hideNotification();
  }
</script>

<div id="notificationBar" bind:this={$notificationElement}>
  <p id="notificationText">{$notificationText}</p>
  <div class="notificationButtonBox">
    {#if $showAcceptButton}
      <button id="notificationAccept" class="standardButton white" onclick={accept}>{$acceptText}</button>
    {/if}
    <button id="notificationDismiss" class="standardButton white" onclick={dismiss}>
      <img alt="dismiss notification" class="dismissIcon" src="/img/delete_icon.png" />
    </button>
  </div>
</div>

<style>
  #notificationBar {
    position: absolute;
    visibility: hidden; /* changed in code */
    top: 50px;
    border-radius: 10px;
    background-color: var(--panel-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    padding: 6px;
    gap: 15px;
    font-size: 22px;
    opacity: 0;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
    transition: all 200ms ease;
    pointer-events: auto;
    margin-inline: 10px;
    max-width: 80vw;
  }

  #notificationAccept {
    min-width: 45px;
  }

  #notificationDismiss,
  #notificationAccept {
    padding-inline: 10px;
  }

  #notificationText {
    padding-left: 10px;
    max-width: 350px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
  }

  .notificationButtonBox {
    display: flex;
    align-items: center;
    width: fit-content;
    gap: 4px;
  }

  .dismissIcon {
    width: 25px;
    height: 25px;
    vertical-align: -4px;
  }
</style>

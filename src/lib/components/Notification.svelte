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
      <button id="notificationAccept" class="standardButton accountButton" onclick={accept}>{$acceptText}</button>
    {/if}
    <button id="notificationDismiss" class="standardButton accountButton" onclick={dismiss}>
      <img alt="dismiss notification" class="friendRemoveIcon" src="/img/delete_icon.png" />
    </button>
  </div>
</div>

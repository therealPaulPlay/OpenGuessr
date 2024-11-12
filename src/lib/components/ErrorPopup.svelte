<script>
  import {
    hideDisableOption,
    reload,
    showErrors,
    title,
    description,
    errorCode,
    popupOpen,
    closeButtonText,
  } from "$lib/stores/errorPopupData";
  import { get } from "svelte/store"; // Import get from svelte/store

  function closePopup() {
    popupOpen.set(false);

    if (get(reload)) {
      localStorage.setItem("selectedCategory", "standard");
      location.reload();
    }
  }
</script>

{#if $popupOpen}
  <div class="popupHolder errorBackground">
    <div class="errorPopupWindow uiWindow">
      <div id="errorTitle" class="popup-title">
        <h2>{$title}</h2>
      </div>
      <div id="popup-description" class="popup-description">
        <p class="slightBottomMargin">{$description}</p>
        {#if errorCode}
          <p class="errorCode">{$errorCode}</p>
        {/if}
      </div>
      {#if !$hideDisableOption}
      <div id="errorPopupDisable">
        <p>Never show again:</p>
        <input type="checkbox" id="hideErrors" bind:checked={$showErrors}/>
      </div>
      {/if}
      <button id="popupClose" class="standardButton white errorClose" onclick={closePopup}>{$closeButtonText}</button>
    </div>
  </div>
{/if}

<style>
    
</style>

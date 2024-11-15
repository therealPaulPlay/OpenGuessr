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
  } from "$lib/stores/context-specific/errorPopupData";

  import Popup from "./Popup.svelte";
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
  <Popup z="999">
    <div id="errorTitle" class="popup-title">
      <h2>{$title}</h2>
    </div>
    <div>
      <p class="slightBottomMargin">{$description}</p>
      {#if errorCode}
        <p class="errorCode">{$errorCode}</p>
      {/if}
    </div>
    {#if !$hideDisableOption}
      <div id="errorPopupDisable">
        <p>Never show again:</p>
        <input type="checkbox" id="hideErrors" bind:checked={$showErrors} />
      </div>
    {/if}
    <button class="standardButton white errorClose" onclick={closePopup}>{$closeButtonText}</button>
  </Popup>
{/if}

<style>
  .errorClose {
    height: 50px;
    width: 100%;
    margin-bottom: 16px;
    margin-top: 40px;
  }
</style>

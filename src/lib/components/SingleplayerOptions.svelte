<script>
  import Popup from "$lib/components/Popup.svelte";
  import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
  import { playSound } from "$lib/utils/soundManager";
  import { openLocationOnMaps } from "$lib/utils/openLocationOnMaps";
  import { formatDistance } from "$lib/utils/distanceFunctions";
  import { singleplayerOptionsPopup } from "$lib/stores/uiStore";
  import { timerCountdownOverlay } from "$lib/stores/context-specific/timerCountdownOverlayStore";
  import { isSingleplayerNMPZ, timeout } from "$lib/stores/modeStore";
  import { roundLog } from "$lib/stores/locationStore";
  import { onMount } from "svelte";

  // Singleplayer Options UI ----------------------------------------------------------------------------------------

  let timerSliderValue = $state(0);

  let timerSliderText = $derived(
    timerSliderValue == 0 || !timerSliderValue ? "No Timer" : timerSliderValue + " Seconds",
  );

  // Timer Slider ---------------------------------------------------------------------------------------------------------------------------
  function changeTimeout() {
    $timeout = Number(timerSliderValue);
    localStorage.setItem("singleplayerTimer", $timeout);
    $timerCountdownOverlay = $timeout ? "visible" : "hidden";

    checkGenerationTypeAndGenerate();
  }

  // Toggle Singleplayer Restrictions -----------------------------------------------------------------------------------

  onMount(() => {
    $isSingleplayerNMPZ = localStorage.getItem("singleplayerNMPZ")
      ? Boolean(localStorage.getItem("singleplayerNMPZ"))
      : false;
  });

  function toggleSingleplayerNMPZ() {
    playSound("basic_button");
    $isSingleplayerNMPZ = !$isSingleplayerNMPZ;
    localStorage.setItem("singleplayerNMPZ", $isSingleplayerNMPZ ? "true" : "");
    
    checkGenerationTypeAndGenerate();
  }

  // Apply singleplayer settings ----------------------------------------------------------------------------------
  onMount(() => {
    localStorage.getItem("singleplayerTimer") != null ? Number(localStorage.getItem("singleplayerTimer")) : 0;
  });

  $effect(() => {
    timerSliderValue = $timeout || 0;
  });

  // Round Log ---------------------------------------------------------------------------------------------------------------
  onMount(() => {
    try {
      roundLog.set(JSON.parse(localStorage.getItem("roundLog")) || []);
    } catch (error) {
      console.error("Error parsing roundLog JSON:", error);
    }
  });
</script>

{#if $singleplayerOptionsPopup}
  <Popup verySlim="true">
    <div class="popup-title">
      <h1>Singleplayer</h1>
    </div>
    <div class="settingsCanvas slightBottomMargin">
      <div class="settingsBox">
        <p class="slightBottomMargin">Timer:</p>
        <div class="timerSliderBox">
          <input
            type="range"
            min="0"
            max="300"
            step="1"
            class="slider"
            id="timerSlider"
            onchange={changeTimeout}
            bind:value={timerSliderValue}
          />
          <div class="timerTextBox">
            <img alt="timer icon" class="timerIcon" src="/img/timer_icon.png" />
            <p id="timerSliderText" contenteditable="false">{timerSliderText}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="settingsCanvas slightBottomMargin">
      <div class="settingsBox">
        <p class="slightBottomMargin">NMPZ:</p>
        <div class="timerSliderBox">
          <p class="singleplayerDesc">Prevent Move, Pan and Zoom:</p>
          <button id="setSingleplayerNMPZ" class="standardButton white" onclick={toggleSingleplayerNMPZ}
            >{$isSingleplayerNMPZ ? "Enabled" : "Disabled"}</button
          >
        </div>
      </div>
    </div>
    <div class="settingsCanvas slightBottomMargin">
      <div class="settingsBox roundLogContainer">
        <p class="slightBottomMargin">Round Log:</p>
        <div class="roundLogBox" id="roundLogBox">
          <!-- round log will be automatically generated here -->
          {#if $roundLog.length > 0}
            {#each $roundLog as [mode, distance, coordinates], index}
              <div class="roundLogItem">
                <div>
                  <p class="logItemMode">{mode}</p>
                  <p>{formatDistance(distance)} away</p>
                </div>
                <button
                  class="standardButton logItemButton"
                  onclick={() => {
                    playSound("basic_button");
                    openLocationOnMaps(coordinates[0], coordinates[1]);
                  }}
                >
                  View
                </button>
              </div>
            {/each}
          {:else}
            <p class="centerLogText">No saved rounds.</p>
          {/if}
        </div>
      </div>
    </div>
    <button
      id="singleplayerOptionsClose"
      class="standardButton white closeButton"
      onclick={() => {
        playSound("basic_button");
        $singleplayerOptionsPopup = false;
      }}>Close</button
    >
  </Popup>
{/if}

<div style="display: none;">
  <!-- Ensure this component is always mounted, so that the logic inside loads -->
</div>

<style>
  .settingsCanvas {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-start;
    align-items: center;
  }

  .settingsBox {
    background-color: var(--box-color);
    border-radius: 10px;
    padding: 15px;
    height: 80px;
    overflow: hidden;
    flex-grow: 1;
    min-width: 150px;
  }

  .timerSliderBox {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .timerTextBox {
    border: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 5px;
    padding-inline: 10px;
    border-radius: 5px;
    min-width: 140px;
    text-align: center;
  }

  .singleplayerDesc {
    opacity: 0.5;
  }

  .roundLogBox {
    display: flex;
    align-items: center;
    justify-content: safe center;
    gap: 5px;
    flex-direction: column;
    overflow-y: auto;
    max-height: 150px;
    padding-top: 10px;
    padding-bottom: 0;
    scrollbar-width: none;
  }

  .logItemButton {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .logItemMode {
    font-size: 20px;
    opacity: 50%;
  }

  .roundLogContainer {
    height: fit-content;
    padding-bottom: 15px;
  }

  .centerLogText {
    text-align: center;
    width: 100%;
    opacity: 50%;
    font-size: 22px;
  }

  .roundLogItem {
    background-color: rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    padding-inline: 15px;
    border-radius: 5px;
    width: calc(100% - 30px);
  }

  .timerIcon {
    width: 23px;
    height: 23px;
    opacity: 0.5;
  }
</style>

<script>
  import Popup from "./Popup.svelte";
  import { onMount, onDestroy } from "svelte";
  import { setSoundsVolume, playSound } from "$lib/utils/soundManager";

  import { settingsPopup } from "$lib/stores/uiStore";
  import { Scan } from "lucide-svelte";

  // Settings - Window ---------------------------------------------------------------------------------------
  function closeSettingsButton() {
    playSound("basic_button");
    settingsPopup.set(false);
  }

  // Unit switch between kilometers and miles ------------------
  let kilometersButtonOpacity = $state(1);
  let milesButtonOpacity = $state(1);

  onMount(() => {
    const tempStorageDistanceUnit = localStorage.getItem("distanceUnit");

    if (tempStorageDistanceUnit != null) {
      setDistanceUnitButtons(tempStorageDistanceUnit);
    } else {
      setDistanceUnitButtons("kilometers");
    }
  });

  function setDistanceUnitButtons(unit) {
    if (unit == "miles") {
      kilometersButtonOpacity = 0.5;
      milesButtonOpacity = 1;
    } else {
      milesButtonOpacity = 0.5;
      kilometersButtonOpacity = 1;
    }
  }

  function setUnitKilometers() {
    setDistanceUnitButtons("kilometers");
    playSound("basic_button");
    localStorage.setItem("distanceUnit", "kilometers");
  }

  function setUnitMiles() {
    setDistanceUnitButtons("miles");
    playSound("basic_button");
    localStorage.setItem("distanceUnit", "miles");
  }

  // SFX Volume -----------------------------

  let sfxVolumeSliderValue = $state(0.5);

  function inputSFXVolumeSlider() {
    setSoundsVolume(sfxVolumeSliderValue);
    updateSliderBackground();
  }

  let sfxSliderBgPercentage = $state(100);

  function updateSliderBackground() {
    sfxSliderBgPercentage = sfxVolumeSliderValue * 100;
  }

  onMount(() => {
    let tempLocalstorageSoundVolume = localStorage.getItem("soundVolume") ? localStorage.getItem("soundVolume") : 0.5;
    setSoundsVolume(tempLocalstorageSoundVolume);
    sfxVolumeSliderValue = tempLocalstorageSoundVolume;
    updateSliderBackground();
  });

  let sfxSliderBg = $derived(
    `linear-gradient(to right, var(--brand-color) 0%, var(--brand-color) ${sfxSliderBgPercentage}%, rgba(255, 255, 255, 0.1) ${sfxSliderBgPercentage}%, rgba(255, 255, 255, 0.1) 100%)`,
  );

  // Exit Popup Setting ---------------------
  let exitPopupButtonText = $state("Default");

  $effect(() => {
    if ($settingsPopup) {
      exitPopupButtonText = Number(localStorage.getItem("hideExitPopup")) ? "Disabled" : "Enabled";
    }
  });

  function toggleExitPopup() {
    playSound("basic_button");

    if (localStorage.getItem("hideExitPopup") == "1") {
      localStorage.setItem("hideExitPopup", "0");
      exitPopupButtonText = "Enabled";
    } else {
      localStorage.setItem("hideExitPopup", "1");
      exitPopupButtonText = "Disabled";
    }
  }

  // Fullscreen Setting ---------------------

  let fullscreenButtonText = $state("Fullscreen");

  const fullscreenChangeCheck = function () {
    if (!document.fullscreenElement) {
      fullscreenButtonText = "Fullscreen";
    } else {
      fullscreenButtonText = "Exit Fullscreen";
    }
  };

  onMount(() => {
    document.addEventListener("fullscreenchange", fullscreenChangeCheck);
  });

  onDestroy(() => {
    try {
      document.removeEventListener("fullscreenchange", fullscreenChangeCheck);
    } catch {}
  });

  function toggleFullscreen() {
    playSound("basic_button");

    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error entering / exiting fullscreen: " + error);
    }
  }
</script>

{#if $settingsPopup}
  <Popup verySlim=true>
    <div class="popup-title">
      <h1>Settings</h1>
    </div>
    <div class="settingsCanvas">
      <div class="settingsBox">
        <p class="slightBottomMargin">Unit System:</p>
        <button
          id="unitSwitchKilometers"
          class="standardButton white"
          style:opacity={kilometersButtonOpacity}
          onclick={setUnitKilometers}>Metric</button
        >
        <button
          id="unitSwitchMiles"
          class="standardButton white"
          style:opacity={milesButtonOpacity}
          onclick={setUnitMiles}>Imperial</button
        >
      </div>
      <div class="settingsBox">
        <p>SFX Volume:</p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          bind:value={sfxVolumeSliderValue}
          style:background={sfxSliderBg}
          oninput={inputSFXVolumeSlider}
        />
      </div>
      <div class="settingsBox">
        <p class="slightBottomMargin">Toggle Fullscreen:</p>
        <button id="fullscreenButton" class="standardButton white" onclick={toggleFullscreen}>
          <span class="fullscreenIcon">
            <Scan size="17" />
          </span>
          <span id="fullscreenText">{fullscreenButtonText}</span>
        </button>
      </div>
      <div class="settingsBox">
        <p class="slightBottomMargin">Legal Information:</p>
        <button
          class="standardButton white"
          id="privacyButton"
          onclick={() => {
            playSound("basic_button");
            window.open("/legal", '_blank').focus();
          }}>Read</button
        >
      </div>
      <div class="settingsBox">
        <p class="slightBottomMargin">Exit Popup:</p>
        <button class="standardButton white" id="exitPopupSetting" onclick={toggleExitPopup}
          >{exitPopupButtonText}</button
        >
      </div>
    </div>
    <button id="settingsClose" class="standardButton white closeButton" onclick={closeSettingsButton}>Close</button>
  </Popup>
{/if}

<style>
  .settingsBox {
    background-color: var(--box-color);
    border-radius: 10px;
    padding: 15px;
    height: 80px;
    overflow: hidden;
    flex-grow: 1;
    min-width: 150px;
  }

  .settingsCanvas {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-start;
    align-items: center;
  }

  .fullscreenIcon {
    margin-right: 3px;
  }
</style>

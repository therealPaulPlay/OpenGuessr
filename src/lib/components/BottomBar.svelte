<!--bottom toolbar with reset button-->
<script>
  import RemoveAdsText from "$lib/components/RemoveAdsText.svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { reloadPanorama } from "$lib/utils/loadPanorama"; 
  import { helpPopup } from "$lib/stores/uiStore";
  import { mapHolderMarginRight } from "$lib/stores/context-specific/mapStore";
  import { confirmButtonActive, confirmButtonText } from "$lib/stores/context-specific/confirmButtonStore";
  import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";
  import { supporterLevel } from "$lib/stores/accountStore";
  import { onMount } from "svelte";

  // Load the saved map offset state
  let mapOffset = false;

  onMount(() => {
    let mapOffsetFromStorage = localStorage.getItem("mapOffset");
    if (mapOffsetFromStorage == "true") mapOffset = true;
    setMapOffset();
  });

  function toggleMapOffset() {
    mapOffset = !mapOffset;
    localStorage.setItem("mapOffset", mapOffset);
    setMapOffset();
  }

  function setMapOffset() {
    if (mapOffset) {
      $mapHolderMarginRight = "65px";
    } else {
      $mapHolderMarginRight = "0px";
    }
  }
</script>

<div id="BottomBar" class="BottomBar">
  <div class="barMenu">
    <button
      class="standardButton bottomBarButton"
      id="resetButton"
      onclick={() => {
        reloadPanorama(); // No sound, as the reload sound will play
      }}
    >
      <img id="resetButtonImg" src="/img/return_icon.png" alt="Return to start position" />
    </button>
    <button
      class="standardButton bottomBarButton bottomSocialItem"
      id="discordButton"
      onclick={() => {
        playSound("basic_button");
        window.open("https://discord.gg/CSc3MbDrZ8", "_blank").focus();
      }}
    >
      <img src="./img/discord.png" alt="Discord Logo" class="socialIcon bottomBarIcon" id="discordIcon" />
    </button>
    <button
      class="standardButton bottomBarButton bottomSocialItem"
      id="redditButton"
      onclick={() => {
        playSound("basic_button");
        window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
      }}
    >
      <img src="./img/reddit.png" alt="Reddit Logo" class="socialIcon bottomBarIcon" />
    </button>
  </div>
  <div class="barMenu bottomRightMenu">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="standardButton bottomBarButton confirmButton"
      id="confirmButton"
      class:confirmActive={$confirmButtonActive}
      onclick={confirmButtonClicks}
    >
      <button
        class="socialItem"
        id="helpButton"
        class:innerConfirmButtonDisabled={$confirmButtonActive}
        onclick={(element) => {
          element.stopPropagation();
          playSound("basic_button");
          $helpPopup = true;
        }}>?</button
      >
      <button
        class="socialItem"
        id="revealCompass"
        class:innerConfirmButtonDisabled={$confirmButtonActive}
        onclick={(element) => {
          element.stopPropagation();
          toggleMapOffset();
          playSound("basic_button");
        }}
      >
        <img src="./img/discover_icon.png" alt="Toggle compass" class="socialIcon bottomBarIcon" />
      </button>
      <p id="guessText">{$confirmButtonText}</p>
    </div>
  </div>
</div>
<div
  id="bottomFooterAds"
  class="bottomFooterAds leaderboardAds bottomFooterAdsAd"
  style:display={$supporterLevel >= 2 ? "none" : ""}
></div>
<div
  class="bottomFooterAds leaderboardAds bottomFooterAdText barMenu"
  style:display={$supporterLevel >= 2 ? "none" : ""}
>
  <RemoveAdsText text="Ads keep OpenGuessr free ♥" />
</div>

<style>
  .BottomBar {
    position: fixed;
    bottom: 10px;
    width: calc(100% - 20px);
    height: 95px;
    min-height: 95px;
    max-height: 95px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    margin: auto;
    border-radius: 10px;
    margin-inline: 10px;
    flex: 1;
    z-index: 10;
    transition: background-color 250ms ease;
    pointer-events: none;
  }

  .bottomBarButton {
    background-color: rgba(168, 168, 187, 0.3);
    pointer-events: auto;
    font-size: 25px;
  }

  .bottomBarIcon {
    width: 18px !important;
    height: 18px !important;
    vertical-align: 1px;
  }

  .bottomFooterAds {
    position: fixed;
    bottom: 12px;
    left: 0px;
    right: 0px;
    margin-left: auto;
    margin-right: auto;
    padding: 0;
    z-index: 8;
  }

  .bottomFooterAdsAd {
    z-index: 9;
  }

  .confirmButton {
    width: fit-content;
    position: relative;
    pointer-events: none;
    padding-left: 10px;
    padding-right: 30px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 0;
  }

  .confirmActive {
    pointer-events: auto;
    background-color: var(--brand-color);
  }

  :global(.innerConfirmButtonDisabled) {
    pointer-events: none !important;
    opacity: 0.5;
  }

  #redditButton:hover {
    background-color: #d45f24;
    filter: none;
  }

  #discordButton:hover {
    background-color: #8c2aed;
    filter: none;
  }

  #guessText {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
  }

  #helpButton {
    pointer-events: auto;
    transition:
      filter 250ms ease,
      opacity 250ms ease;
    margin-left: -5px;
    font-size: 20px;
    height: 30px;
  }

  #helpButton:hover {
    filter: brightness(0.7);
  }

  #revealCompass {
    pointer-events: auto;
    transition:
      filter 250ms ease,
      opacity 250ms ease;
    margin-left: -5px;
  }

  #revealCompass:hover {
    filter: brightness(0.7);
  }

  @media all and (max-width: 1200px) {
    .bottomSocialItem {
      display: none;
    }

    #revealCompass {
      display: none;
    }
  }

  @media (orientation: portrait) {
    #revealCompass {
      display: none;
    }
  }

  @media (orientation: portrait) and (max-width: 800px) {
    .bottomFooterAds {
      bottom: 12px;
    }

    .BottomBar {
      padding-bottom: 60px;
    }
  }

  .bottomRightMenu {
    width: calc(22% - 8px);
    min-width: 200px;
  }

  @media all and (orientation: landscape) and (max-width: 1200px) {
    .bottomRightMenu {
      width: calc(30% - 8px);
    }
  }
</style>

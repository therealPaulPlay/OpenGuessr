<!--bottom toolbar with reset button-->
<script>
  import RemoveAdsText from "$lib/components/RemoveAdsText.svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { reloadPanorama } from "$lib/stores/locationStore";
  import { helpPopup } from "$lib/stores/uiStore";
</script>

<div id="BottomBar" class="BottomBar">
  <div class="barMenu">
    <button
      class="standardButton bottomBarButton"
      id="resetButton"
      onclick={() => {
        playSound("basic_button");
        $reloadPanorama();
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
    <div class="standardButton bottomBarButton" id="confirmButton">
      <button
        class="socialItem"
        id="helpButton"
        onclick={() => {
          playSound("basic_button");
          $helpPopup = true;
        }}>?</button
      >
      <button class="socialItem" id="revealCompass">
        <img src="./img/discover_icon.png" alt="Toggle compass" class="socialIcon bottomBarIcon" />
      </button>
      <p id="guessText">Guess</p>
    </div>
  </div>
</div>
<div id="bottomFooterAds" class="bottomFooterAds leaderboardAds hideForSupporters bottomFooterAdsAd"></div>
<div class="bottomFooterAds leaderboardAds bottomFooterAdText hideForSupporters barMenu">
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

  @media all and (max-width: 1200px) {
    .bottomSocialItem {
      display: none;
    }
  }

  @media (orientation: portrait) and (max-width: 800px) {
    .BottomBar {
      padding-bottom: 60px;
    }
  }

  @media (orientation: portrait) and (max-width: 800px) {
    .bottomFooterAds {
      bottom: 12px;
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

  #confirmButton {
    width: fit-content;
    position: relative;
    padding-left: 10px;
    padding-right: 30px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 0;
  }

  :global(.innerConfirmButtonDisabled) {
    pointer-events: none !important;
    opacity: 0.5;
  }
</style>

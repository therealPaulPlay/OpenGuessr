<!-- previously known as the End Overlay, this screen shows the Result -->
<script>
  import StreakRestore from "$lib/components/StreakRestore.svelte";
  import RemoveAdsText from "$lib/components/RemoveAdsText.svelte";
  import {
    resultScreenEnabled,
    distanceText,
    motivationText,
    continueText,
    earnedExperience,
    experienceBarAnimated,
    showStreakDisplay,
    streakText,
  } from "$lib/stores/context-specific/resultScreenStore";
  import { openLocationOnMaps } from "$lib/utils/openLocationOnMaps";
  import { currentLocationLatitude, currentLocationLongitude } from "$lib/stores/locationStore";
  import { supporterLevel, isAuthenticated, experience } from "$lib/stores/accountStore";
  import { signupPopup } from "$lib/stores/uiStore";
  import { get } from "svelte/store";
  import { playSound } from "$lib/utils/soundManager";
  import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";

  let level = $state(1);
  let percentageWidth = $state("0%");

  experience.subscribe((value) => {
    level = getLevel();
    percentageWidth = getLevelFraction() * 100 + "%";
  })
</script>

<div id="EndOverlay" class:resultScreenHidden={!Boolean($resultScreenEnabled)}>
  <div id="endBottomArea">
    <StreakRestore />
    <div id="endBottomBar">
      <div class="floatingResultLeaderboardArea" style:display={$supporterLevel >= 2 ? "none" : ""}>
        <div class="floatingResultLeaderboardAd"></div>
        <RemoveAdsText text="Please consider supporting OpenGuessr to go ad-free." learnMore="true" />
      </div>
      <div id="resultBox">
        <p class="resultField" id="motivationText">{$motivationText}</p>
        <div id="mobileResultLeaderboardAdArea" class="resultField" style:display={$supporterLevel >= 2 ? "none" : ""}>
          <div id="mobileResultLeaderboardAd"></div>
          <RemoveAdsText text="Go Ad-Free." learnMore="true" />
        </div>
        <div class="resultField">
          <img src="/img/distance_icon.png" alt="Distance icon" id="distanceIcon" />
          <p id="distanceText">{$distanceText}</p>
        </div>
        {#if $isAuthenticated}
          <div id="XParea" class="resultField">
            <div id="supporterBoost">
              <p id="supporterBoostText">Supporter Boost (Default)</p>
            </div>
            <p id="endScreenLevelDisplay">Lvl. {level}</p>
            <div id="endScreenXPbar">
              <div
                class="XPbarResource"
                id="endScreenXPbarResource"
                class:XPbarAnimate={$experienceBarAnimated}
                style:width={percentageWidth}
              ></div>
            </div>
            <p id="endScreenXP">{$earnedExperience} XP</p>
            {#if $showStreakDisplay}
              <div id="streakDisplay">
                <img id="streakIcon" src="/img/streak_icon.png" alt="country streak" />
                <p id="endScreenStreakText">{$streakText}</p>
              </div>
            {/if}
          </div>
        {:else}
          <div id="XPbarNoAccount" class="resultField">
            <p id="signupPromptText">See & save your earned points!</p>
            <button
              id="resultSignupPrompt"
              class="standardButton white"
              onclick={() => {
                playSound("basic_button");
                signupPopup.set(true);
              }}>Sign up</button
            >
          </div>
        {/if}
        <div id="nextRoundArea">
          <button
            id="endScreenOpenLocation"
            class="standardButton white"
            onclick={() => {
              playSound("basic_button");
              openLocationOnMaps(get(currentLocationLatitude), get(currentLocationLongitude));
            }}
          >
            <img src="/img/streetview_icon.png" alt="Streetview symbol" class="socialIcon" id="streetviewIcon" />
          </button>
          <button id="nextRound" class="standardButton white">
            <p
              class="nextRoundText"
              style:pointer-events={$continueText.toLowerCase().includes("wait") ? "none" : ""}
              style:opacity={$continueText.toLowerCase().includes("wait") ? "0.5" : ""}
            >
              {$continueText}
            </p>
            <img id="nextRoundArrow" src="/img/arrow_icon.png" alt="Expand or close arrow" class="directionArrowIcon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  #EndOverlay {
    overflow: hidden;
    color: #eee;
    text-align: center;
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 13;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none;
    transition: opacity 250ms ease-out;
  }

  .resultScreenHidden {
    pointer-events: none !important;
    opacity: 0 !important;
  }

  .resultScreenHidden * {
    pointer-events: none !important;
  }

  #endScreenOpenLocation {
    padding: 10px;
    height: 100%;
    border-radius: 7px;
    font-size: 25px;
  }

  #endScreenOpenLocation:hover {
    filter: brightness(70%);
  }

  #streetviewIcon {
    vertical-align: -2px;
  }

  #resultBox {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px 20px;
    color: white;
    font-size: 25px;
    height: fit-content;
    max-width: 735px;
    flex-wrap: wrap;
    width: calc(100% - 20px);
    gap: 10px;
  }

  .resultField {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 7px;
    padding: 10px;
    flex-grow: 10;
    height: 40px;
    position: relative;
    transition:
      width 250ms ease,
      height 250ms ease;
    overflow: hidden;
  }

  #distanceIcon {
    width: 30px;
    height: 30px;
    margin-right: 10px;
  }

  #endBottomBar {
    display: flex;
    justify-content: center;
    align-items: center;
    height: fit-content;
    flex: 1;
    border-radius: 10px;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    pointer-events: auto;
  }

  #endBottomArea {
    position: sticky;
    height: fit-content;
    display: flex;
    bottom: 10px;
    margin-inline: 10px;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
    z-index: 13;
  }

  #motivationText {
    color: white;
    font-size: 25px;
    flex-grow: 100;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    min-width: 40%;
  }

  #mobileResultLeaderboardAdArea {
    min-width: 330px;
    max-width: 380px;
    height: 50px;
    max-height: 60px;
    padding: 5px;
    flex-grow: 1;
    position: relative;
  }

  #mobileResultLeaderboardAd {
    z-index: 1;
    overflow: hidden;
    text-align: center;
    width: 320px;
    height: 50px;
  }

  .floatingResultLeaderboardArea {
    width: 728px;
    height: 90px;
    display: none;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    position: absolute;
    top: -110px;
    left: 50%;
    transform: translate(-50%, 0);
    padding: 5px;
    pointer-events: auto;
  }

  .floatingResultLeaderboardAd {
    z-index: 1;
    width: 728px;
    height: 90px;
    text-align: center;
  }

  #XParea {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 7px;
    position: relative;
    flex-grow: 100;
    min-width: 300px;
    height: 40px;
  }

  @keyframes XPFade {
    0% {
      filter: brightness(1) contrast(1);
    }

    50% {
      filter: brightness(1.75) contrast(0.5);
    }

    100% {
      filter: brightness(1) contrast(1);
    }
  }

  #supporterBoost {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(21, 26, 32, 0.5);
    transition: opacity 250ms ease;
    pointer-events: none;
    opacity: 0;
    z-index: 2;
    border-radius: 7px;
  }

  #supporterBoost p {
    color: white;
    font-size: 25px;
  }

  #supporterBoostText {
    opacity: 0;
  }

  @keyframes supporterBoostTextMove {
    0% {
      opacity: 0;
      transform: translateX(-100%);
    }

    20% {
      opacity: 1;
      transform: translateX(0);
    }

    80% {
      opacity: 1;
      transform: translateX(0);
    }

    100% {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  :global(.supporterBoostTextMove) {
    animation: supporterBoostTextMove 2s ease-in-out;
  }

  #endScreenXPbar {
    flex-grow: 10;
    height: 15px;
    background-color: #ccc;
    border-radius: 7px;
    transition: none;
  }

  #XPbarNoAccount {
    color: white;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.2);
    line-height: 38px;
    justify-content: space-between;
  }

  #resultSignupPrompt {
    margin: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-right: -2px;
  }

  #signupPromptText {
    padding-inline: 10px;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .XPbarResource {
    height: 100%;
    border-radius: 7px;
    background-color: #00cc00;
    width: 0%;
    transition: none;
  }

  :global(.XPbarAnimate) {
    transition: width 1s ease;
    animation: XPFade 1s ease-in-out;
  }

  #endScreenXP {
    font-size: 22px;
    width: auto;
    vertical-align: middle;
    text-align: center;
    text-wrap: nowrap;
    flex-grow: 1;
    min-width: 115px;
  }

  #endScreenStreakText {
    font-size: 20px;
    vertical-align: middle;
    text-align: center;
    color: white;
    margin-left: 3px;
    text-wrap: nowrap;
  }

  #streakIcon {
    width: 25px;
    height: auto;
  }

  #streakDisplay {
    margin-right: auto;
    margin-left: 10px;
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: row;
    flex-grow: 1;
  }

  #endScreenLevelDisplay {
    font-size: 14px;
    width: auto;
    margin-left: auto;
    vertical-align: middle;
    text-align: center;
    padding-inline: 10px;
    margin-right: 5px;
    margin-left: 8px;
    color: white;
    background-color: #00cc00;
    border-radius: 7px;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #nextRound {
    font-size: 25px;
    border-radius: 7px;
    opacity: 100%;
    padding: 10px 30px;
  }

  #nextRoundArea {
    z-index: 15;
    margin: 15px 15px;
    position: absolute;
    bottom: 5px;
    right: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  #nextRound:hover {
    filter: brightness(0.7);
  }

  .nextRoundText {
    display: inline;
  }

  @media (min-width: 1900px) {
    .floatingResultLeaderboardArea {
      display: flex;
    }

    #mobileResultLeaderboardAdArea {
      display: none;
    }

    #endBottomArea {
      overflow: visible;
    }
  }

  @media all and (max-width: 1350px) {
    #resultBox {
      font-size: 22px;
    }

    #motivationText {
      font-size: 22px;
    }

    #endScreenXP {
      font-size: 20px;
    }

    #nextRoundArea {
      position: relative;
      right: 0;
      margin-bottom: 0;
      margin-top: 10px;
      width: calc(100% - 20px);
    }
  }
</style>

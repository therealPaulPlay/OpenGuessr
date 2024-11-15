<script>
  // import { restoreOldStreak } from "$lib/logic/accountLogic"; !CHANGE !TODO this later
  import { errorPopup } from "$lib/utils/errorHandling";
  import { playSound } from "$lib/utils/soundManager";
  import { initializeRewardedAd } from "$lib/utils/rewardedAds";
  
  let streakHeaderText = $state("Streak lost! (Default)");
  let streakHeaderColor = $state("white");

  let streakText = $state("Default");
  let streakWatchAd = $state();
  let streakBanner = $state(); // This is the entire Popup
  let streakAdDismissEnabled = $state(true);
  let formerStreak = 0;

  function restoreStreak() {
    streakWatchAd.style.opacity = "0.5";
    streakWatchAd.style.pointerEvents = "none";
    streakAdDismissEnabled = true;
    streakText = `<p>You have restored your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span> !</p>`;
    streakHeaderText = "Streak restored!";
    restoreOldStreak(formerStreak); // This is in accountLogic.js
  }

  export function toggleStreakWindow(oldStreak, alwaysHide) {
    if (typeof oldStreak == "number" && oldStreak != 0) {
      formerStreak = oldStreak;
    }

    if (streakBanner.style.display == "block" || alwaysHide) {
      streakBanner.style.maxHeight = "0px";
      setTimeout(() => {
        streakBanner.style.display = "none";
        resetStreakWindow();
      }, 250);
    } else {
      streakBanner.style.display = "block";
      setTimeout(() => {
        streakBanner.style.maxHeight = "1000px";
        resetStreakWindow();
      }, 20);
    }
  }

  function resetStreakWindow() {
    streakWatchAd.style.opacity = "1";
    streakWatchAd.style.pointerEvents = "auto";
    streakAdDismissEnabled = true;
    streakHeaderText = "Streak lost!";
    streakText = `<p>Support us by watching an ad and keep your streak of <span id="streakKeepAmount" class="highlight">${formerStreak}</span> !</p>`;
  }

  function showStreakAd() {
    streakWatchAd.style.opacity = "0.5";
    streakWatchAd.style.pointerEvents = "none";
    streakAdDismissEnabled = false;
    initializeRewardedAd(streakDismissRewardedAd, restoreStreak);
    playSound("basic_button");
  }

  function streakDismissRewardedAd(notAvailable, rewardClaimed) {
    if (notAvailable) {
      errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
      streakWatchAd.style.opacity = "1";
      streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
      streakAdDismissEnabled = true;
    } else {
      if (!rewardClaimed) {
        errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
        streakWatchAd.style.opacity = "1";
        streakWatchAd.style.pointerEvents = "auto"; //restore watch ad buttons
        streakAdDismissEnabled = true;
      } else {
        streakHeaderColor = "#00cf22";

        setTimeout(() => {
          streakHeaderColor = "white";
        }, 700);
      }
    }
  }
</script>

<div id="endScreenStreakRevive" bind:this={streakBanner}>
  <div class="popup-title">
    <h1 id="streakHeader" style:color={streakHeaderColor}>{streakHeaderText}</h1>
  </div>
  <p id="keepStreakText" bind:innerHTML={streakText} contenteditable="false">
    Support us by watching an ad and keep your streak of <span id="streakKeepAmount" class="experienceHighlight">0</span
    >
    !
  </p>
  <button
    id="streakWatchAd"
    class="streakButton standardButton closeButton"
    onclick={showStreakAd}
    bind:this={streakWatchAd}
  >
    Keep streak
    <img src="./img/streak_icon.png" class="socialIcon" alt="Streak Icon" />
  </button>
  <button
    class="standardButton closeButton whit streakAdDismiss {streakAdDismissEnabled ? '' : 'disabled'}"
    onclick={() => {
      playSound("basic_button");
      toggleStreakWindow(0, false);
    }}>Close</button
  >
</div>

<style>
  #endScreenStreakRevive {
    margin-top: auto;
    margin-left: 0;
    margin-right: auto;
    margin-bottom: 10px;
    z-index: 11;
    font-size: 25px;
    padding: 35px;
    padding-top: 15px;
    padding-bottom: 5px;
    border-radius: 10px;
    max-height: 1000px;
    transition:
      filter 250ms ease,
      max-height 250ms ease;
    user-select: none;
    color: white;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
    display: none; /* changed in code together with max-height */
    pointer-events: auto;
  }

  #streakWatchAd {
    padding: 10px 20px;
  }

  .streakAdDismiss {
    padding: 10px 20px;
    height: 50px;
    margin-left: auto;
    margin-right: 10px;
  }

  .streakAdDismiss.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .streakButton {
    background-color: #01a001;
    color: white;
    min-height: 50px;
  }

  #keepStreakText {
    max-width: 350px;
  }

  #streakHeader {
    transition: color 350ms ease;
  }

  @media all and (max-width: 1200px) {
    #streakHeader {
      font-size: 30px;
    }

    #endScreenStreakRevive {
      padding-top: 10px;
    }

    #streakWatchAd {
      margin-top: 20px;
    }

    .streakAdDismiss {
      margin-top: 20px;
    }
  }
</style>

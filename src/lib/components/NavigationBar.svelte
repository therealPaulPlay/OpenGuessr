<script>
  import { settingsPopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import Notification from "$lib/components/Notification.svelte";
  import { isAuthenticated, experience, supporterLevel, username } from "$lib/stores/accountStore";
  import { signupPopup } from "$lib/stores/uiStore";
  import { singleplayerOptionsPopup, multiplayerPopup } from "$lib/stores/uiStore";
  import { competition, multiplayer } from "$lib/stores/modeStore";
  import { resetLocalSave, checkAuthenticationStatus } from "$lib/logic/accountLogic";
  import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { onMount } from "svelte";

  function openSettings() {
    playSound("basic_button");
    settingsPopup.set(true);
  }

  // Fade out the left / right bar elements when the center is enlarged --------------------------------------------------
  let gamemodeTransitionTimeout;
  let sideMenusDisabled = $state(false);

  function centerMouseOut() {
    clearTimeout(gamemodeTransitionTimeout);
    gamemodeTransitionTimeout = setTimeout(() => {
      sideMenusDisabled = false;
    }, 200);
  }

  function centerMouseOver() {
    clearTimeout(gamemodeTransitionTimeout);
    sideMenusDisabled = true;
  }

  // Check if the username should be scrolled automatically (happens when it is too long) -------------------------------------------
  let accountNameText = $state();
  let scrollNameText = $state(false);

  function checkTextLength() {
    const textLength = accountNameText.length;
    scrollNameText = textLength > 10;
  }

  $effect(() => {
    checkTextLength();
  });

  // Prevent exiting mulitplayer etc. by starting using a conflicting feature -----------------------------------------------------------------------------

  let preventNavigateOut = $derived($competition || $multiplayer);

  // Level indicator (progress ring) -----------------------------------------------------------------------------------------
  let progressRingLevel = $state(0);

  onMount(() => {
    progressRingLevel = getLevel();
    setProgress(getLevelFraction());
  });

  experience.subscribe((value) => {
    progressRingLevel = getLevel();
    setProgress(getLevelFraction());
  });

  function setProgress(factor) {
    if (typeof window == "undefined") return;

    try {
      const circle = document.getElementById("progressRingCircle");
      const radius = circle.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;

      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      circle.style.strokeDashoffset = `${circumference}`;

      const offset = circumference - factor * circumference;
      circle.style.strokeDashoffset = offset;
    } catch (error) {
      console.warn("Error setting progress:", error);
    }
  }
</script>

<!-- mobile top nav bar -->
<nav class="mobileButtonArea topButtonArea">
  <div class="barMenu">
    {#if !$isAuthenticated}
      <button
        id="mobileLoginButton"
        class="standardButton loginButton mobileAccountButton"
        onclick={() => {
          playSound("basic_button");
          signupPopup.set(true);
        }}>Login</button
      >
    {/if}
    {#if $isAuthenticated}
      <button
        id="mobileProfileButton"
        class="standardButton accountButton mobileAccountButton white"
        onclick={() => {
          loadProfileFromId(localStorage.getItem("id"), true);
          playSound("basic_button");
        }}
      >
        <img class="socialBarIcons invertSocialBarIcon" src="/img/profile_icon.png" alt="Your profile" />
      </button>
    {/if}
    {#if $isAuthenticated}
      <button
        id="mobileLogoutButton"
        class="standardButton accountButton mobileAccountButton white"
        onclick={() => {
          playSound("basic_button");
          resetLocalSave();
          checkAuthenticationStatus();
        }}
      >
        <img class="logoutImage" src="/img/signout.png" alt="Log out." />
      </button>
    {/if}
    <a
      id="mobileCategoryButton"
      class="standardButton accountButton mobileAccountButton white"
      class:preventNavigateOut
      href="/maps"
      onclick={() => {
        playSound("basic_button");
      }}
    >
      <img class="socialBarIcons invertSocialBarIcon" src="/img/mobile_maps_icon.png" alt="Map Categories" />
    </a>
    <button
      id="mobileMultiplayerButton"
      class="standardButton accountButton mobileAccountButton white"
      class:preventNavigateOut
      onclick={() => {
        playSound("basic_button");
        multiplayerPopup.set(true);
      }}
    >
      <img class="socialBarIcons invertSocialBarIcon" src="/img/multiplayer_icon.png" alt="Open the multiplayer menu" />
    </button>
    <a
      id="mobileCompetitionsButton"
      class="standardButton accountButton mobileAccountButton white"
      class:preventNavigateOut
      href="/competitions"
      onclick={() => {
        playSound("basic_button");
      }}
    >
      <img class="socialBarIcons invertSocialBarIcon" src="/img/competitions_icon.png" alt="Competitions symbol" />
    </a>
    <a
      id="mobileLeaderboardButton"
      class="standardButton accountButton mobileAccountButton white"
      href="/leaderboard"
      onclick={() => {
        playSound("basic_button");
      }}
    >
      <img
        class="socialBarIcons invertSocialBarIcon"
        src="/img/leaderboards_icon.png"
        alt="Leaderboard for OpenGuessr"
      />
    </a>
  </div>
</nav>

<!-- Desktop top nav bar -->
<nav id="topButtonArea" class="topButtonArea">
  <div class="barMenu topBarSides topBarDesktop" class:sideMenuDisabled={sideMenusDisabled}>
    {#if !$isAuthenticated}
      <button
        class="standardButton loginButton"
        id="loginButton"
        alt="log in"
        onclick={() => {
          playSound("basic_button");
          signupPopup.set(true);
        }}>Log in</button
      >
    {/if}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="profileInfo"
      class:notSignedIn={!$isAuthenticated}
      id="profileInfo"
      class:profileInfoSupporter={$supporterLevel >= 1}
      onclick={() => {
        loadProfileFromId(localStorage.getItem("id"), true);
        playSound("basic_button");
      }}
    >
      <div id="accountNameArea">
        <p
          id="accountName"
          bind:textContent={accountNameText}
          contenteditable="false"
          class:namescroll={scrollNameText}
        >
          {$username}
        </p>
      </div>
      <div class="progressContainer">
        <svg class="progressRing" width="30" height="30">
          <defs>
            <linearGradient id="ringGradient" gradientTransform="rotate(240)">
              <stop offset="5%" stop-color="#37d738" />
              <stop offset="95%" stop-color="#22a826" />
            </linearGradient>
          </defs>
          <circle
            id="progressRingCircle"
            class="progressRingCircle"
            style="stroke-dasharray: 81.6814px, 81.6814px; stroke-dashoffset: 81.6814px;"
            stroke="url('#ringGradient')"
            stroke-width="4"
            fill="transparent"
            r="13"
            cx="15"
            cy="15"
          ></circle>
        </svg>
        <div id="progressRingLevel" class="progressRingText">{progressRingLevel}</div>
      </div>
    </div>
    {#if $isAuthenticated}
      <button
        class="standardButton accountButton"
        id="logoutButton"
        alt="log out"
        onclick={() => {
          playSound("basic_button");
          resetLocalSave();
          checkAuthenticationStatus();
        }}
      >
        <img class="logoutImage" src="/img/signout.png" alt="Log out" />
      </button>
    {/if}
  </div>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div class="barMenu topBarDesktop gameModeMenu" onmouseover={centerMouseOver} onmouseout={centerMouseOut} role="menu">
    <a
      id="leaderboardButton"
      class="standardButton accountButton white"
      class:preventNavigateOut
      href="/leaderboard"
      onclick={() => {
        playSound("basic_button");
      }}
    >
      <span class="topBarExpand">Leaderboard</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/leaderboards_icon.png"
        alt="Experience Leaderboard"
      />
    </a>
    <button
      id="multiplayerButton"
      class="accountButton standardButton white"
      class:preventNavigateOut
      onclick={() => {
        playSound("basic_button");
        multiplayerPopup.set(true);
      }}
    >
      <span class="topBarExpand">Multiplayer</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/multiplayer_icon.png"
        alt="Open the multiplayer menu"
      />
    </button>
    <a
      id="competitionsButton"
      class="standardButton accountButton white"
      class:preventNavigateOut
      href="/competitions"
      onclick={() => {
        playSound("basic_button");
      }}
    >
      <span class="topBarExpand">Competitions</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/competitions_icon.png"
        alt="Competitions symbol"
      />
    </a>
  </div>
  <div class="barMenu topBarSides topBarDesktop" class:sideMenuDisabled={sideMenusDisabled}>
    <a
      class="standardButton accountButton white"
      id="categoryMenuButton"
      class:preventNavigateOut
      href="/maps"
      onclick={() => {
        playSound("basic_button");
      }}
    >
      Map
      <img class="socialBarIcons invertSocialBarIcon" src="/img/mobile_maps_icon.png" alt="Map Categories" />
    </a>
    <button
      class="standardButton accountButton white"
      id="singleplayerOptionsButton"
      class:preventNavigateOut
      onclick={() => {
        playSound("basic_button");
        singleplayerOptionsPopup.set(true);
      }}
    >
      <img src="/img/joystick_icon.png" alt="one or five seconds" id="joystickIcon" class="socialBarIcons" />
    </button>
    <button class="standardButton accountButton white" id="settingsButton" onclick={openSettings}>
      <img src="/img/settings_icon.png" alt="settings" class="socialBarIcons" id="settingsIcon" />
    </button>
  </div>
  <Notification />
</nav>

<style>
  .profileInfo {
    border-radius: 5px;
    padding-left: 10px;
    height: 40px;
    margin-inline: 2px;
    max-height: 40px;
    background-color: rgba(168, 168, 187, 0.3);
    box-shadow: 0 3px 1px rgba(0, 0, 0, 0.1);
    border: 3px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
    transition:
      filter 250ms ease,
      transform 150ms ease;
    cursor: pointer;
    display: flex;
    grid: 5px;
    justify-content: center;
    align-items: center;
  }

  /* Disable certain buttons in Competitions, Multiplayer etc. to prevent users from leaving accidentally */
  .preventNavigateOut {
    pointer-events: none !important;
    opacity: 0.5 !important;
  }

  .profileInfo:hover {
    filter: brightness(0.7);
  }

  .profileInfo:active {
    transform: scale(0.95);
  }

  .profileInfoSupporter {
    background: linear-gradient(30deg, rgba(133, 230, 153, 0.3), rgba(255, 255, 255, 0.2));
  }

  :global(.namescroll) {
    animation: scrollText 5s ease-in-out infinite alternate;
  }

  @keyframes scrollText {
    0% {
      transform: translateX(5px);
    }

    100% {
      transform: translateX(calc(-100% + 75px));
      /* adjust second param to be max-width of element minus about 5px */
    }
  }

  .topButtonArea {
    position: fixed;
    width: 100%;
    top: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: all 250ms ease;
    z-index: 14;
    pointer-events: none;
  }

  .sideMenuDisabled {
    opacity: 0.8;
    transform: scale(0.95);
    filter: blur(1px);
  }

  .notSignedIn {
    opacity: 50%;
    pointer-events: none;
  }

  :global(.level) {
    display: flex;
    align-items: center;
    margin-right: 10px;
    color: white;
  }

  .mobileButtonArea {
    display: none;
  }

  .mobileAccountButton {
    padding-inline: 12px;
    text-decoration: none;
  }

  .socialBarIcons {
    width: 20px;
    height: auto;
    margin-inline: 2px;
    margin-bottom: -2px;
  }

  .shiftedSocialbarIcon {
    margin-right: 4px;
  }

  .invertSocialBarIcon {
    filter: invert();
  }

  #mobileLoginButton {
    background-color: var(--brand-color);
    color: white;
  }

  #mobileLoginButton {
    min-width: 100px;
  }

  #accountNameArea {
    max-width: 80px;
    overflow: hidden;
    white-space: nowrap;
    margin-top: 2px;
  }

  #accountName {
    color: white;
    display: inline-block;
    width: fit-content;
    margin-top: -3px;
    font-size: 22px;
  }

  .accountButton {
    min-height: 40px;
    max-height: 40px;
    background-color: rgba(168, 168, 187, 0.3);
    text-decoration: none;
  }

  .loginButton {
    min-height: 40px;
    max-height: 40px;
  }

  #settingsIcon {
    filter: invert();
  }

  .progressContainer {
    position: relative;
    width: 30px;
    height: 30px;
    margin-inline: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 50%;
  }

  .progressRing {
    transform: rotate(-90deg);
  }

  .progressRingCircle {
    transition: 0.35s stroke-dashoffset;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }

  .progressRingText {
    position: absolute;
    font-size: 15px;
    color: white;
    user-select: none;
  }

  .logoutImage {
    width: 22px;
    height: 22px;
    margin-left: 3px;
    margin-top: 4px;
    filter: invert();
  }

  .topBarExpand {
    max-width: 0px;
    transition: max-width 400ms cubic-bezier(0.45, 0.05, 0.55, 0.95);
    overflow: hidden;
    display: inline-block;
    vertical-align: bottom;
  }

  .gameModeMenu:hover .topBarExpand {
    max-width: 1000px;
  }

  @media all and (max-width: 1200px) {
    .topBarDesktop {
      display: none;
    }

    .mobileButtonArea {
      display: flex;
    }
  }
</style>

<script>
  import { settingsPopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import Notification from "$lib/components/Notification.svelte";
  import { isAuthenticated, experience, supporterLevel, username } from "$lib/stores/accountStore";
  import { singleplayerOptionsPopup } from "$lib/stores/uiStore";
  import { competition, multiplayer } from "$lib/stores/modeStore";
  import { get } from "svelte/store";

  function openSettings() {
    playSound("basic_button");
    settingsPopup.set(true);
  }

  // Fade out the left / right bar elements when the center is enlarged
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

  // Check if the username should be scrolled automatically (happens when it is too long)
  let accountNameText = $state();
  let scrollNameText = $state(false);

  function checkTextLength() {
    const textLength = accountNameText.length;
    scrollNameText = textLength > 10;
  }

  $effect(() => {
    checkTextLength();
  });

  let preventNavigateOut = $state(false);

  $effect(() => {
    preventNavigateOut = $competition || $multiplayer; // Check if certain buttons should be disabled to prevent navigating out (e.g. Starting a competition in Multiplayer)
  });
</script>

<div id="mobileButtonArea" class="topButtonArea">
  <div class="barMenu">
    <button id="mobileLoginButton" class="standardButton accountButton mobileAccountButton">Login</button>
    <button id="mobileProfileButton" class="standardButton accountButton mobileAccountButton">
      <img class="socialBarIcons invertSocialBarIcon" src="/img/profile_icon.png" alt="Your profile" />
    </button>
    <button id="mobileLogoutButton" class="standardButton accountButton mobileAccountButton">
      <img class="logoutImage" src="/img/signout.png" alt="Log out of your OpenGuessr account." />
    </button>
    <button id="mobileCategoryButton" class="standardButton accountButton mobileAccountButton" class:preventNavigateOut>
      <img class="socialBarIcons invertSocialBarIcon" src="/img/mobile_maps_icon.png" alt="Map Categories" />
    </button>
    <button
      id="mobileMultiplayerButton"
      class="standardButton accountButton mobileAccountButton"
      class:preventNavigateOut
    >
      <img class="socialBarIcons invertSocialBarIcon" src="/img/multiplayer_icon.png" alt="Open the multiplayer menu" />
    </button>
    <button
      id="mobileCompetitionsButton"
      class="standardButton accountButton mobileAccountButton"
      class:preventNavigateOut
    >
      <img class="socialBarIcons invertSocialBarIcon" src="/img/competitions_icon.png" alt="Competitions symbol" />
    </button>
    <button id="mobileLeaderboardButton" class="standardButton accountButton mobileAccountButton">
      <img
        class="socialBarIcons invertSocialBarIcon"
        src="/img/leaderboards_icon.png"
        alt="Leaderboard for OpenGuessr"
      />
    </button>
  </div>
</div>

<div id="topButtonArea" class="topButtonArea">
  <div class="barMenu topBarSides topBarDesktop" class:sideMenuDisabled={sideMenusDisabled}>
    <button class="standardButton accountButton" id="loginButton" type="button" alt="log in">Log in</button>
    <div class="profileInfo notSignedIn" id="profileInfo" class:profileInfoSupporter={supporterLevel >= 1}>
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
          <circle
            class="progressRingCircle"
            style="stroke-dasharray: 81.6814px, 81.6814px; stroke-dashoffset: 81.6814px;"
            stroke="#00cc00"
            stroke-width="4"
            fill="transparent"
            r="13"
            cx="15"
            cy="15"
          ></circle>
        </svg>
        <div id="progressRingLevel" class="progressRingText">1</div>
      </div>
    </div>
    <button class="standardButton accountButton" id="logoutButton" type="button" alt="log out">
      <img class="logoutImage" src="/img/signout.png" alt="Log out of your OpenGuessr account." />
    </button>
  </div>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div
    class="barMenu topBarDesktop"
    id="gamemodeMenu"
    onmouseover={centerMouseOver}
    onmouseout={centerMouseOut}
    role="menu"
  >
    <button id="leaderboardButton" class="standardButton accountButton" class:preventNavigateOut>
      <span class="topBarExpand">Leaderboard</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/leaderboards_icon.png"
        alt="Experience Leaderboard"
      />
    </button>
    <button id="multiplayerButton" class="accountButton standardButton" class:preventNavigateOut>
      <span class="topBarExpand">Multiplayer</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/multiplayer_icon.png"
        alt="Open the multiplayer menu"
      />
    </button>
    <button id="competitionsButton" class="standardButton accountButton" class:preventNavigateOut>
      <span class="topBarExpand">Competitions</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/competitions_icon.png"
        alt="Competitions symbol"
      />
    </button>
  </div>
  <div class="barMenu topBarSides topBarDesktop" class:sideMenuDisabled={sideMenusDisabled}>
    <button class="standardButton accountButton" id="categoryMenuButton" class:preventNavigateOut>
      Maps
      <img id="mapsArrow" src="/img/arrow_icon.png" alt="Expand or close arrow" class="socialBarIcons arrowIcon" />
    </button>
    <button
      class="standardButton accountButton"
      id="singleplayerOptionsButton"
      class:preventNavigateOut
      onclick={() => {
        playSound("basic_button");
        singleplayerOptionsPopup.set(true);
      }}
    >
      <img src="/img/joystick_icon.png" alt="one or five seconds" id="joystickIcon" class="socialBarIcons" />
    </button>
    <button class="standardButton accountButton" id="settingsButton" onclick={openSettings}>
      <img src="/img/settings_icon.png" alt="settings" class="socialBarIcons" id="settingsIcon" />
    </button>
  </div>
  <Notification />
</div>

<style>
  .profileInfo {
    border-radius: 5px;
    padding-left: 10px;
    height: 40px;
    margin-inline: 2px;
    max-height: 40px;
    background-color: rgba(168, 168, 187, 0.3);
    transition: filter 250ms ease;
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
</style>

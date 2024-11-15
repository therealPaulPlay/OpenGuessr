<script>
  import { settingsPopup } from "$lib/stores/UIStore";
  import { playSound } from "$lib/utils/soundManager";

  function openSettings() {
    playSound("basic_button");
    settingsPopup.set(true);
  }
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
    <button id="mobileCategoryButton" class="standardButton accountButton mobileAccountButton mobileHideInMultiplayer">
      <img class="socialBarIcons invertSocialBarIcon" src="/img/mobile_maps_icon.png" alt="Map Categories" />
    </button>
    <button
      id="mobileMultiplayerButton"
      class="standardButton accountButton mobileAccountButton mobileHideInMultiplayer"
    >
      <img class="socialBarIcons invertSocialBarIcon" src="/img/multiplayer_icon.png" alt="Open the multiplayer menu" />
    </button>
    <button
      id="mobileCompetitionsButton"
      class="standardButton accountButton mobileAccountButton mobileHideInMultiplayer"
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
  <div class="barMenu topBarSides topBarDesktop">
    <button class="standardButton accountButton" id="loginButton" type="button" alt="log in">Log in</button>
    <div class="profileInfo notSignedIn" id="profileInfo">
      <div id="accountNameArea">
        <p id="accountName">Guest</p>
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
  <div class="barMenu topBarDesktop" id="gamemodeMenu">
    <button id="leaderboardButton" class="standardButton accountButton">
      <span class="topBarExpand">Leaderboard</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/leaderboards_icon.png"
        alt="Experience Leaderboard"
      />
    </button>
    <button id="multiplayerButton" class="accountButton standardButton">
      <span class="topBarExpand">Multiplayer</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/multiplayer_icon.png"
        alt="Open the multiplayer menu"
      />
    </button>
    <button id="competitionsButton" class="standardButton accountButton">
      <span class="topBarExpand">Competitions</span>
      <img
        class="socialBarIcons invertSocialBarIcon shiftedSocialbarIcon"
        src="/img/competitions_icon.png"
        alt="Competitions symbol"
      />
    </button>
  </div>
  <div class="barMenu topBarSides topBarDesktop">
    <button class="standardButton accountButton" id="categoryMenuButton">
      Maps
      <img id="mapsArrow" src="/img/arrow_icon.png" alt="Expand or close arrow" class="socialBarIcons arrowIcon" />
    </button>
    <button class="standardButton accountButton" id="singleplayerOptionsButton">
      <img src="/img/joystick_icon.png" alt="one or five seconds" id="joystickIcon" class="socialBarIcons" />
    </button>
    <button class="standardButton accountButton" id="settingsButton" onclick={openSettings}>
      <img src="/img/settings_icon.png" alt="settings" class="socialBarIcons" id="settingsIcon" />
    </button>
  </div>
  <div id="notificationBar">
    <p id="notificationText">Default notification</p>
    <div class="notificationButtonBox">
      <button id="notificationAccept" class="standardButton accountButton">Accept</button>
      <button id="notificationDismiss" class="standardButton accountButton">
        <img alt="dismiss notification" class="friendRemoveIcon" src="/img/delete_icon.png" />
      </button>
    </div>
  </div>
</div>

<script>
  import { initializeAds } from "$lib/utils/ads";
  import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
  import { onMount } from "svelte";

  let { children } = $props();

  // Component Imports
  import LoadingFade from "$lib/components/LoadingFade.svelte";
  import ImageGuesser from "$lib/components/ImageGuesser.svelte";
  import ErrorPopup from "$lib/components/ErrorPopup.svelte";
  import SettingsPopup from "$lib/components/SettingsPopup.svelte";
  import NavigationBar from "$lib/components/NavigationBar.svelte";
  import TopLeftLogo from "$lib/components/TopLeftLogo.svelte";
  import MapModeIndicator from "$lib/components/MapModeIndicator.svelte";
  import LittleTimeVignette from "$lib/components/LittleTimeVignette.svelte";
  import MapHolder from "$lib/components/MapHolder.svelte";
  import MobileMapToggle from "$lib/components/MobileMapToggle.svelte";
  import Map from "$lib/components/Map.svelte";
  import SupporterPopup from "$lib/components/SupporterPopup.svelte";
  import ConfirmPopup from "$lib/components/ConfirmPopup.svelte";
  import BottomBar from "$lib/components/BottomBar.svelte";
  import PanoramaIframe from "$lib/components/PanoramaIframe.svelte";
  import HelpPopup from "$lib/components/HelpPopup.svelte";
  import SignupIframe from "$lib/components/SignupIframe.svelte";
  import DiscordPopup from "$lib/components/DiscordPopup.svelte";
  import SingleplayerOptions from "$lib/components/SingleplayerOptions.svelte";
  import TimerCountdown from "$lib/components/TimerCountdownOverlay.svelte";
  import SingleplayerNmpz from "$lib/components/SingleplayerNMPZ.svelte";
  import CountryGuesserBar from "$lib/components/CountryGuesserBar.svelte";
  import ResultScreen from "$lib/components/ResultScreen.svelte";
  import BeforeExitPopup from "$lib/components/BeforeExitPopup.svelte";
  import CaptchaPopup from "$lib/components/CaptchaPopup.svelte";
  import Authenticate from "$lib/components/Authenticate.svelte";
  import ProfilePopup from "$lib/components/ProfilePopup.svelte";
  import PinPopup from "$lib/components/PinPopup.svelte";
  import BadgePopup from "$lib/components/BadgePopup.svelte";
  import TroubleshootPopup from "$lib/components/TroubleshootPopup.svelte";
  import LinkJoinPopup from "$lib/components/LinkJoinPopup.svelte";
  import FriendBrowsePopup from "$lib/components/FriendBrowsePopup.svelte";
  import InboxPopup from "$lib/components/InboxPopup.svelte";

  // Start ads
  onMount(() => {
    checkGenerationTypeAndGenerate();
    initializeAds();

    // Prevent automatic "last button press" with space bar or enter key
    try {
      document.addEventListener("keydown", function (event) {
        var tag = event.target.tagName.toLowerCase();
        if (event.key === "Enter" || event.key === " ") {
          if (tag === "button") {
            event.preventDefault();
          }
        }
      });
    } catch (error) {
      console.warn("Error during keydown listener to prevent unwanted last button press:", error);
    }
  });
</script>

<svelte:head>
  <!-- Ad script and Cloudflare Turnstile Script -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
  <script src="https://hb.vntsm.com/v4/live/vms/sites/openguessr.com/index.js" async></script>
</svelte:head>

<TopLeftLogo />
<NavigationBar />

<!-- Log user in -->
<Authenticate />

<!-- Keywords -->
<h1 style:display="none">
  Openguessr - GeoGuessr free. Free Geoguesser alternative free open source geography geographie Geotastic world map
  geoguessr Geo Quiz kostenlos google streetview rainbolt zi8gzag travel geographie education spiel videospiel guess
  Multiplayer which country play with friends challenges karte rate welches land more than 5 minutes unlimited free play
  unendlich freies spiel without subscription pro with Duels
</h1>

<!-- Extended navbar map menu -->
<div class="extendedNavbar" id="extendedNavbar">
  <div id="extendedNavbarGradient"></div>
  <div id="extendedNavbarContent" class="mapArea">
    <!-- content -->
    <div class="mapBox">
      <p>General</p>
      <div class="mapArea">
        <button class="category" id="standardCategory" type="button">Standard</button>
        <button class="category" id="capitalCategory" type="button">Capitals</button>
        <button class="category" id="famousCategory" type="button">Famous</button>
      </div>
    </div>
    <div class="mapBox">
      <span class="mapsAccountLock">
        Free Account needed
        <img alt="locked" class="lockedIcon" src="/img/locked_icon.png" />
      </span>
      <p>Special modes</p>
      <div id="specialGamemodesArea" class="mapArea">
        <button class="category accountLock" id="dailyCompetition" type="button">Daily Competition</button>
        <button class="category accountLock" id="countryCategory" type="button">Country Guesser</button>
        <button class="category accountLock" id="imageCategory" type="button">Image Guesser</button>
      </div>
    </div>
    <div class="mapBox expandableMapBox" id="countriesMapBox">
      <span class="mapsAccountLock">
        Free Account needed
        <img alt="locked" class="lockedIcon" src="/img/locked_icon.png" />
      </span>
      <p>Countries</p>
      <div class="outerCountryCategoryContainer">
        <div class="expandableMapAreaFade" id="countryCategoriesFade"></div>
        <button class="standardButton mapAreaExpandButton" id="countryCategoriesExpand">
          <span id="countriesMoreText">More</span>
          <img id="arrowIconCountries" src="/img/arrow_icon.png" alt="Expand arrow" />
        </button>
        <div class="mapArea expandableCountryArea" id="expandableCountryArea">
          <!-- country map category buttons are generated in categoryMenu.js -->
        </div>
      </div>
    </div>
    <div class="mapBox">
      <p>OpenGuessr Education</p>
      <div class="mapArea">
        <a
          class="category educationCategory"
          id="educationGuidesLink"
          target="_blank"
          href="https://education.openguessr.com/guides"
        >
          Guides
        </a>
        <a
          class="category educationCategory"
          id="educationQuizzesLink"
          target="_blank"
          href="https://education.openguessr.com/quiz"
        >
          Quizzes
        </a>
        <a
          class="category educationCategory"
          id="educationCountriesLink"
          target="_blank"
          href="https://education.openguessr.com/countries"
        >
          Learn Countries
        </a>
      </div>
      <button class="categoryLink" id="discoverEducation">
        Master OpenGuessr
        <img class="discoverIcon" alt="discover more categories" src="/img/crown_icon.png" />
      </button>
    </div>
    <div class="mapBox">
      <span class="mapsAccountLock">
        Free Account needed
        <img alt="locked" class="lockedIcon" src="/img/locked_icon.png" />
      </span>
      <p>Continents</p>
      <div class="mapArea">
        <button class="category continentCategory accountLock" id="africaCategory" type="button">Africa</button>
        <button class="category continentCategory accountLock" id="asiaCategory" type="button">Asia</button>
        <button class="category continentCategory accountLock" id="europeCategory" type="button">Europe</button>
        <button class="category continentCategory accountLock" id="north_americaCategory" type="button">
          North America
        </button>
        <button class="category continentCategory accountLock" id="oceaniaCategory" type="button">Oceania</button>
        <button class="category continentCategory accountLock" id="south_americaCategory" type="button">
          South America
        </button>
      </div>
    </div>
    <div class="mapBox lastMapBox">
      <p>Community maps</p>
      <div id="communityMapArea" class="mapArea">
        <!-- country categories auto generated in categoryMenu.js, then added here automatically -->
      </div>
      <button class="categoryLink" id="discoverMaps" type="button">
        Discover all Community Maps
        <img class="discoverIcon" alt="discover more categories" src="/img/discover_icon.png" />
      </button>
    </div>
  </div>
</div>
<LoadingFade />
<ErrorPopup />
<ConfirmPopup />
<CaptchaPopup />
<ProfilePopup />
<BadgePopup />
<PinPopup />
<SupporterPopup />
<FriendBrowsePopup />
<InboxPopup />
<BeforeExitPopup />
<HelpPopup />
<SignupIframe />
<TroubleshootPopup />
<SettingsPopup />
<SingleplayerOptions />
<DiscordPopup />
<LinkJoinPopup />
<div class="popupHolder">
  <!-- Multiplayer window -->
  <div id="multiplayerSelectionWindow" class="uiWindow">
    <div class="popup-title">
      <h1>Multiplayer</h1>
    </div>
    <div id="multiplayerWindowMain">
      <div class="multiplayerHorizontalAlign">
        <div class="groupPartyButtons">
          <button id="multiplayerSelectJoin" class="standardButton multiplayerSelect">Join</button>
          <button id="multiplayerSelectHost" class="standardButton multiplayerSelect">Host</button>
        </div>
        <div class="groupPartyButtons">
          <button id="multiplayerSelectDuels" class="standardButton multiplayerSelect">
            Find Duel
            <img
              id="findIcon"
              class="socialBarIcons"
              style="margin-left: 5px;"
              src="/img/find_icon.png"
              alt="Lightning error symbol"
            />
          </button>
        </div>
      </div>
      <div class="multiplayerFriendArea">
        <p id="noFriendsText">Sign up to add friends!</p>
        <div id="friendBox" class="friendBox">
          <!-- friends will be programmatically added in here -->
        </div>
        <div class="friendButtonArea">
          <button class="standardButton" id="browseUsersFriends">Add friends +</button>
          <button class="standardButton" id="openFriendInbox">
            <img alt="inbox icon" src="/img/inbox_icon.png" id="inboxIcon" /> <!-- change path to inbox_icon_new if $inboxIconNew from inboxStore is true-->
          </button>
        </div>
      </div>
      <div class="infoNote">
        <div id="troubleshootingArea">
          <p id="issuesTroubleshootText">
            <img
              id="errorIcon"
              class="socialBarIcons"
              src="/img/error_icon.png"
              alt="Lightning error symbol"
              style="opacity: 60%;"
            />
            Having issues?
          </p>
          <button class="white standardButton" id="troubleshootGuideButton">Troubleshooting Guide</button>
        </div>
      </div>
    </div>
    <div id="multiplayerWindowJoin" style="display: none;">
      <div class="multiplayerJoinAlign">
        <div class="multiplayerJoinField">
          <p id="multiplayerJoinInfo" class="multiplayerInputInfo">Enter the room code (default).</p>
          <input id="roomCodeInput" type="text" class="multiplayerInput" placeholder="Room code" />
        </div>
        <button id="multiplayerJoin" class="standardButton">Join</button>
      </div>
    </div>
    <div id="multiplayerWindowHost" style="display: none;">
      <div class="multiplayerCreationArea">
        <div id="roomCreationSettings" class="multiplayerHostSettings">
          <div>
            <p>Rounds:</p>
            <div class="ticker">
              <button id="roundMinus" class="standardButton white">-</button>
              <p id="roundAmountText" class="tickerText">3</p>
              <button id="roundPlus" class="standardButton white">+</button>
            </div>
          </div>
          <div>
            <p>Round Length:</p>
            <div class="ticker">
              <button id="lengthMinus" class="standardButton white">-</button>
              <p id="roundLengthText" class="tickerText">2</p>
              <p class="tickerNote">sec</p>
              <button id="lengthPlus" class="standardButton white">+</button>
            </div>
          </div>
        </div>
        <div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
          <p>Restrictions:</p>
          <button id="toggleRestrictions" class="standardButton white">Standard</button>
        </div>
        <div id="roomCreationTeams" class="roomCreationModule multiplayerHostSettings">
          <p>Teams:</p>
          <div class="ticker">
            <button id="teamsMinus" class="standardButton white">-</button>
            <p id="teamAmountText" class="tickerText">no</p>
            <p class="tickerNote">teams</p>
            <button id="teamsPlus" class="standardButton white">+</button>
          </div>
        </div>
        <div id="roomCreationMap" style="opacity: 0.5;" class="roomCreationModule multiplayerHostSettings">
          <p>Selected Map:</p>
          <p id="multiplayerMapDisplay">Default</p>
        </div>
        <div id="hostCodeArea" class="multiplayerHostCodeArea">
          <div id="roomCodeDisplayArea">
            <p>Join with code:</p>
            <h1 id="roomCodeDisplay">Default</h1>
          </div>
          <div id="teamsDisplay" class="roomCreationModule multiplayerHostSettings">
            <p id="teamsDisplayText">Nothing to show</p>
            <p id="smallJoinCounter">0</p>
          </div>
          <div id="friendsInviteDisplay" class="roomCreationModule multiplayerHostSettings">
            <div id="roomCreationFriendsBox" class="roomCreationFriendsBox">
              <!-- online players will be added here programmatically -->
            </div>
          </div>
        </div>
        <div class="multiplayerHostSubmitArea">
          <div id="innerSubmitAreaBlock">
            <button id="roomcodeLink" class="copyLinkButton standardButton">
              <img id="linkIcon" class="socialIcon" src="/img/link_icon.png" alt="copy link" />
            </button>
            <button id="multiplayerHost" class="standardButton">Create room</button>
          </div>
        </div>
      </div>
    </div>
    <div id="multiplayerWindowDuel" style="display: none;">
      <div class="multiplayerJoinAlign">
        <p id="multiplayerDuelInfo" class="multiplayerDuelStatus">Status OK</p>
        <button id="multiplayerDuelRetry" class="standardButton">Try Again</button>
      </div>
    </div>
    <button id="multiplayerSelectorClose" class="standardButton white closeButton">Close</button>
    <button id="multiplayerSelectorBack" class="standardButton white closeButton" stlye="display: none">Back</button>
  </div>
</div>
<ResultScreen />
<div id="blackBackground"></div>
<div id="nmpzBackground"></div>
<SingleplayerNmpz />
<LittleTimeVignette />
<TimerCountdown />
<div id="duelsOverlay">
  <h1>Your opponent has guessed</h1>
  <p id="duelsOverlaySubtitle">Time reduced to 15s.</p>
</div>
<div id="multiplayerFade">
  <h1 id="multiplayerTitle">Multiplayer Default title</h1>
  <div id="multiplayerTable"></div>
  <button id="endMultiplayerRematchButton" class="standardButton">Play again</button>
  <button id="endMultiplayerRoundButton" class="standardButton">End round</button>
</div>
<ImageGuesser />
<div class="viewContainer">
  <PanoramaIframe />
  <CountryGuesserBar />
</div>
<MapHolder>
  <MobileMapToggle />
  <Map />
  <MapModeIndicator />
</MapHolder>
<div id="multiplayerChat">
  <div id="multiplayerChatMessages">
    <p id="multiplayerMessageBox"></p>
  </div>
  <div id="bottomMultiplayerChatArea">
    <input maxlength="100" type="text" id="multiplayerMessageInput" placeholder="Type your message..." />
    <button id="multiplayerSendButton" class="standardButton">Send</button>
  </div>
</div>
<BottomBar />

<!-- Render children such as overlayed pages and menus -->
{@render children?.()}

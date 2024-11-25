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
  import FriendBrowserPopup from "$lib/components/FriendBrowserPopup.svelte";
  import InboxPopup from "$lib/components/InboxPopup.svelte";
  import MultiplayerPopup from "$lib/components/MultiplayerPopup.svelte";
  import Chat from "$lib/components/Chat.svelte";
  import InitMultiplayer from "$lib/components/InitMultiplayer.svelte";
  import TimeReducedOverlay from "$lib/components/TimeReducedOverlay.svelte";

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

<!-- Log user in -->
<Authenticate />

<!-- Load Peer JS and check for Join URL -->
<InitMultiplayer />

<TopLeftLogo />
<NavigationBar />

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
<FriendBrowserPopup />
<InboxPopup />
<BeforeExitPopup />
<HelpPopup />
<SignupIframe />
<TroubleshootPopup />
<SettingsPopup />
<SingleplayerOptions />
<DiscordPopup />
<LinkJoinPopup />
<MultiplayerPopup />
<ResultScreen />
<div id="blackBackground"></div>
<div id="nmpzBackground"></div>
<SingleplayerNmpz />
<LittleTimeVignette />
<TimerCountdown />
<TimeReducedOverlay />
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
<Chat />
<BottomBar />

<!-- Render children such as overlayed pages and menus -->
{@render children?.()}

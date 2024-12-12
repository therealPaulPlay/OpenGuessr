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
  import MultiplayerOverlay from "$lib/components/MultiplayerOverlay.svelte";
  import BlinkRestrictionFade from "$lib/components/BlinkRestrictionFade.svelte";
  import CrazyGames from "$lib/components/CrazyGames.svelte";

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

<!-- Keywords -->
<h1 style:display="none">
  Openguessr - GeoGuessr free. Free Geoguesser alternative free open source geography geographie Geotastic world map
  geoguessr Geo Quiz kostenlos google streetview rainbolt zi8gzag travel geographie education spiel videospiel guess
  Multiplayer which country play with friends challenges karte rate welches land more than 5 minutes unlimited free play
  unendlich freies spiel without subscription pro with Duels
</h1>

<!-- 3rd party -->
<CrazyGames />

<!-- Log user in -->
<Authenticate />

<!-- Load Peer JS and check for Join URL -->
<InitMultiplayer />

<!-- Logo and Navbar -->
<TopLeftLogo />
<NavigationBar />

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
<BlinkRestrictionFade />
<LittleTimeVignette />
<TimerCountdown />
<TimeReducedOverlay />
<MultiplayerOverlay />
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

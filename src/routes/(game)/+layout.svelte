<script>
	import { initializeAds } from "$lib/utils/ads";
	import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
	import { onMount } from "svelte";
	import initOverfade from "overfade";

	let { children } = $props();

	// Component Imports
	import { playlightSDK } from "$lib/stores/context-specific/platformSettingsStore";
	import LoadingOverlay from "$lib/components/LoadingOverlay.svelte";
	import ImageGuesser from "$lib/components/ImageGuesser.svelte";
	import ErrorPopup from "$lib/components/ErrorPopup.svelte";
	import SettingsPopup from "$lib/components/SettingsPopup.svelte";
	import NavigationBar from "$lib/components/NavigationBar.svelte";
	import TopLeftLogo from "$lib/components/TopLeftLogo.svelte";
	import MapModeIndicator from "$lib/components/MapModeIndicator.svelte";
	import LittleTimeVignette from "$lib/components/LittleTimeVignette.svelte";
	import MapHolder from "$lib/components/MapHolder.svelte";
	import MobileMapToggles from "$lib/components/MobileMapToggles.svelte";
	import Map from "$lib/components/Map.svelte";
	import SupporterPopup from "$lib/components/SupporterPopup.svelte";
	import ConfirmPopup from "$lib/components/ConfirmPopup.svelte";
	import BottomBar from "$lib/components/BottomBar.svelte";
	import PanoramaIframe from "$lib/components/PanoramaIframe.svelte";
	import HelpPopup from "$lib/components/HelpPopup.svelte";
	import SignupIframe from "$lib/components/SignupIframe.svelte";
	import DiscordPopup from "$lib/components/DiscordPopup.svelte";
	import TimerCountdown from "$lib/components/TimerCountdownOverlay.svelte";
	import CountryGuesserBar from "$lib/components/CountryGuessrBar.svelte";
	import ResultScreen from "$lib/components/ResultScreen.svelte";
	import CaptchaPopup from "$lib/components/CaptchaPopup.svelte";
	import Authenticate from "$lib/components/Authenticate.svelte";
	import ProfilePopup from "$lib/components/ProfilePopup.svelte";
	import PinPopup from "$lib/components/PinPopup.svelte";
	import BadgePopup from "$lib/components/BadgePopup.svelte";
	import LinkJoinPopup from "$lib/components/LinkJoinPopup.svelte";
	import FriendBrowserPopup from "$lib/components/FriendBrowserPopup.svelte";
	import InboxPopup from "$lib/components/InboxPopup.svelte";
	import TimeReducedOverlay from "$lib/components/TimeReducedOverlay.svelte";
	import MultiplayerOverlay from "$lib/components/MultiplayerOverlay.svelte";
	import BlinkRestrictionFade from "$lib/components/FadeRestriction.svelte";
	import MapAttribution from "$lib/components/MapAttribution.svelte";
	import CrazyGames from "$lib/components/CrazyGames.svelte";
	import DuelResultPopup from "$lib/components/DuelResultPopup.svelte";
	import ReportIframePopup from "$lib/components/ReportIframePopup.svelte";
	import FlagPickerPopup from "$lib/components/FlagPickerPopup.svelte";
	import DivisionMatchHistoryPopup from "$lib/components/DivisionMatchHistoryPopup.svelte";
	import MusicController from "$lib/components/MusicController.svelte";
	import GuestNamePickerPopup from "$lib/components/GuestNamePickerPopup.svelte";
	import ShopPurchaseAnimation from "$lib/components/ShopPurchaseAnimation.svelte";
	import BugspotIframePopup from "$lib/components/BugspotIframePopup.svelte";
	import RoundLogPopup from "$lib/components/RoundLogPopup.svelte";
	import TournamentInfoPopup from "$lib/components/TournamentInfoPopup.svelte";
	import TournamentMatchResultsPopup from "$lib/components/TournamentMatchResultsPopup.svelte";
	import ChatManagePopup from "$lib/components/ChatManagePopup.svelte";
	import FullscreenNavigation from "$lib/components/FullscreenNavigation.svelte";
	import ChatMobilePopup from "$lib/components/ChatMobilePopup.svelte";
	import ChatHolder from "$lib/components/ChatHolder.svelte";

	// Start ads
	onMount(() => {
		initOverfade(); // Init overfade
		checkGenerationTypeAndGenerate();
		initializeAds();

		// Prevent automatic "last button press" with space bar or enter key
		try {
			document.addEventListener("keydown", function (event) {
				var tag = event.target.tagName.toLowerCase();
				if (event.key === "Enter" || event.key === " ") {
					if (tag === "button") event.preventDefault();
				}
			});
		} catch (error) {
			console.warn("Error adding keydown listener to prevent unwanted last button press:", error);
		}
	});

	// Load Playlight
	onMount(async () => {
		try {
			if (new URLSearchParams(window.location.search).get("crazy-games")) return; // Don't load Playlight on CG
			const module = await import("https://sdk.playlight.dev/playlight-sdk.es.js");
			$playlightSDK = module.default;
			$playlightSDK.init({
				exitIntent: {
					enabled: false,
				},
			});
		} catch (error) {
			console.error("Error loading the Playlight SDK:", error);
		}
	});
</script>

<svelte:head>
	<!-- Ad script -->
	<script src="https://hb.vntsm.com/v4/live/vms/sites/openguessr.com/index.js" async></script>

	<!-- Leaflet CSS -->
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />

	<!-- Playlight CSS -->
	<link rel="stylesheet" href="https://sdk.playlight.dev/playlight-sdk.css" />
</svelte:head>

<!-- Keywords -->
<h1 style:display="none">
	Openguessr is like GeoGuessr free and unlimited. A free GeoGuesser alternative like Geotastic, open source, best for
	geography learners (in German Geographie). Place the pin on the world map in this geoguessr-inspired geo quiz.
	Kostenlos (free) with Google Street View or streetview. Geography and travel creators like Rainbolt and Zi8gZag are
	popular in the education world. Can you guess where you are without a subscription, in multiplayer with friends or in
	online duels? Guess the country, rate das Land!
</h1>

<!-- 3rd party -->
<CrazyGames />

<!-- Log user in -->
<Authenticate />

<!-- Logo and Navbar -->
<TopLeftLogo />
<NavigationBar />

<!-- Music -->
<MusicController />

<LoadingOverlay />
<ErrorPopup />
<FullscreenNavigation />
<ConfirmPopup />
<CaptchaPopup />
<ShopPurchaseAnimation />
<ProfilePopup />
<BadgePopup />
<PinPopup />
<FlagPickerPopup />
<SupporterPopup />
<FriendBrowserPopup />
<DivisionMatchHistoryPopup />
<TournamentInfoPopup />
<TournamentMatchResultsPopup />
<InboxPopup />
<HelpPopup />
<DuelResultPopup />
<SignupIframe />
<SettingsPopup />
<DiscordPopup />
<LinkJoinPopup />
<RoundLogPopup />
<ChatManagePopup />
<ChatMobilePopup />
<GuestNamePickerPopup />
<ResultScreen />
<BlinkRestrictionFade />
<LittleTimeVignette />
<TimerCountdown />
<TimeReducedOverlay />
<MultiplayerOverlay />
<ReportIframePopup />
<BugspotIframePopup />
<ImageGuesser />
<PanoramaIframe />
<CountryGuesserBar />
<MapHolder>
	<MapAttribution />
	<MobileMapToggles />
	<Map />
	<MapModeIndicator />
</MapHolder>
<ChatHolder />
<BottomBar />

<!-- Render children such as overlayed pages and menus -->
{@render children?.()}

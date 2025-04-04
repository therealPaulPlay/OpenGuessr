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
	import CaptchaPopup from "$lib/components/CaptchaPopup.svelte";
	import Authenticate from "$lib/components/Authenticate.svelte";
	import ProfilePopup from "$lib/components/ProfilePopup.svelte";
	import PinPopup from "$lib/components/PinPopup.svelte";
	import BadgePopup from "$lib/components/BadgePopup.svelte";
	import TroubleshootPopup from "$lib/components/TroubleshootPopup.svelte";
	import LinkJoinPopup from "$lib/components/LinkJoinPopup.svelte";
	import FriendBrowserPopup from "$lib/components/FriendBrowserPopup.svelte";
	import InboxPopup from "$lib/components/InboxPopup.svelte";
	import Chat from "$lib/components/Chat.svelte";
	import TimeReducedOverlay from "$lib/components/TimeReducedOverlay.svelte";
	import MultiplayerOverlay from "$lib/components/MultiplayerOverlay.svelte";
	import BlinkRestrictionFade from "$lib/components/BlinkRestrictionFade.svelte";
	import CrazyGames from "$lib/components/CrazyGames.svelte";
	import DuelResultPopup from "$lib/components/DuelResultPopup.svelte";
	import ReportIframePopup from "$lib/components/ReportIframePopup.svelte";
	import FlagPickerPopup from "$lib/components/FlagPickerPopup.svelte";
	import DivisionMatchHistoryPopup from "$lib/components/DivisionMatchHistoryPopup.svelte";
	import { playlightSDK } from "$lib/stores/context-specific/platformSettingsStore";

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

	// Load Playlight
	onMount(async () => {
		try {
			if (new URLSearchParams(window.location.search).get("crazy-games")) return; // Don't load Playlight on CG
			const module = await import("https://sdk.playlight.dev/playlight-sdk.es.js");
			$playlightSDK = module.default;
			await $playlightSDK.init({
				exitIntent: {
					enabled: false,
				},
				button: {
					visible: false,
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

<LoadingFade />
<ErrorPopup />
<ConfirmPopup />
<CaptchaPopup />
<ProfilePopup />
<BadgePopup />
<PinPopup />
<FlagPickerPopup />
<SupporterPopup />
<FriendBrowserPopup />
<DivisionMatchHistoryPopup />
<InboxPopup />
<HelpPopup />
<DuelResultPopup />
<SignupIframe />
<TroubleshootPopup />
<SettingsPopup />
<SingleplayerOptions />
<DiscordPopup />
<LinkJoinPopup />
<ResultScreen />
<BlinkRestrictionFade />
<LittleTimeVignette />
<TimerCountdown />
<TimeReducedOverlay />
<MultiplayerOverlay />
<ReportIframePopup />
<ImageGuesser />
<PanoramaIframe />
<CountryGuesserBar />
<MapHolder>
	<MobileMapToggle />
	<Map />
	<MapModeIndicator />
</MapHolder>
<Chat />
<BottomBar />

<!-- Render children such as overlayed pages and menus -->
{@render children?.()}

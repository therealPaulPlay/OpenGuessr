<script>
	import { initializeAds } from "$lib/utils/ads";
	import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
	import { onMount } from "svelte";
	import initOverfade from "overfade";
	import { playSound } from "$lib/utils/soundManager";
	import { ConfirmPopup, ErrorPopup, Notification } from "openguessr-ui";

	let { children } = $props();

	// Component imports
	import LoadingOverlay from "$lib/components/LoadingOverlay.svelte";
	import ImageGuesser from "$lib/components/ImageGuesser.svelte";
	import SettingsPopup from "$lib/components/SettingsPopup.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import MapModeIndicator from "$lib/components/MapModeIndicator.svelte";
	import LittleTimeVignette from "$lib/components/LittleTimeVignette.svelte";
	import MapHolder from "$lib/components/MapHolder.svelte";
	import MobileMapToggles from "$lib/components/MobileMapToggles.svelte";
	import Map from "$lib/components/Map.svelte";
	import BottomBar from "$lib/components/BottomBar.svelte";
	import Panorama from "$lib/components/Panorama.svelte";
	import SignupIframe from "$lib/components/SignupIframe.svelte";
	import TimerCountdown from "$lib/components/TimerCountdownOverlay.svelte";
	import CountryGuesserBar from "$lib/components/CountryGuessrBar.svelte";
	import ResultScreen from "$lib/components/ResultScreen.svelte";
	import ProfilePopup from "$lib/components/ProfilePopup.svelte";
	import PinPopup from "$lib/components/PinPopup.svelte";
	import BadgePopup from "$lib/components/BadgePopup.svelte";
	import LinkJoinPopup from "$lib/components/LinkJoinPopup.svelte";
	import RejoinPopup from "$lib/components/RejoinPopup.svelte";
	import FriendBrowserPopup from "$lib/components/FriendBrowserPopup.svelte";
	import InboxPopup from "$lib/components/InboxPopup.svelte";
	import OutboxPopup from "$lib/components/OutboxPopup.svelte";
	import TimeReducedOverlay from "$lib/components/TimeReducedOverlay.svelte";
	import MultiplayerOverlay from "$lib/components/MultiplayerOverlay.svelte";
	import BlinkRestrictionFade from "$lib/components/FadeRestriction.svelte";
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
	import ModerationPopup from "$lib/components/Moderation.svelte";
	import MainMenu from "$lib/components/MainMenu.svelte";
	import ChatMobilePopup from "$lib/components/ChatMobilePopup.svelte";
	import ChatHolder from "$lib/components/ChatHolder.svelte";
	import MatchOverviewPopup from "$lib/components/MatchOverviewPopup.svelte";
	import MessagesPopup from "$lib/components/MessagesPopup.svelte";
	import CompetitionResultPopup from "$lib/components/CompetitionResultPopup.svelte";
	import Authentication from "$lib/components/Authentication.svelte";

	// Load panorama, ads, overfade etc.
	onMount(() => {
		initOverfade();
		checkGenerationTypeAndGenerate();
		initializeAds();
	});
</script>

<svelte:head>
	<!-- Ad script (inlined to bake it into the html, skips load on native) -->
	{@html `<script>
		if (!window.Capacitor?.isNativePlatform() && !window.Desktop) {
			const script = document.createElement("script");
			script.src = "https://cdn.fuseplatform.net/publift/tags/2/4180/fuse.js";
			script.async = true;
			document.head.appendChild(script);
		}
	</script>`}
</svelte:head>

<!-- Prevent automatic "last button press" on space bar or enter key press -->
<svelte:document
	onkeydown={(event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.tagName === "BUTTON" && (event.key === "Enter" || event.key === " ")) {
			event.preventDefault();
		}
	}}
/>

<!-- Log user in -->
<Authentication />

<!-- Logo and Notification -->
<TopBar />
<Notification onaccept={() => playSound("basic_button")} ondismiss={() => playSound("basic_button")} />

<!-- Music -->
<MusicController />

<LoadingOverlay />
<ErrorPopup />
<MainMenu />
<ConfirmPopup onconfirm={() => playSound("basic_button")} />
<ShopPurchaseAnimation />
<MessagesPopup />
<ProfilePopup />
<BadgePopup />
<PinPopup />
<FlagPickerPopup />
<FriendBrowserPopup />
<DivisionMatchHistoryPopup />
<MatchOverviewPopup />
<TournamentInfoPopup />
<TournamentMatchResultsPopup />
<InboxPopup />
<OutboxPopup />
<CompetitionResultPopup />
<DuelResultPopup />
<SignupIframe />
<SettingsPopup />
<LinkJoinPopup />
<RejoinPopup />
<RoundLogPopup />
<ModerationPopup />
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
<Panorama />
<CountryGuesserBar />
<MapHolder>
	<MobileMapToggles>
		<MapModeIndicator mobile={true} />
	</MobileMapToggles>
	<Map />
	<MapModeIndicator mobile={false} />
</MapHolder>
<ChatHolder />
<BottomBar />

<!-- Render children such as overlayed pages and menus -->
{@render children?.()}

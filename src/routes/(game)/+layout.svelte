<script>
	import { initializeAds } from "$lib/utils/ads";
	import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import initOverfade from "overfade";
	import { playSound } from "$lib/utils/soundManager";
	import { ConfirmPopup, ErrorPopup, Notification } from "openguessr-ui";

	let { children } = $props();

	// Component Imports
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
	import FriendBrowserPopup from "$lib/components/FriendBrowserPopup.svelte";
	import InboxPopup from "$lib/components/InboxPopup.svelte";
	import OutboxPopup from "$lib/components/OutboxPopup.svelte";
	import TimeReducedOverlay from "$lib/components/TimeReducedOverlay.svelte";
	import MultiplayerOverlay from "$lib/components/MultiplayerOverlay.svelte";
	import BlinkRestrictionFade from "$lib/components/FadeRestriction.svelte";
	import CrazyGames from "$lib/components/CrazyGames.svelte";
	import Y8Games from "$lib/components/Y8Games.svelte";
	import Playgama from "$lib/components/Playgama.svelte";
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
	import Navigation from "$lib/components/MainMenu.svelte";
	import ChatMobilePopup from "$lib/components/ChatMobilePopup.svelte";
	import ChatHolder from "$lib/components/ChatHolder.svelte";
	import MatchOverviewPopup from "$lib/components/MatchOverviewPopup.svelte";
	import MessagesPopup from "$lib/components/MessagesPopup.svelte";
	import CompetitionResultPopup from "$lib/components/CompetitionResultPopup.svelte";
	import Authentication from "$lib/components/Authentication.svelte";

	// Load panorama, ads, overfade etc.
	onMount(async () => {
		initOverfade();
		checkGenerationTypeAndGenerate();
		initializeAds();
	});
</script>

<svelte:head>
	<!-- Ad script -->
	<script src="https://cdn.fuseplatform.net/publift/tags/2/4180/fuse.js" async></script>
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

<!-- Keywords -->
<h1 style:display="none">
	Free GeoGuessr alternative with unlimited playtime and multiplayer. Play GeoGuessr free of charge and learn geography
	by guessing where you are!
</h1>

<h2 style:display="none">
	OpenGuessr is like GeoGuessr, but free and unlimited, enabling you to guess the location without a subscription
	(kostenlos, gratis). The game includes online multiplayer to play with friends, is unblocked, partially open-source,
	and uses Google Street View. Can you guess the country, or even guess where you are? Travel across the world map today
	and become the next Rainbolt.
</h2>

<!-- 3rd party -->
<CrazyGames />
<Y8Games />
<Playgama />

<!-- Log user in -->
<Authentication />

<!-- Logo and Notification -->
<TopBar />
<Notification
	top={page.url.pathname === "/" ? "var(--box-margin)" : "var(--layout-margin)"}
	onaccept={() => playSound("basic_button")}
	ondismiss={() => playSound("basic_button")}
/>

<!-- Music -->
<MusicController />

<LoadingOverlay />
<ErrorPopup />
<Navigation />
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

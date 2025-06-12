<script>
	import { settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import Notification from "$lib/components/Notification.svelte";
	import { isAuthenticated, experience, supporterLevel, username } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { singleplayerOptionsPopup } from "$lib/stores/uiStore";
	import { singleplayer } from "$lib/stores/modeStore";
	import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { EllipsisVertical, UserRoundPlus, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { blur, slide } from "svelte/transition";
	import { goto } from "$app/navigation";

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
	let scrollNameText = $state(false);

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 9;
	}

	username.subscribe((value) => {
		if (value) checkTextLength(value);
	});

	// Prevent exiting mulitplayer etc. by starting using a conflicting feature -----------------------------------------------------------------------------
	let preventNavigateOut = $derived(!$singleplayer);

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
			if (factor < 0.05 && factor != 0) factor = 0.05;
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

	// Mobile bar toggle -----------------------------------------------------------------------------------------------------
	let mobileBarExtended = $state(false);
</script>

<!-- mobile top nav bar -->
<nav class="mobileButtonArea topButtonArea">
	<div class="barMenu mobileBarMenu">
		{#if mobileBarExtended}
			<div transition:slide={{ axis: "x", duration: 150 }} class="mobileScrollBarMenu of-left of-right">
				{#if !$isAuthenticated}
					<button
						class="standardButton"
						onclick={() => {
							playSound("basic_button");
							signupPrompt();
						}}><span class="mobileSigninIcon"><UserRoundPlus strokeWidth={3} size={20} /></span></button
					>
				{:else}
					<button
						class="standardButton accountButton white"
						onclick={() => {
							loadProfileFromId(localStorage.getItem("id"), true);
							playSound("basic_button");
						}}
					>
						<img class="socialBarIcons" src="/img/profile_icon.png" alt="Your profile" />
					</button>
				{/if}
				<button
					class="standardButton accountButton white"
					class:preventNavigateOut
					onclick={() => {
						playSound("basic_button");
						goto("/shop");
					}}
				>
					<img class="socialBarIcons" src="/img/shop_icon.png" alt="Shop" />
				</button>
				<a
					class="standardButton accountButton white"
					class:preventNavigateOut
					href="/leaderboard"
					onclick={() => {
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/leaderboards_icon.png" alt="Leaderboard for OpenGuessr" />
				</a>
				<a
					class="standardButton accountButton white"
					class:preventNavigateOut
					href="/multiplayer"
					onclick={() => {
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/multiplayer_icon.png" alt="Open the multiplayer menu" />
				</a>
				<a
					class="standardButton accountButton white"
					class:preventNavigateOut
					href="/competitions"
					onclick={() => {
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/competitions_icon.png" alt="Competitions symbol" />
				</a>
				<a
					class="standardButton accountButton white"
					class:preventNavigateOut
					href="/maps"
					onclick={() => {
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/mobile_maps_icon.png" alt="Map Categories" />
				</a>
				<button
					class="standardButton accountButton white"
					class:preventNavigateOut
					onclick={() => {
						playSound("basic_button");
						singleplayerOptionsPopup.set(true);
					}}
				>
					<img src="/img/joystick_icon.png" alt="Singleplayer Options" id="joystickIcon" class="socialBarIcons" />
				</button>
				<button class="standardButton accountButton white" id="settingsButtonMobile" onclick={openSettings}>
					<img src="/img/settings_icon.png" alt="settings" class="socialBarIcons" id="settingsIcon" />
				</button>
			</div>
		{/if}
		<button
			class="standardButton accountButton white"
			onclick={() => {
				mobileBarExtended = !mobileBarExtended;
				playSound("basic_button");
			}}
		>
			{#if !mobileBarExtended}
				<span in:blur={{ duration: 150 }}>
					<EllipsisVertical style="margin-top: 2px;" />
				</span>
			{:else}
				<span in:blur={{ duration: 150 }}>
					<X style="margin-top: 3px;" strokeWidth={2.75} size={22} />
				</span>
			{/if}
		</button>
	</div>
</nav>

<!-- Desktop top nav bar -->
<nav id="topButtonArea" class="topButtonArea">
	<div class="barMenu topBarSides topBarDesktop" class:sideMenuDisabled={sideMenusDisabled}>
		{#if !$isAuthenticated}
			<button
				class="standardButton"
				alt="sign up or log in"
				onclick={() => {
					playSound("basic_button");
					signupPrompt();
				}}>Sign up</button
			>
		{/if}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="profileInfo standardButton white"
			class:notSignedIn={!$isAuthenticated}
			class:profileInfoSupporter={$supporterLevel >= 1}
			onclick={() => {
				loadProfileFromId(localStorage.getItem("id"), true);
				playSound("basic_button");
			}}
		>
			<div id="accountNameArea" class:accountNameAreaFade={scrollNameText}>
				<p id="accountName" contenteditable="false" class:namescroll={scrollNameText}>
					{$username || "Guest"}
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
				class="standardButton accountButton white"
				class:preventNavigateOut
				onclick={() => {
					playSound("basic_button");
					goto("/shop");
				}}
			>
				<img class="socialBarIcons" src="/img/shop_icon.png" alt="Shop" />
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
			<img class="socialBarIcons shiftedSocialbarIcon" src="/img/leaderboards_icon.png" alt="Experience Leaderboard" />
		</a>
		<a
			id="multiplayerButton"
			class="accountButton standardButton white"
			class:preventNavigateOut
			href="/multiplayer"
			onclick={() => {
				playSound("basic_button");
			}}
		>
			<span class="topBarExpand">Multiplayer</span>
			<img
				class="socialBarIcons shiftedSocialbarIcon"
				src="/img/multiplayer_icon.png"
				alt="Open the multiplayer menu"
			/>
		</a>
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
			<img class="socialBarIcons shiftedSocialbarIcon" src="/img/competitions_icon.png" alt="Competitions symbol" />
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
			<img class="socialBarIcons noMarginRight" src="/img/mobile_maps_icon.png" alt="Map Categories" />
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
			<img src="/img/joystick_icon.png" alt="Singleplayer Options" id="joystickIcon" class="socialBarIcons" />
		</button>
		<button class="standardButton accountButton white" id="settingsButton" onclick={openSettings}>
			<img src="/img/settings_icon.png" alt="settings" class="socialBarIcons" id="settingsIcon" />
		</button>
	</div>
	<Notification />
</nav>

<style>
	.profileInfo {
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Disable certain buttons in Competitions, Multiplayer etc. to prevent users from leaving accidentally */
	.preventNavigateOut {
		pointer-events: none !important;
		opacity: 0.5 !important;
	}

	.mobileSigninIcon {
		vertical-align: -1px;
		margin-left: 2px;
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

	.noMarginRight {
		margin-right: 0 !important;
	}

	.topButtonArea {
		position: fixed;
		width: 100%;
		top: var(--layout-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--box-margin);
		transition: all 250ms ease;
		z-index: 14;
		pointer-events: none;
	}

	.mobileScrollBarMenu {
		gap: var(--panel-margin);
		overflow-x: auto;
		display: flex;
		transition: mask 0.3s ease-in-out;
		scrollbar-width: none;
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
		top: var(--box-margin);
	}

	.mobileBarMenu {
		max-width: calc(100% - (var(--box-margin) * 2 + var(--panel-margin) * 2));
		margin-left: auto;
		margin-right: var(--box-margin);
	}

	.socialBarIcons {
		width: 20px;
		height: auto;
		margin-inline: 2px;
		margin-bottom: -2px;
	}

	.shiftedSocialbarIcon {
		margin-right: 5px;
	}

	#accountNameArea {
		max-width: 80px;
		overflow: hidden;
		white-space: nowrap;
	}

	.accountNameAreaFade {
		mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
	}

	#accountName {
		color: white;
		display: inline-block;
		width: fit-content;
		margin-top: -3px;
		font-size: 22px;
	}

	.accountButton {
		background-color: var(--panel-button-color);
		text-decoration: none;
	}

	.progressContainer {
		position: relative;
		width: 30px;
		height: 30px;
		margin-left: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 50%;
	}

	.progressRing {
		transform: rotate(-90deg);
		box-shadow: var(--bulb-shadow);
		border-radius: 100%;
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

	.topBarExpand {
		max-width: 0px;
		transition: max-width 500ms cubic-bezier(0.45, 0.05, 0.55, 0.95);
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

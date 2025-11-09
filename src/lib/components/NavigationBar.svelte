<script>
	import { settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import Notification from "$lib/components/Notification.svelte";
	import { isAuthenticated, experience, supporterLevel, username } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { singleplayer } from "$lib/stores/modeStore";
	import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { CircleUserRound, EllipsisVertical, UserRound, UserRoundPlus, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { blur, slide } from "svelte/transition";
	import { goto } from "$app/navigation";
	import { tooltip } from "$lib/utils/tooltip";

	// Check if the username should be scrolled automatically (happens when it is too long) -------------------------------------------
	let scrollNameText = $state(false);
	let circleElement = $state();

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 8;
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
		try {
			if (!circleElement) return;
			if (factor < 0.05 && factor != 0) factor = 0.05;
			const radius = circleElement?.r?.baseVal?.value;
			const circumference = 2 * Math.PI * radius;

			circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
			circleElement.style.strokeDashoffset = `${circumference}`;

			const offset = circumference - factor * circumference;
			circleElement.style.strokeDashoffset = offset;
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
						}}><span class="mobileUserIcon"><UserRoundPlus strokeWidth={2.5} size={20} /></span></button
					>
				{:else}
					<button
						class="standardButton white"
						onclick={() => {
							loadProfileFromId(localStorage.getItem("id"));
							playSound("basic_button");
						}}
					>
						<span class="mobileUserIcon"
							><CircleUserRound strokeWidth={2.25} size={20} style="margin-bottom: -1px;" />
						</span></button
					>
				{/if}
				<button
					class="standardButton white"
					class:preventNavigateOut
					onclick={() => {
						playSound("basic_button");
						goto("/shop");
					}}
				>
					<img class="socialBarIcons" src="/img/shop_icon.png" alt="Shop" />
				</button>
				<button
					class="standardButton white"
					class:preventNavigateOut
					onclick={() => {
						playSound("basic_button");
						goto("/leaderboard");
					}}
				>
					<img class="socialBarIcons" src="/img/leaderboards_icon.png" alt="Leaderboard for OpenGuessr" />
				</button>
				<button
					class="standardButton white"
					class:preventNavigateOut
					onclick={() => {
						goto("/multiplayer");
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/multiplayer_icon.png" alt="Open the multiplayer menu" />
				</button>
				<button
					class="standardButton white"
					class:preventNavigateOut
					onclick={() => {
						goto("/competitions");
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/competitions_icon.png" alt="Competitions" />
				</button>
				<button
					class="standardButton white"
					class:preventNavigateOut
					onclick={() => {
						goto("/maps");
						playSound("basic_button");
					}}
				>
					<img class="socialBarIcons" src="/img/mobile_maps_icon.png" alt="Maps" />
				</button>
				<button
					class="standardButton white"
					class:preventNavigateOut
					onclick={() => {
						playSound("basic_button");
						window.open("https://education.openguessr.com", "_blank");
					}}
				>
					<img src="/img/education_icon.png" alt="Learn" class="socialBarIcons" />
				</button>
				<button
					class="standardButton white"
					id="settingsButtonMobile"
					onclick={() => {
						playSound("basic_button");
						settingsPopup.set(true);
					}}
				>
					<img src="/img/settings_icon.png" alt="Settings" class="socialBarIcons" id="settingsIcon" />
				</button>
			</div>
		{/if}
		<button
			class="standardButton white"
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
					<X style="margin-top: 3px;" strokeWidth={2.5} size={22} />
				</span>
			{/if}
		</button>
	</div>
</nav>

<!-- Desktop top nav bar -->
<nav id="topButtonArea" class="topButtonArea">
	<div class="barMenu topBarSides topBarDesktop">
		{#if !$isAuthenticated}
			<button
				class="standardButton"
				aria-label="Log in or Sign up"
				use:tooltip={{ text: "Sign up or log in" }}
				onclick={() => {
					playSound("basic_button");
					signupPrompt();
				}}><UserRoundPlus strokeWidth={2.5} size={20} style="margin-left: 6px; margin-right: 4px;" /></button
			>
		{/if}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="profileInfo standardButton white"
			class:notSignedIn={!$isAuthenticated}
			class:profileInfoSupporter={$supporterLevel >= 1}
			use:tooltip={{ text: "Profile" }}
			onclick={() => {
				loadProfileFromId(localStorage.getItem("id"));
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
						bind:this={circleElement}
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
				class="standardButton white"
				class:preventNavigateOut
				use:tooltip={{ text: "Shop" }}
				onclick={() => {
					goto("/shop");
					playSound("basic_button");
				}}
			>
				<img class="socialBarIcons wideSocialBarIcon" src="/img/shop_icon.png" alt="Shop" />
			</button>
		{/if}
	</div>
	<div class="barMenu topBarDesktop gameModeMenu">
		<button
			class="standardButton white"
			class:preventNavigateOut
			use:tooltip={{ text: "Leaderboard" }}
			onclick={() => {
				goto("/leaderboard");
				playSound("basic_button");
			}}
		>
			<img class="socialBarIcons wideSocialBarIcon" src="/img/leaderboards_icon.png" alt="Leaderboard" />
		</button>
		<button
			class="standardButton white"
			class:preventNavigateOut
			use:tooltip={{ text: "Multiplayer" }}
			onclick={() => {
				goto("/multiplayer");
				playSound("basic_button");
			}}
		>
			<img class="socialBarIcons wideSocialBarIcon" src="/img/multiplayer_icon.png" alt="Open the multiplayer menu" />
		</button>
		<button
			class="standardButton white"
			class:preventNavigateOut
			use:tooltip={{ text: "Competitions" }}
			onclick={() => {
				goto("/competitions");
				playSound("basic_button");
			}}
		>
			<img class="socialBarIcons wideSocialBarIcon" src="/img/competitions_icon.png" alt="Competitions" />
		</button>
	</div>
	<div class="barMenu topBarSides topBarDesktop">
		<button
			class="standardButton white"
			class:preventNavigateOut
			use:tooltip={{ text: "Maps" }}
			onclick={() => {
				goto("/maps");
				playSound("basic_button");
			}}
		>
			<img class="socialBarIcons wideSocialBarIcon" src="/img/mobile_maps_icon.png" alt="Maps" />
		</button>
		<button
			class="standardButton white"
			class:preventNavigateOut
			use:tooltip={{ text: "Education" }}
			onclick={() => {
				playSound("basic_button");
				window.open("https://education.openguessr.com", "_blank");
			}}
		>
			<img src="/img/education_icon.png" alt="Learn" class="socialBarIcons wideSocialBarIcon" />
		</button>
		<button
			class="standardButton white"
			onclick={() => {
				playSound("basic_button");
				settingsPopup.set(true);
			}}
			use:tooltip={{ text: "Settings" }}
		>
			<img src="/img/settings_icon.png" alt="settings" class="socialBarIcons wideSocialBarIcon" />
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
		padding-inline: var(--panel-margin);
	}

	/* Disable certain buttons in Competitions, Multiplayer etc. to prevent users from leaving accidentally */
	.preventNavigateOut {
		pointer-events: none !important;
		opacity: 0.5 !important;
	}

	.mobileUserIcon {
		vertical-align: -1px;
		margin-inline: 2px;
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
			transform: translateX(calc(-100% + 63px));
			/* adjust second param to be max-width of element minus about 5px */
		}
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
		padding-top: var(--panel-margin);
		padding-bottom: var(--panel-margin);
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
		padding-top: 0;
		padding-bottom: 0;
		min-height: calc(40px + var(--panel-margin) * 2);
	}

	.socialBarIcons {
		width: 20px;
		height: auto;
		margin-inline: 2px;
		margin-bottom: -1px;
	}

	.wideSocialBarIcon {
		margin-inline: 5px;
	}

	#accountNameArea {
		width: 68px;
		overflow: hidden;
		white-space: nowrap;
		text-align: start;
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

	.progressContainer {
		position: relative;
		width: 30px;
		height: 30px;
		margin-left: var(--panel-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 50%;
	}

	.progressRing {
		transform: rotate(-90deg);
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

	@media all and (max-width: 1200px) {
		.topBarDesktop {
			display: none;
		}

		.mobileButtonArea {
			display: flex;
		}
	}
</style>

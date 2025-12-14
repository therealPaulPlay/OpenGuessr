<script>
	import { fullscreenNavigation, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import Notification from "$lib/components/Notification.svelte";
	import { isAuthenticated, experience, supporterLevel, username } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { singleplayer } from "$lib/stores/modeStore";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { CircleUserRound, EllipsisVertical, UserRound, UserRoundPlus } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { blur, slide } from "svelte/transition";
	import { goto } from "$app/navigation";
	import { tooltip } from "$lib/utils/tooltip";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";

	let scrollNameText = $state(false);

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 8;
	}

	username.subscribe((value) => {
		if (value) checkTextLength(value);
	});

	let preventNavigateOut = $derived(!$singleplayer);
</script>

<!-- mobile top nav bar -->
<nav class="mobileButtonArea topButtonArea barMenu">
	<button
		class="standardButton white"
		onclick={() => {
			$fullscreenNavigation = !$fullscreenNavigation;
			playSound("basic_button");
		}}
	>
		<span in:blur={{ duration: 150 }}>
			<EllipsisVertical style="margin-top: 2px;" />
		</span>
	</button>
</nav>

<!-- Desktop top nav bar -->
<nav id="topButtonArea" class="topButtonArea">
	<div class="barMenu topBarSides topBarDesktop">
		{#if !$isAuthenticated}
			<button
				class="standardButton"
				aria-label="Log in or Sign up"
				use:tooltip={{ text: "Sign up or Log in" }}
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
			<ExperienceLevelCircle />
		</div>
		{#if $isAuthenticated}
			<button
				class="standardButton white"
				disabled={preventNavigateOut}
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
			disabled={preventNavigateOut}
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
			disabled={preventNavigateOut}
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
			disabled={preventNavigateOut}
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
			disabled={preventNavigateOut}
			use:tooltip={{ text: "Maps" }}
			onclick={() => {
				goto("/maps");
				playSound("basic_button");
			}}
		>
			<img class="socialBarIcons wideSocialBarIcon" src="/img/maps_icon.png" alt="Maps" />
		</button>
		<button
			class="standardButton white"
			disabled={preventNavigateOut}
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

	.notSignedIn {
		opacity: 50%;
		pointer-events: none;
	}

	.mobileButtonArea {
		display: none;
		top: var(--box-margin);
		margin-left: auto;
		width: auto;
		right: var(--box-margin);
		pointer-events: auto;
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

	@media all and (max-width: 1200px) {
		.topBarDesktop {
			display: none;
		}

		.mobileButtonArea {
			display: flex;
		}
	}
</style>

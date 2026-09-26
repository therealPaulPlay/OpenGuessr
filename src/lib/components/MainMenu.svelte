<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { isAuthenticated, username } from "$lib/stores/accountStore";
	import { bugspotPopup, mainMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { blur, fade, scale } from "svelte/transition";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";
	import { showProfile } from "$lib/utils/showProfile";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { Bug, InfinityIcon, PencilRuler, Play, Section, UserRoundPlus } from "@lucide/svelte";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";
	import CompetitionStreakCalendar from "./CompetitionStreakCalendar.svelte";
	import MapItem from "./MapItem.svelte";
	import { loadStreakDays } from "$lib/utils/getCompetitions";
	import { baseMaps, specialMaps } from "$lib/stores/context-specific/officialMapsStore";
	import { isMapSelected, selectMap } from "$lib/utils/changeMapUtils";
	import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
	import RoomCodeInput from "./RoomCodeInput.svelte";
	import MoreMapsVisualization from "./MoreMapsVisualization.svelte";
	import { dailyStreakDays } from "$lib/stores/context-specific/competitionStore";
	import { freeDailyTokensClaimed } from "$lib/stores/context-specific/shopStore";
	import { newFriendRequest } from "$lib/stores/context-specific/inboxOutboxStore";
	import { hasNewMessageOrInvite, hcClient } from "$lib/stores/context-specific/headlessChatStore";
	import { loadInitialHasNew } from "$lib/logic/headlessChatLogic";
	import Chip from "./ui/Chip.svelte";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { browser } from "$app/environment";

	// Username scroll -----------------------------------------------------------

	// Scroll the username only when it overflows by exactly the overflow px amount
	let nameAreaWidth = $state(0);
	let nameTextWidth = $state(0);
	let scrollNameText = $derived(nameAreaWidth > 0 && nameTextWidth > nameAreaWidth);

	// Logo glint ------------------------------------------------------------
	function logoGlint(element) {
		element.animate([{ left: "-50%" }, { left: "150%" }], {
			duration: 1000,
			delay: 250,
			easing: "ease-out",
			fill: "both",
			pseudoElement: "::before",
		});
	}

	// Daily competition streak widget -------------------------------------------
	$effect(() => {
		if ($isAuthenticated) loadStreakDays();
	});

	// New HC messages or invites -----------------------------------------------
	$effect(() => {
		if ($mainMenu && page.url.pathname === "/" && $hcClient) loadInitialHasNew();
	});
</script>

{#if $mainMenu}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fullscreen-navigation-overlay"
		style:display={page.url.pathname !== "/" ? "none" : ""}
		tabindex="0"
		role="button"
		transition:fade={{ duration: 100 }}
	>
		<div class="logo-visualization-container">
			<div class="logo-visualization-area">
				<img
					class="logo-icon"
					src="/img/icon_3d.png"
					alt="OpenGuessr icon"
					transition:scale={{ duration: 150, start: 0.7, delay: 50 }}
				/>
				<div
					class="logo-icon logo-glint"
					transition:scale={{ duration: 150, start: 0.7, delay: 50 }}
					{@attach logoGlint}
				></div>
				<img class="red-smoke-background" src="/img/red_smoke.png" alt="Red smoke" />
			</div>
		</div>
		<div class="navigation-menu-container">
			<!-- Dark-ish panel color fade from bottom up to make the controls more legible -->
			<div class="panel-fade"></div>
			<div class="navigation-menu">
				<div class="navigation-menu-top">
					<div
						class="navigation-box bar-menu"
						transition:scale={{ duration: 150, start: 0.9, delay: 50 }}
						style:overflow="visible"
					>
						<div class="bar-menu singleplayer-label">
							<p>
								Singleplayer <InfinityIcon
									size={22}
									strokeWidth={2.25}
									style="margin-bottom: calc(-1 * var(--content-margin)); margin-left: var(--content-margin);"
								/>
							</p>
						</div>
						<div
							class="navigation-box-scroll map-select-scroll of-left of-right of-length-2"
							style:--map-count={Math.max($baseMaps.length, 1)}
						>
							{#if $baseMaps.every((e) => !isMapSelected(e.map)) && browser}
								{const imgUrl = $specialMaps.find((e) => e.map === localStorage.getItem("selectedMap"))?.imgUrl}
								{#snippet cover()}
									<div class="generic-map-cover">
										<img alt="Generic map icon" src="/img/maps_icon.png" class="map-map-icon" />
										<span class="map-play-icon"> <Play size={28} strokeWidth={1.75} style="opacity: 0.5;" /></span>
									</div>
								{/snippet}
								<MapItem
									name={browser ? idToMapName(localStorage.getItem("selectedMap")) : "..."}
									compact={true}
									selected={true}
									id="custom-map"
									{imgUrl}
									cover={imgUrl ? undefined : cover}
									onclick={() => {
										playSound("button_juicy");
										selectMap(localStorage.getItem("selectedMap"));
									}}
								/>
								<div class="custom-map-separator"></div>
							{/if}
							{#each $baseMaps as { map, imgUrl }}
								<MapItem
									name={map}
									{imgUrl}
									compact={true}
									selected={isMapSelected(map)}
									onclick={() => {
										playSound("button_juicy");
										selectMap(map);
									}}
								/>
							{/each}
						</div>
						<MapItem
							name="More maps"
							compact={true}
							onclick={() => {
								goto("/maps");
								playSound("basic_button");
							}}
							cover={MoreMapsVisualization}
						/>
					</div>
					<div class="navigation-row" transition:scale={{ duration: 150, start: 0.85, delay: 75 }}>
						<div class="navigation-box navigation-box-half bar-menu navigation-box-stack">
							<button
								class="standard-button white navigation-button large-button navigation-button-wide"
								onclick={() => {
									goto("/multiplayer");
									playSound("basic_button");
								}}
							>
								<span class="of-right">
									Multiplayer {#if $newFriendRequest || $hasNewMessageOrInvite}
										<div class="navigation-new-chip" transition:blur>
											<Chip text="New" italic={true} red={true} mutedOpacity={false} />
										</div>
									{/if}
								</span>
								<img class="navigation-icon" src="/img/multiplayer_icon.png" alt="multiplayer menu" />
							</button>
							<div class="navigation-inner-options">
								<div class="multiplayer-quick-play">
									<RoomCodeInput
										compact={true}
										submitFn={(code) => {
											playSound("basic_button");
											joinFromAnywhere(code);
										}}
									/>
								</div>
							</div>
						</div>
						<div class="navigation-box navigation-box-half bar-menu navigation-box-stack">
							<button
								class="standard-button white large-button navigation-button navigation-button-wide"
								onclick={() => {
									goto("/competitions");
									playSound("basic_button");
								}}
							>
								<span class="of-right">Competitions</span>
								<img class="navigation-icon" src="/img/competitions_icon.png" alt="Competitions" />
							</button>
							<div class="navigation-inner-options">
								<CompetitionStreakCalendar streakDays={$dailyStreakDays} compact={true} />
							</div>
						</div>
					</div>
					<div
						class="navigation-row navigation-row-mobile-column"
						transition:scale={{ duration: 150, start: 0.8, delay: 100 }}
					>
						<div class="navigation-box navigation-box-half bar-menu">
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							{#if $isAuthenticated}
								<div
									class="navigation-button standard-button white large-button account-name-button account-button"
									onclick={() => {
										showProfile(localStorage.getItem("id"));
										playSound("basic_button");
									}}
								>
									<div
										class="account-name-area"
										class:account-name-fade={scrollNameText}
										bind:clientWidth={nameAreaWidth}
										style:--name-scroll-offset="calc({nameAreaWidth - nameTextWidth}px - var(--content-margin))"
									>
										<p class:name-scroll={scrollNameText} bind:offsetWidth={nameTextWidth}>
											{$username || "Guest"}
										</p>
									</div>
									<ExperienceLevelCircle />
								</div>
							{:else}
								<button
									class="standard-button navigation-button large-button account-button"
									onclick={() => {
										playSound("basic_button");
										signupPrompt();
									}}>Log in<UserRoundPlus strokeWidth={2.35} size={20} style="margin-inline: 2px;" /></button
								>
							{/if}
						</div>
						<div class="navigation-box navigation-box-half bar-menu">
							<button
								class="standard-button white navigation-button navigation-button-small large-button"
								{@attach tooltip({ text: "Leaderboard" })}
								onclick={() => {
									playSound("basic_button");
									goto("/leaderboard");
								}}
							>
								<img class="navigation-icon" src="/img/leaderboards_icon.png" alt="Leaderboard for OpenGuessr" />
							</button>
							<button
								class="standard-button white navigation-button navigation-button-small large-button"
								style:position="relative"
								{@attach tooltip({ text: "Shop" })}
								onclick={() => {
									goto("/shop");
									playSound("basic_button");
								}}
							>
								<img class="navigation-icon" src="/img/shop_icon.png" alt="Shop" />
								{#if !$freeDailyTokensClaimed}
									<div transition:blur class="free-tokens-chip-container">
										<Chip text="Free" red={true} italic={false} mutedOpacity={false} class="free-tokens-chip" />
									</div>
								{/if}
							</button>
							<button
								class="standard-button white navigation-button navigation-button-small large-button"
								aria-label="Education"
								{@attach tooltip({ text: "Education" })}
								onclick={() => {
									playSound("basic_button");
									window.open("https://education.openguessr.com", "_blank");
								}}
							>
								<img src="/img/education_icon.png" alt="Learn" class="navigation-icon" />
							</button>
							<button
								class="standard-button white navigation-button navigation-button-small large-button"
								id="settings-button-mobile"
								{@attach tooltip({ text: "Settings" })}
								onclick={() => {
									playSound("basic_button");
									settingsPopup.set(true);
								}}
							>
								<img src="/img/settings_icon.png" alt="Settings" class="navigation-icon" id="settings-icon" />
							</button>
						</div>
					</div>
				</div>
				<!-- Link section -->
				<div class="navigation-box bar-menu link-box">
					<div class="navigation-box-scroll of-left of-right of-length-2">
						<button
							class="standard-button white link-button large-button"
							aria-label="Report bug"
							{@attach tooltip({ text: "Report bug" })}
							onclick={() => {
								playSound("basic_button");
								$bugspotPopup = true;
							}}
						>
							<Bug size={20} strokeWidth={2.25} style="margin-inline: 2px;" />
						</button>
						<button
							class="standard-button white link-button large-button"
							aria-label="Discord"
							{@attach tooltip({ text: "Discord" })}
							onclick={() => {
								playSound("basic_button");
								window.open($discordInviteUrl, "_blank").focus();
							}}
						>
							<img src="/img/discord.png" alt="Discord logo" class="navigation-icon" />
						</button>
						<button
							class="standard-button white link-button large-button"
							aria-label="Reddit"
							{@attach tooltip({ text: "Reddit" })}
							onclick={() => {
								playSound("basic_button");
								window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
							}}
						>
							<img src="/img/reddit.png" alt="Reddit logo" class="navigation-icon" />
						</button>
						<button
							class="standard-button white link-button large-button"
							aria-label="YouTube"
							{@attach tooltip({ text: "YouTube" })}
							onclick={() => {
								playSound("basic_button");
								window.open("https://www.youtube.com/@OpenGuessrOfficial", "_blank").focus();
							}}
						>
							<img src="/img/youtube.png" alt="X logo" class="navigation-icon" />
						</button>
						<button
							class="standard-button white link-button large-button"
							aria-label="Twitter"
							{@attach tooltip({ text: "Twitter" })}
							onclick={() => {
								playSound("basic_button");
								window.open("https://x.com/PaulPlayStudio", "_blank").focus();
							}}
						>
							<img src="/img/twitter.png" alt="X logo" class="navigation-icon" />
						</button>
						<button
							class="standard-button white link-button large-button"
							aria-label="Legal"
							{@attach tooltip({ text: "Legal" })}
							onclick={() => {
								playSound("basic_button");
								goto("/legal");
							}}
						>
							<Section size={20} strokeWidth={2.25} style="margin-inline: 2px;" />
						</button>
						<button
							class="standard-button white link-button large-button"
							aria-label="About"
							{@attach tooltip({ text: "About" })}
							onclick={() => {
								playSound("basic_button");
								goto("/about");
							}}
						>
							<PencilRuler size={19} strokeWidth={2.25} style="margin-inline: 2px;" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.fullscreen-navigation-overlay {
		position: fixed;
		inset: 0;
		z-index: 15;
		text-align: center;
		align-content: center;
		display: flex;
		flex-direction: column;
		background-color: var(--dark-background);
		backdrop-filter: blur(var(--weak-blur));
	}

	.singleplayer-label {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		margin-left: var(--panel-margin);
		position: absolute;
		left: var(--layout-margin);
		bottom: 100%;
		padding: calc(var(--layout-margin) - var(--panel-margin));
		padding-inline: var(--box-margin);
	}

	.generic-map-cover {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: var(--box-color-dark);
		border-radius: var(--content-margin);
	}

	.map-map-icon {
		width: 28px;
		height: 28px;
		opacity: 0.5;
	}

	.map-play-icon {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.map-map-icon,
	.map-play-icon {
		transition:
			scale 250ms ease,
			opacity 250ms ease;
		position: absolute;
		inset: 0;
		margin: auto;
		will-change: scale, opacity;
	}

	:global(#custom-map:not(:hover) .map-play-icon, #custom-map:hover .map-map-icon) {
		scale: 0;
		opacity: 0;
	}

	.navigation-menu-container {
		height: fit-content;
		margin-top: auto;
		min-height: calc(385px + 10%);
	}

	.navigation-menu {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-direction: column;
		gap: var(--layout-margin);
		width: 650px;
		max-width: 100%;
		height: 100%;
		box-sizing: border-box;
		margin-inline: auto;
		padding-inline: var(--layout-margin);
	}

	.navigation-menu-top {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		width: 100%;
	}

	.navigation-row {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: var(--layout-margin);
		width: 100%;
	}

	.navigation-box {
		border-radius: var(--layout-margin);
		justify-content: end;
		flex-grow: 1;
		overflow: hidden;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		align-items: stretch;
	}

	.navigation-box-scroll {
		overflow-x: auto;
		scrollbar-width: none;
		display: flex;
		gap: var(--panel-margin);
		transition: opacity 250ms ease;
		border-radius: var(--content-margin);
	}

	.map-select-scroll {
		flex: var(--map-count) 1
			calc((var(--map-count) - 1) * var(--panel-margin) + var(--map-count) * 2 * var(--content-margin));
	}

	.map-select-scroll > :global(.map-item) {
		flex: 0 0 calc((100% - (var(--map-count) - 1) * var(--panel-margin)) / var(--map-count));
	}

	.custom-map-separator {
		flex: 0 0 2px;
		margin-block: var(--content-margin);
		border-radius: 3px;
		background-color: var(--line-color);
	}

	.navigation-box-stack {
		flex-direction: column;
		gap: 0;
	}

	.link-box {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		width: fit-content;
		margin-top: var(--box-margin);
		max-width: 100%;
		flex-grow: 0;
	}

	.link-box:not(:hover) > * {
		opacity: 0.5;
	}

	.navigation-icon {
		width: 20px;
		height: auto;
		margin-inline: 2px;
		margin-bottom: -1px;
		user-select: none;
		pointer-events: none;
	}

	:global(.navigation-new-chip) {
		margin-right: auto;
		margin-top: calc(-1 * var(--content-margin));
		margin-bottom: calc(-1 * var(--content-margin));
	}

	.navigation-button {
		border-radius: var(--box-margin);
		flex-grow: 1;
		display: flex;
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		padding-inline: var(--layout-margin);
		box-sizing: border-box;
	}

	.navigation-button span {
		text-overflow: ellipsis;
		overflow: hidden;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		margin: calc(-1 * var(--layout-margin));
		padding: var(--layout-margin);
		margin-right: 0;
	}

	.link-button {
		flex-grow: 1;
		border: none;
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		aspect-ratio: 1/1;
	}

	.navigation-button:not(.navigation-button-small) {
		display: flex;
		padding: var(--box-margin);
	}

	.navigation-button-small {
		justify-content: center;
		flex-basis: 40px;
		padding-inline: var(--box-margin);
		min-height: 100%;
	}

	.navigation-button-wide {
		height: auto !important;
		width: 100%;
		flex-grow: 0;
		/* Needed due to the padding trick of the box below, otherwise that lower bit is not clickable */
		z-index: 1;
	}

	.navigation-inner-options {
		transition: opacity 250ms ease;
		flex-grow: 1;
		align-self: stretch;
		width: 100%;
	}

	.multiplayer-quick-play {
		display: flex;
		gap: var(--content-margin);
		box-sizing: border-box;
		border-radius: var(--box-margin);
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		padding-top: calc(var(--layout-margin) + var(--content-margin));
		margin-top: calc(-1 * var(--box-margin));
		width: 100%;
		height: calc(100% + var(--box-margin));
		mask-image: linear-gradient(transparent, black 40%);
	}

	.logo-icon {
		position: absolute;
		inset: 0;
		width: 50%;
		height: 50%;
		object-fit: contain;
		margin: auto;
		z-index: 1;
		filter: drop-shadow(0 0 20px var(--dark-shadow-color));
		aspect-ratio: 1/1;
		/* To hide the alt text during load */
		color: transparent;
	}

	.logo-glint {
		filter: none;
		mask: url("/img/icon_3d.png") center / contain no-repeat;
	}

	.logo-glint::before {
		content: "";
		position: absolute;
		inset: -50% auto;
		left: -50%;
		width: 25%;
		background: white;
		filter: blur(var(--strong-blur));
		transform: rotate(25deg);
	}

	.red-smoke-background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		margin: auto;
		aspect-ratio: 1/1;
		/* To hide the alt text during load */
		color: transparent;
	}

	.logo-visualization-container {
		width: 100%;
		max-width: 450px;
		box-sizing: border-box;
		margin-inline: auto;
		flex-grow: 1;
		align-content: center;
		padding-top: var(--layout-margin);
		transition: opacity 250ms ease;
	}

	.logo-visualization-area {
		position: relative;
		height: 100%;
		width: 100%;
		user-select: none;
		pointer-events: none;
	}

	.free-tokens-chip-container {
		position: absolute;
		display: flex;
		top: calc(-1 * var(--content-margin));
		right: calc(-1 * var(--content-margin));
	}

	:global(.chip.free-tokens-chip) {
		padding-top: 1px !important;
		padding-bottom: 1px !important;
	}

	:global(.chip.free-tokens-chip *) {
		font-size: 16px;
	}

	.panel-fade {
		position: absolute;
		inset: 0;
		top: -15svh;
		background: linear-gradient(to top, var(--panel-color), transparent);
		opacity: 0.75;
	}

	.account-button {
		flex-basis: 60%;
	}

	.navigation-box-half {
		width: auto;
		flex-basis: 0;
	}

	.account-name-area {
		flex-grow: 1;
		overflow: hidden;
		white-space: nowrap;
		display: flex;
		padding: var(--box-margin);
		padding-inline: 0;
	}

	.account-name-button {
		overflow: hidden;
		min-width: 150px;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		flex-wrap: nowrap !important;
	}

	.account-name-fade {
		mask-image: linear-gradient(to right, transparent, black 3%, black 97%, transparent);
	}

	:global(.name-scroll) {
		animation: scrollText 5s ease-in-out infinite alternate;
	}

	@keyframes scrollText {
		0% {
			transform: translateX(var(--content-margin));
		}

		100% {
			transform: translateX(var(--name-scroll-offset));
		}
	}

	@media (min-width: 550px) {
		:global(.navigation-menu:has(.link-box:hover) .navigation-box:not(.link-box) > *) {
			opacity: 0.5;
		}
	}

	@media (max-width: 550px) {
		.navigation-row-mobile-column {
			flex-direction: column;
		}

		.navigation-row-mobile-column .navigation-box-half {
			flex-basis: unset;
		}

		.navigation-inner-options {
			display: none;
		}
	}

	@media (max-height: 675px) {
		.logo-visualization-container {
			opacity: 0;
		}
	}
</style>

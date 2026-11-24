<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { isAuthenticated, username } from "$lib/stores/accountStore";
	import { bugspotPopup, mainMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip, RoomCodeInput, Chip } from "openguessr-ui";
	import { blur, fade, scale } from "svelte/transition";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";
	import { showProfile } from "$lib/utils/showProfile";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { Bug, InfinityIcon, Layers, PencilRuler, Play, Section, UserRoundPlus } from "@lucide/svelte";
	import { discordInviteUrl, educationUrl, gitHubUrl } from "$lib/stores/context-specific/apiConfigStore";
	import CompetitionStreakCalendar from "./CompetitionStreakCalendar.svelte";
	import MapItem from "./MapItem.svelte";
	import { loadStreakDays } from "$lib/utils/getCompetitions";
	import { baseMaps, specialMaps } from "$lib/stores/context-specific/officialMapsStore";
	import { isMapSelected, selectMap } from "$lib/utils/changeMapUtils";
	import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
	import MoreMapsVisualization from "./MoreMapsVisualization.svelte";
	import MapAttribution from "./MapAttribution.svelte";
	import { dailyStreakDays } from "$lib/stores/context-specific/competitionStore";
	import { freeDailyTokensClaimed } from "$lib/stores/context-specific/shopStore";
	import { newFriendRequest } from "$lib/stores/context-specific/inboxOutboxStore";
	import { hasNewMessageOrInvite, hcClient } from "$lib/stores/context-specific/headlessChatStore";
	import { loadInitialHasNew } from "$lib/logic/headlessChatLogic";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { tutorialStep } from "$lib/stores/context-specific/tutorialStore";
	import Tutorial, { checkTutorialStart } from "./Tutorial.svelte";
	import GuessyBotInvite from "./DiscordBotInvite.svelte";
	import { innerWidth } from "svelte/reactivity/window";

	// Check for tutorial -----------------------------------
	onMount(checkTutorialStart);

	// Username scroll -----------------------------------------------------------

	// Scroll the username only when it overflows by exactly the overflow px amount
	let nameAreaWidth = $state(0);
	let nameTextWidth = $state(0);
	let scrollNameText = $derived(nameAreaWidth > 0 && nameTextWidth > nameAreaWidth);

	// Daily competition streak widget -------------------------------------------
	$effect(() => {
		if ($isAuthenticated) loadStreakDays();
	});

	// New HC messages or invites -----------------------------------------------
	$effect(() => {
		if ($mainMenu && page.url.pathname === "/" && $hcClient) loadInitialHasNew();
	});

	// Icon glint ------------------------------------------------------------
	function iconGlint(element) {
		element.animate([{ left: "-50%" }, { left: "150%" }], {
			duration: 1000,
			delay: 250,
			easing: "ease-out",
			fill: "both",
			pseudoElement: "::before",
		});
	}

	// Row scale transition (patch on top of Svelte's scale transition) ------------
	function rowScale(node, params) {
		const row = node.parentElement.getBoundingClientRect();
		const box = node.getBoundingClientRect();
		const origin = `${row.left + row.width / 2 - box.left}px ${row.top + row.height / 2 - box.top}px`;
		const config = scale(node, params);
		return { ...config, css: (t, u) => `${config.css(t, u)}; transform-origin: ${origin}` };
	}
</script>

{#if $mainMenu || $tutorialStep > 0}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fullscreen-navigation-overlay"
		style:display={page.url.pathname !== "/" ? "none" : ""}
		tabindex="0"
		role="button"
		transition:fade={{ duration: 100 }}
	>
		{#if $tutorialStep > 0}
			<Tutorial />
		{:else if $tutorialStep === 0}
			<div class="logo-visualization-container safe-margin-top">
				<div class="logo-visualization-area">
					<img
						class="logo-icon"
						src="/img/icon_3d.png"
						alt="OpenGuessr icon"
						in:scale|global={{ duration: 250, start: 0.7, delay: 50 }}
					/>
					<div
						class="logo-icon icon-glint"
						in:scale|global={{ duration: 250, start: 0.7, delay: 50 }}
						{@attach iconGlint}
					></div>
					<img
						class="red-smoke-background"
						src="/img/red_smoke.png"
						alt="Red smoke"
						in:fade|global={{ duration: 250 }}
					/>
				</div>
			</div>
			<div class="navigation-menu-container">
				<!-- Dark-ish panel color fade from bottom up to make the controls more legible -->
				<div class="panel-fade" in:fade|global={{ duration: 150 }}></div>
				<div class="navigation-menu">
					<div class="navigation-menu-top">
						<div
							class="navigation-box bar-menu"
							in:scale|global={{ duration: 250, start: 0.9, delay: 50 }}
							style:overflow="visible"
						>
							<div class="bar-menu singleplayer-label">
								<p>
									Singleplayer <InfinityIcon
										size={22}
										strokeWidth={2.25}
										style="margin-bottom: -4px; margin-left: var(--content-margin);"
									/>
								</p>
							</div>
							{#snippet moreMaps()}
								<MapItem
									name="More maps"
									compact={true}
									onclick={() => {
										goto("/maps");
										playSound("basic_button");
									}}
									cover={MoreMapsVisualization}
								/>
							{/snippet}
							<div class="navigation-box-scroll map-select-scroll of-left of-right of-length-2">
								{#if $baseMaps.every((e) => !isMapSelected(e.map)) && browser}
									{const imgUrl = $specialMaps.find((e) => e.map === localStorage.getItem("selectedMap"))?.imgUrl}
									{#snippet cover()}
										<div class="generic-map-cover">
											<span class="map-map-icon"><Layers size={28} strokeWidth={2} style="opacity: 0.5;" /></span>
											<span class="map-play-icon"> <Play size={28} strokeWidth={2} style="opacity: 0.5;" /></span>
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
											playSound("juicy_button");
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
											playSound("juicy_button");
											selectMap(map);
										}}
									/>
								{/each}
								{#if innerWidth.current <= 550}
									{@render moreMaps()}
								{/if}
							</div>
							{#if innerWidth.current > 550 || !browser}
								{@render moreMaps()}
							{/if}
						</div>
						{#snippet multiplayerButton()}
							<button
								class="standard-button bright navigation-button large navigation-button-wide"
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
						{/snippet}
						{#snippet competitionsButton()}
							<button
								class="standard-button bright large navigation-button navigation-button-wide"
								onclick={() => {
									goto("/competitions");
									playSound("basic_button");
								}}
							>
								<span class="of-right">Competitions</span>
								<img class="navigation-icon" src="/img/competitions_icon.png" alt="Competitions" />
							</button>
						{/snippet}
						<div class="navigation-row comp-multiplayer-desktop">
							<div
								class="navigation-box navigation-box-half bar-menu navigation-box-stack"
								in:rowScale|global={{ duration: 250, start: 0.85, delay: 75 }}
							>
								{@render multiplayerButton()}
								<div class="navigation-inner-options">
									<div class="multiplayer-quick-play">
										<RoomCodeInput
											inPage={false}
											onsubmit={(code) => {
												playSound("basic_button");
												joinFromAnywhere(code);
											}}
										/>
									</div>
								</div>
							</div>
							<div
								class="navigation-box navigation-box-half bar-menu navigation-box-stack"
								in:rowScale|global={{ duration: 250, start: 0.85, delay: 75 }}
							>
								{@render competitionsButton()}
								<div class="navigation-inner-options">
									<CompetitionStreakCalendar streakDays={$dailyStreakDays} compact={true} />
								</div>
							</div>
						</div>
						<div
							class="navigation-box comp-multiplayer-mobile bar-menu"
							in:rowScale|global={{ duration: 250, start: 0.85, delay: 75 }}
						>
							{@render multiplayerButton()}
							{@render competitionsButton()}
						</div>
						<div class="navigation-row navigation-row-mobile-column">
							<div
								class="navigation-box navigation-box-half bar-menu"
								in:rowScale|global={{ duration: 250, start: 0.8, delay: 100 }}
							>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								{#if $isAuthenticated}
									<div
										class="navigation-button standard-button bright large account-name-button account-button"
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
										class="standard-button bright navigation-button large account-button"
										onclick={() => {
											playSound("basic_button");
											signupPrompt();
										}}>Log in<UserRoundPlus strokeWidth={2.25} size={20} style="margin-inline: 2px;" /></button
									>
								{/if}
							</div>
							<div
								class="navigation-box navigation-box-half bar-menu"
								in:rowScale|global={{ duration: 250, start: 0.8, delay: 100 }}
							>
								<button
									class="standard-button bright navigation-button navigation-button-small large"
									{@attach tooltip({ text: "Leaderboard" })}
									onclick={() => {
										playSound("basic_button");
										goto("/leaderboard");
									}}
								>
									<img class="navigation-icon" src="/img/leaderboards_icon.png" alt="Leaderboard for OpenGuessr" />
								</button>
								<button
									class="standard-button bright navigation-button navigation-button-small large"
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
									class="standard-button bright navigation-button navigation-button-small large"
									aria-label="Education"
									{@attach tooltip({ text: "Education" })}
									onclick={() => {
										playSound("basic_button");
										window.open($educationUrl, "_blank");
									}}
								>
									<img src="/img/education_icon.png" alt="Learn" class="navigation-icon" />
								</button>
								<button
									class="standard-button bright navigation-button navigation-button-small large"
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
					<div class="navigation-box bar-menu link-box" in:blur|global={{ duration: 250 }}>
						<div class="navigation-box-scroll of-left of-right of-length-2">
							<button
								class="standard-button bright link-button large"
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
								class="standard-button bright link-button large"
								aria-label="Discord"
								{@attach tooltip({ text: "Discord" })}
								onclick={() => {
									playSound("basic_button");
									window.open($discordInviteUrl, "_blank");
								}}
							>
								<img src="/img/discord.png" alt="Discord logo" class="navigation-icon" />
							</button>
							<button
								class="standard-button bright link-button large"
								aria-label="Reddit"
								{@attach tooltip({ text: "Reddit" })}
								onclick={() => {
									playSound("basic_button");
									window.open("https://www.reddit.com/r/OpenGuessr/", "_blank");
								}}
							>
								<img src="/img/reddit.png" alt="Reddit logo" class="navigation-icon" />
							</button>
							<button
								class="standard-button bright link-button large"
								aria-label="YouTube"
								{@attach tooltip({ text: "YouTube" })}
								onclick={() => {
									playSound("basic_button");
									window.open("https://www.youtube.com/@OpenGuessrOfficial", "_blank");
								}}
							>
								<img src="/img/youtube.png" alt="X logo" class="navigation-icon" />
							</button>
							<button
								class="standard-button bright link-button large"
								aria-label="GitHub"
								{@attach tooltip({ text: "GitHub" })}
								onclick={() => {
									playSound("basic_button");
									window.open($gitHubUrl, "_blank");
								}}
							>
								<img src="/img/github.png" alt="X logo" class="navigation-icon" />
							</button>
							<button
								class="standard-button bright link-button large"
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
								class="standard-button bright link-button large"
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
					<!-- Discord bot promotion -->
					<GuessyBotInvite />
				</div>
			</div>
		{/if}
		{#if $tutorialStep >= 0}
			<!-- Needed since the SV shines through the main menu background -->
			<div in:blur|global={{ duration: 250 }}>
				<MapAttribution forPanorama />
			</div>
		{/if}
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
		background-color: var(--overlay-color);
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
		text-wrap: nowrap;
	}

	.generic-map-cover {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: var(--box-color-dark);
		border-radius: var(--content-margin);
	}

	.map-map-icon,
	.map-play-icon {
		display: flex;
		justify-content: center;
		align-items: center;
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
		/* Needed for the panel fade positioning */
		position: relative;
		transition: min-height 250ms ease;
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
		align-items: stretch;
		position: relative;
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
		--map-cnt: 3;
		flex: var(--map-cnt) 1 calc((var(--map-cnt) - 1) * var(--panel-margin) + var(--map-cnt) * 2 * var(--content-margin));
	}

	.map-select-scroll > :global(.map-item) {
		flex: 0 0 calc((100% - (var(--map-cnt) - 1) * var(--panel-margin)) / var(--map-cnt));
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
		padding-bottom: max(var(--panel-margin), env(safe-area-inset-bottom));
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
		min-width: 0;
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
		min-width: 38px;
		padding-inline: 0;
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

	.icon-glint {
		filter: none;
		mask: url("/img/icon_3d.png") center / contain no-repeat;
		container-type: size;
		width: min(50cqw, 50cqh);
		height: min(50cqw, 50cqh);
	}

	.icon-glint::before {
		content: "";
		position: absolute;
		inset: -50% auto;
		left: -50%;
		width: 25%;
		background: white;
		filter: blur(min(40px, 18cqmin));
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
		margin-inline: auto;
		flex-grow: 1;
		align-content: center;
		padding-top: var(--layout-margin);
		transition: opacity 250ms ease;
	}

	.logo-visualization-area {
		position: relative;
		container-type: size;
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

	.comp-multiplayer-mobile {
		display: none;
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

		.comp-multiplayer-desktop {
			display: none;
		}

		.comp-multiplayer-mobile {
			display: flex;
		}

		.logo-visualization-container {
			padding-top: 0;
		}
	}

	@media (max-height: 675px) {
		.logo-visualization-container {
			opacity: 0;
		}
	}

	@media (max-height: 800px) and (min-width: 550px) {
		.navigation-inner-options {
			display: none;
		}

		.navigation-menu-container {
			min-height: auto;
		}
	}
</style>

<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { isAuthenticated, username } from "$lib/stores/accountStore";
	import { bugspotPopup, navigationMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { fade } from "svelte/transition";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";
	import { showProfile } from "$lib/utils/showProfile";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { Bug, PencilRuler, Plus, Section, UserRoundPlus } from "@lucide/svelte";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";
	import CompetitionStreakCalendar from "./CompetitionStreakCalendar.svelte";
	import MapItem from "./MapItem.svelte";
	import { getCompetitions } from "$lib/utils/getCompetitions";
	import { baseMaps } from "$lib/stores/context-specific/officialMapsStore";
	import { isMapSelected, selectMap } from "$lib/utils/changeMapUtils";
	import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
	import RoomCodeInput from "./RoomCodeInput.svelte";

	let scrollNameText = $state(false);

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 25;
	}

	username.subscribe((value) => {
		if (value) checkTextLength(value);
	});

	// Daily competition streak widget -------------------------------------------
	let streakDays = $state([]);

	$effect(() => {
		if ($isAuthenticated) loadStreakDays();
	});

	async function loadStreakDays() {
		try {
			const { error, streakDays: streakDaysResponse } = await getCompetitions({ daily: true });
			if (error) throw new Error(error);

			streakDays = streakDaysResponse ?? [];
		} catch (error) {
			console.error("Error occurred during streak load: ", error);
		}
	}
</script>

{#if $navigationMenu}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fullscreen-navigation-overlay"
		style:display={page.url.pathname !== "/" ? "none" : ""}
		tabindex="0"
		role="button"
		transition:fade={{ duration: 100 }}
	>
		<!-- Dark-ish panel color fade from bottom up to make the controls more legible -->
		<div class="panel-fade"></div>
		<img
			class="logo-image"
			src="/img/openguessr.svg"
			alt="OpenGuessr logo - the free geography location-guessing game"
		/>
		<div class="navigation-menu">
			<div class="navigation-box bar-menu">
				{#each $baseMaps as { map, imgUrl }}
					<MapItem
						name={map}
						{imgUrl}
						compact={true}
						selected={isMapSelected(map) && $navigationMenu}
						onclick={() => {
							playSound("button_juicy");
							selectMap(map);
						}}
					/>
				{/each}
				<MapItem
					name="More maps"
					compact={true}
					onclick={() => {
						goto("/maps");
						playSound("basic_button");
					}}
				>
					{#snippet cover()}
						<Plus size={25} strokeWidth={2} />
					{/snippet}
				</MapItem>
			</div>
			<div class="navigation-row">
				<div class="navigation-box navigation-box-half bar-menu navigation-box-stack">
					<button
						class="standard-button white navigation-button large-button navigation-button-small-wide"
						onclick={() => {
							goto("/multiplayer");
							playSound("basic_button");
						}}
					>
						Multiplayer
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
						class="standard-button white large-button navigation-button navigation-button-small-wide"
						onclick={() => {
							goto("/competitions");
							playSound("basic_button");
						}}
					>
						Competitions
						<img class="navigation-icon" src="/img/competitions_icon.png" alt="Competitions" />
					</button>
					<CompetitionStreakCalendar {streakDays} compact={true} />
				</div>
			</div>
			<div class="navigation-row">
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
							<div class="account-name-area" class:account-name-fade={scrollNameText}>
								<p class:name-scroll={scrollNameText}>
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
						{@attach tooltip({ text: "Shop" })}
						onclick={() => {
							goto("/shop");
							playSound("basic_button");
						}}
					>
						<img class="navigation-icon" src="/img/shop_icon.png" alt="Shop" />
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
			<!-- Link section -->
			<div class="navigation-box bar-menu link-box">
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

	.navigation-menu {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		width: 650px;
		max-width: 100%;
		box-sizing: border-box;
		margin-inline: auto;
		padding-inline: var(--layout-margin);
		margin-top: auto;
		position: relative;
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
		flex-wrap: wrap;
		flex-grow: 1;
		overflow: hidden;
		width: 100%;
		box-sizing: border-box;
		align-items: stretch;
	}

	.navigation-box-stack {
		flex-direction: column;
		gap: 0;
	}

	.link-box {
		margin-top: calc(var(--layout-spacer) - var(--layout-margin));
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		margin-inline: auto;
		flex-grow: 0;
		width: fit-content;
	}

	.link-box:not(:hover) > * {
		opacity: 0.5;
	}

	:global(.navigation-menu:has(.link-box:hover) .navigation-box:not(.link-box) > *) {
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

	.link-button {
		flex-grow: 1;
		border: none;
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		aspect-ratio: 1/1;
	}

	.navigation-button:not(.navigation-button-small) {
		height: 100%;
		display: flex;
		flex-wrap: wrap;
		padding: var(--box-margin);
	}

	.navigation-button-small {
		justify-content: center;
		min-width: 0;
		flex-basis: 40px;
		padding-inline: var(--box-margin);
		height: auto;
	}

	.navigation-button-small-wide {
		height: auto !important;
		width: 100%;
		flex-grow: 0;
		/* Needed due to the padding trick of the box below, otherwise that lower bit is not clickable */
		z-index: 1;
	}

	.navigation-inner-options {
		display: flex;
		gap: var(--box-margin);
		width: 100%;
		align-self: stretch;
		flex-grow: 1;
		box-sizing: border-box;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		padding-top: calc(var(--layout-margin) + var(--content-margin));
		margin-top: calc(-1 * var(--box-margin));
		border-radius: var(--box-margin);
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		mask-image: linear-gradient(transparent, black 40%);
		transition: opacity 250ms ease;
	}

	.multiplayer-quick-play {
		display: flex;
		gap: var(--content-margin);
		overflow: hidden;
	}

	.logo-image {
		width: 100%;
		max-width: 800px;
		margin-inline: auto;
		box-sizing: border-box;
		padding-inline: var(--layout-margin);
		margin-top: 200px;
		height: auto;
		filter: drop-shadow(0 0 10px rgba(43, 43, 43, 0.25));
		user-select: none;
		pointer-events: none;
	}

	.panel-fade {
		position: absolute;
		inset: 0;
		top: 40%;
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
			transform: translateX(5px);
		}

		100% {
			/* Adjust second param to be max-width of element minus about 5px */
			transform: translateX(calc(-100% + 215px));
		}
	}
</style>

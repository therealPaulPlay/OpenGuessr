<script>
	import { goto } from "$app/navigation";
	import { isAuthenticated, username } from "$lib/stores/accountStore";
	import { singleplayer } from "$lib/stores/modeStore";
	import { bugspotPopup, navigationMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { fade } from "svelte/transition";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";
	import { showProfile } from "$lib/utils/showProfile";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { ArrowRight, Bug, PencilRuler, Plus, Section, UserRoundPlus } from "@lucide/svelte";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { page } from "$app/state";

	let scrollNameText = $state(false);

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 30;
	}

	username.subscribe((value) => {
		if (value) checkTextLength(value);
	});
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
		<div class="red-fade"></div>
		<img
			class="logo-image"
			src="/img/openguessr.svg"
			alt="OpenGuessr logo - the free geography location-guessing game"
		/>
		<div class="navigation-menu">
			<div class="navigation-box bar-menu">
				<button
					class="standard-button white navigation-button large-button"
					disabled={!$singleplayer}
					onclick={() => {
						playSound("basic_button");
						$navigationMenu = false;
					}}
				>
					<div class="navigation-inner-main">
						Singleplayer
						<img class="navigation-icon" src="/img/multiplayer_icon.png" alt="multiplayer menu" />
					</div>
					<div class="navigation-inner-options">
						<div
							class="standard-button navigation-option"
							onclick={(e) => {
								e.stopPropagation();
								goto("/maps");
								playSound("basic_button");
							}}
						>
							World
							<ArrowRight size={20} strokeWidth={2.25} />
						</div>
						<div
							class="standard-button navigation-option"
							onclick={(e) => {
								e.stopPropagation();
								goto("/maps");
								playSound("basic_button");
							}}
						>
							Capital Cities
							<ArrowRight size={20} strokeWidth={2.25} />
						</div>
						<div
							class="standard-button navigation-option"
							onclick={(e) => {
								e.stopPropagation();
								goto("/maps");
								playSound("basic_button");
							}}
						>
							Famous Places
							<ArrowRight size={20} strokeWidth={2.25} />
						</div>
						<div
							class="standard-button navigation-option"
							onclick={(e) => {
								e.stopPropagation();
								goto("/maps");
								playSound("basic_button");
							}}
						>
							<Plus size={20} strokeWidth={2.25} />
							More
						</div>
					</div>
				</button>
			</div>
			<div class="navigation-row">
				<div class="navigation-box navigation-box-half bar-menu">
					<button
						class="standard-button white navigation-button large-button"
						onclick={() => {
							goto("/multiplayer");
							playSound("basic_button");
						}}
					>
						<div class="navigation-inner-main">
							Multiplayer
							<img class="navigation-icon" src="/img/multiplayer_icon.png" alt="multiplayer menu" />
						</div>
						<div class="navigation-inner-options">
							<div
								class="standard-button navigation-option"
								onclick={(e) => {
									e.stopPropagation();
									goto("/multiplayer");
									playSound("basic_button");
								}}
							>
								Duel
								<ArrowRight size={20} strokeWidth={2.25} />
							</div>
							<div
								class="standard-button navigation-option"
								onclick={(e) => {
									e.stopPropagation();
									goto("/multiplayer");
									playSound("basic_button");
								}}
							>
								2v2
								<ArrowRight size={20} strokeWidth={2.25} />
							</div>
						</div>
					</button>
				</div>
				<div class="navigation-box navigation-box-half bar-menu">
					<button
						class="standard-button white navigation-button large-button"
						onclick={() => {
							goto("/competitions");
							playSound("basic_button");
						}}
					>
						<div class="navigation-inner-main">
							Competitions
							<img class="navigation-icon" src="/img/competitions_icon.png" alt="Competitions" />
						</div>
						<div class="navigation-inner-options">
							<div class="standard-button navigation-option">
								Placeholder
								<ArrowRight size={20} strokeWidth={2.25} />
							</div>
							<!-- TODO daily competiiton days widget similar to one on the competition page -->
						</div>
					</button>
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
							<div id="account-name-area" class:account-name-fade={scrollNameText}>
								<p id="account-name" contenteditable="false" class:name-scroll={scrollNameText}>
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
			<div class="navigation-box bar-menu">
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
					aria-label="Twitter"
					{@attach tooltip({ text: "Twitter" })}
					onclick={() => {
						playSound("basic_button");
						window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
					}}
				>
					<img src="/img/reddit.png" alt="X logo" class="navigation-icon" />
				</button>
				<button
					class="standard-button white link-button large-button"
					aria-label="YouTube"
					{@attach tooltip({ text: "YouTube" })}
					onclick={() => {
						playSound("basic_button");
						window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
					}}
				>
					<img src="/img/reddit.png" alt="X logo" class="navigation-icon" />
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
		margin-bottom: var(--layout-spacer);
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

	.navigation-inner-main {
		display: flex;
		gap: var(--content-margin);
		padding-inline: var(--content-margin);
		align-items: center;
	}

	.navigation-inner-options {
		width: 100%;
		display: flex;
		gap: var(--box-margin);
		box-sizing: border-box;
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
		width: auto;
		max-width: 100%;
		border-radius: var(--box-margin);
		flex-grow: 1;
		flex-basis: 60px;
		display: flex;
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		padding-inline: var(--layout-margin);
		flex-basis: 100%;
		box-sizing: border-box;
	}

	.navigation-button:has(.navigation-option:hover) {
		filter: none;
	}

	.navigation-button:has(.navigation-option:active) {
		transform: none;
	}

	.link-button {
		flex-grow: 1;
		border: none;
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		aspect-ratio: 1/1;
	}

	.navigation-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--content-margin);
		flex-grow: 1;
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		height: 45px;
		background-color: var(--box-color);
	}

	.navigation-button:not(.navigation-button-small) {
		height: fit-content;
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

	.logo-image {
		width: 100%;
		max-width: 800px;
		margin-inline: auto;
		box-sizing: border-box;
		padding-inline: var(--layout-margin);
		margin-top: 200px;
		height: auto;
		filter: drop-shadow(0 0 10px rgba(43, 43, 43, 0.25));
	}

	.red-fade {
		position: absolute;
		inset: 0;
		bottom: 50%;
		background: linear-gradient(var(--panel-color), transparent);
		opacity: 0.5;
	}

	.account-button {
		flex-basis: 60%;
	}

	.navigation-box-half {
		width: auto;
		flex-basis: 0;
	}

	#account-name-area {
		flex-grow: 1;
		overflow: hidden;
		white-space: nowrap;
		text-align: start;
	}

	#account-name {
		color: white;
		display: inline-block;
		width: fit-content;
		margin-top: -3px;
		box-sizing: border-box;
	}

	.account-name-button {
		overflow: hidden;
		min-width: 150px;
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
			/* adjust second param to be max-width of element minus about 5px */
			transform: translateX(calc(-100% + 250px));
		}
	}
</style>

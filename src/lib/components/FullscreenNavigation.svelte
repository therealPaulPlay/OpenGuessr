<script>
	import { goto } from "$app/navigation";
	import { isAuthenticated, supporterLevel, username } from "$lib/stores/accountStore";
	import { singleplayer } from "$lib/stores/modeStore";
	import { fullscreenNavigation, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip";
	import { fade, scale } from "svelte/transition";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { UserRoundPlus } from "@lucide/svelte";

	let preventNavigateOut = $derived(!$singleplayer);

	let scrollNameText = $state(false);

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 8;
	}

	username.subscribe((value) => {
		if (value) checkTextLength(value);
	});
</script>

{#if $fullscreenNavigation}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fullscreen-navigation-overlay"
		tabindex="0"
		role="button"
		transition:fade={{ duration: 100 }}
		onclick={(e) => {
			$fullscreenNavigation = false;
		}}
	>
		<div class="navigation-menu">
			<div class="navigation-box barMenu" in:scale={{ delay: 0 }}>
				<button
					class="standardButton white navigation-button navigation-button-large"
					disabled={preventNavigateOut}
					onclick={() => {
						goto("/multiplayer");
						playSound("basic_button");
					}}
					>Multiplayer
					<img class="navigation-icon" src="/img/multiplayer_icon.png" alt="multiplayer menu" />
				</button>
				<button
					class="standardButton white navigation-button"
					disabled={preventNavigateOut}
					onclick={() => {
						goto("/competitions");
						playSound("basic_button");
					}}
				>
					Competitions
					<img class="navigation-icon" src="/img/competitions_icon.png" alt="Competitions" />
				</button>
				<button
					class="standardButton white navigation-button"
					disabled={preventNavigateOut}
					onclick={() => {
						playSound("basic_button");
						goto("/leaderboard");
					}}
				>
					Leaderboard <img class="navigation-icon" src="/img/leaderboards_icon.png" alt="Leaderboard for OpenGuessr" />
				</button>
			</div>
			<div class="navigation-box barMenu" in:scale={{ delay: 50 }}>
				<button
					class="standardButton white navigation-button"
					disabled={preventNavigateOut}
					onclick={() => {
						goto("/maps");
						playSound("basic_button");
					}}
				>
					Maps
					<img class="navigation-icon" src="/img/maps_icon.png" alt="Maps" />
				</button>
				<button
					class="standardButton white navigation-button navigation-button-small"
					disabled={preventNavigateOut}
					use:tooltip={{ text: "Education" }}
					onclick={() => {
						playSound("basic_button");
						window.open("https://education.openguessr.com", "_blank");
					}}
				>
					<img src="/img/education_icon.png" alt="Learn" class="navigation-icon" />
				</button>
			</div>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="navigation-box barMenu" in:scale={{ delay: 100 }}>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				{#if $isAuthenticated}
					<div
						class="navigation-button standardButton white"
						class:notSignedIn={!$isAuthenticated}
						class:profileInfoSupporter={$supporterLevel >= 1}
						onclick={() => {
							loadProfileFromId(localStorage.getItem("id"));
							playSound("basic_button");
						}}
					>
						<div id="account-name-area" class:account-name-fade={scrollNameText}>
							<p id="account-name" contenteditable="false" class:namescroll={scrollNameText}>
								{$username || "Guest"}
							</p>
						</div>
						<ExperienceLevelCircle />
					</div>
				{:else}
					<button
						class="standardButton navigation-button"
						onclick={() => {
							playSound("basic_button");
							signupPrompt();
						}}>Log in<UserRoundPlus strokeWidth={2.35} size={20} style="margin-inline: 2px;" /></button
					>
				{/if}
				<button
					class="standardButton white navigation-button navigation-button-small"
					disabled={preventNavigateOut}
					use:tooltip={{ text: "Shop" }}
					onclick={() => {
						goto("/shop");
						playSound("basic_button");
					}}
				>
					<img class="navigation-icon" src="/img/shop_icon.png" alt="Shop" />
				</button>
				<button
					class="standardButton white navigation-button navigation-button-small"
					id="settingsButtonMobile"
					use:tooltip={{ text: "Settings" }}
					onclick={() => {
						playSound("basic_button");
						settingsPopup.set(true);
					}}
				>
					<img src="/img/settings_icon.png" alt="Settings" class="navigation-icon" id="settingsIcon" />
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
		display: block;
		background-color: var(--dark-background);
		backdrop-filter: blur(5px);
	}

	.navigation-menu {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--panel-margin);
		max-width: 400px;
		margin-inline: auto;
		padding-inline: var(--layout-margin);
	}

	.navigation-box {
		border-radius: var(--layout-margin);
		display: flex;
		justify-content: end;
		flex-wrap: wrap;
		gap: var(--panel-margin);
		flex-grow: 1;
	}

	.navigation-icon {
		width: 20px;
		height: auto;
		margin-inline: 2px;
		margin-bottom: -1px;
	}

	.navigation-button {
		height: 50px;
		width: auto;
		border-radius: var(--box-margin);
		flex-grow: 1;
		flex-basis: 0;
		display: flex;
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		padding-inline: var(--layout-margin);
	}

	.navigation-button-small {
		justify-content: center;
		flex-grow: 0;
	}

	.navigation-button,
	.navigation-button * {
		font-size: 22px;
	}

	.navigation-button-large {
		width: 100%;
		flex-basis: 100%;
	}

	#account-name-area {
		width: 100px;
		overflow: hidden;
		white-space: nowrap;
		text-align: start;
	}

	#account-name {
		color: white;
		display: inline-block;
		width: fit-content;
		margin-top: -3px;
	}

	.account-name-fade {
		mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
	}
</style>

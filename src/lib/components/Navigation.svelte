<script>
	import { goto } from "$app/navigation";
	import { isAuthenticated, supporterLevel, username } from "$lib/stores/accountStore";
	import { singleplayer } from "$lib/stores/modeStore";
	import { bugspotPopup, navigationMenu, settingsPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip";
	import { fade, fly, scale } from "svelte/transition";
	import ExperienceLevelCircle from "./ExperienceLevelCircle.svelte";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { Bug, PencilRuler, Section, UserRoundPlus } from "@lucide/svelte";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { page } from "$app/state";
	import { onMount } from "svelte";

	let preventNavigateOut = $derived(!$singleplayer);
	let scrollNameText = $state(false);
	let navigationListEnlarged = $state(false);
	let navigationContentClickable = $state(false);

	$effect(() => {
		if (navigationListEnlarged) {
			const timeoutId = setTimeout(() => {
				navigationContentClickable = true;
			}, 250);
			return () => {
				clearTimeout(timeoutId);
				navigationContentClickable = false;
			};
		} else {
			navigationContentClickable = false;
		}
	});

	function checkTextLength(text) {
		const textLength = text.length;
		scrollNameText = textLength > 8;
	}

	username.subscribe((value) => {
		if (value) checkTextLength(value);
	});

	$effect(() => {
		if ($navigationMenu === false) navigationListEnlarged = false;
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key == "Escape" && $navigationMenu) $navigationMenu = false;
	}}
/>

{#if $navigationMenu}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fullscreen-navigation-overlay"
		style:display={page.url.pathname !== "/" ? "none" : ""}
		tabindex="0"
		role="button"
		transition:fade={{ duration: 100 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) $navigationMenu = false;
		}}
	>
		<div class="navigation-menu">
			<div class="navigation-box barMenu" in:scale={{ delay: 0 }}>
				<button
					class="standardButton white navigation-button navigation-button-large largeButton"
					disabled={preventNavigateOut}
					onclick={() => {
						goto("/multiplayer");
						playSound("basic_button");
					}}
					>Multiplayer
					<img class="navigation-icon" src="/img/multiplayer_icon.png" alt="multiplayer menu" />
				</button>
				<button
					class="standardButton white navigation-button largeButton"
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
					class="standardButton white navigation-button largeButton"
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
					class="standardButton white navigation-button largeButton"
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
					class="standardButton white navigation-button navigation-button-small largeButton"
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
						class="navigation-button standardButton white largeButton"
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
						class="standardButton navigation-button largeButton"
						onclick={() => {
							playSound("basic_button");
							signupPrompt();
						}}>Log in<UserRoundPlus strokeWidth={2.35} size={20} style="margin-inline: 2px;" /></button
					>
				{/if}
				<button
					class="standardButton white navigation-button navigation-button-small largeButton"
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
					class="standardButton white navigation-button navigation-button-small largeButton"
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
		{#if navigationListEnlarged}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="navigation-list-hover-overlay"
				transition:fade={{ duration: 150 }}
				onclick={() => (navigationListEnlarged = false)}
			></div>
		{/if}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="navigation-list barMenu"
			class:hovered={navigationListEnlarged}
			onpointerenter={(e) => {
				if (e.pointerType !== "touch") navigationListEnlarged = true;
			}}
			onpointerleave={(e) => {
				if (e.pointerType !== "touch") navigationListEnlarged = false;
			}}
			onpointerdown={(e) => {
				if (e.pointerType === "touch") navigationListEnlarged = true;
			}}
			in:fly={{ delay: 50, x: -10, y: 100, duration: 350 }}
		>
			<div class="navigation-list-content" style:pointer-events={navigationContentClickable ? "auto" : "none"}>
				<TitleSeparator text="Links" noMargin={true} class="main-menu-list-header" />
				<button
					class="list-button"
					aria-label="Report bug"
					onclick={() => {
						playSound("basic_button");
						navigationListEnlarged = false;
						$bugspotPopup = true;
					}}
				>
					Report bug
					<Bug size={21} strokeWidth={2.25} style="margin-bottom: -2px;" />
				</button>
				<button
					class="list-button"
					onclick={() => {
						playSound("basic_button");
						navigationListEnlarged = false;
						window.open($discordInviteUrl, "_blank").focus();
					}}
				>
					Discord
					<img src="/img/discord.png" alt="Discord Logo" class="socialIcon bottomBarIcon" />
				</button>
				<button
					class="list-button"
					onclick={() => {
						playSound("basic_button");
						navigationListEnlarged = false;
						window.open("https://www.reddit.com/r/OpenGuessr/", "_blank").focus();
					}}
				>
					Reddit
					<img src="/img/reddit.png" alt="Reddit Logo" class="socialIcon bottomBarIcon" />
				</button>
				<button
					class="list-button"
					onclick={() => {
						playSound("basic_button");
						navigationListEnlarged = false;
						goto("/legal");
					}}
				>
					Legal <Section size={20} strokeWidth={2.25} />
				</button>
				<button
					class="list-button"
					onclick={() => {
						playSound("basic_button");
						navigationListEnlarged = false;
						window.open("https://paulplay.studio/openguessr", "_blank").focus();
					}}
				>
					About <PencilRuler size={20} strokeWidth={2.25} />
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
		gap: var(--box-margin);
		max-width: 400px;
		margin-inline: auto;
		padding-inline: var(--layout-margin);
	}

	.navigation-box {
		border-radius: var(--layout-margin);
		justify-content: end;
		flex-wrap: wrap;
		flex-grow: 1;
	}

	.navigation-icon {
		width: 20px;
		height: auto;
		margin-inline: 2px;
		margin-bottom: -1px;
	}

	.navigation-button {
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

	.navigation-list {
		position: fixed;
		z-index: 3;
		height: 240px;
		display: flex;
		box-sizing: border-box;
		bottom: calc(-1 * var(--layout-margin) * 4.25);
		left: var(--layout-margin);
		width: 200px;
		overflow: hidden;
		margin-inline: auto;
		border-radius: var(--layout-margin);
		rotate: 5deg;
		padding-inline: var(--layout-margin);
		transition:
			rotate 250ms ease,
			bottom 250ms ease,
			left 250ms ease;
	}

	.navigation-list-content {
		mask-image: linear-gradient(to bottom, black 40%, rgba(0, 0, 0, 0.15) 75%);
		justify-content: start;
		align-items: start;
		flex-direction: column;
		display: flex;
		width: 100%;
		gap: var(--box-margin);
		height: 100%;
	}

	@media (max-width: 1200px) {
		.navigation-list {
			bottom: calc(-1 * var(--layout-margin) * 10);
		}

		.navigation-list-content {
			mask-image: linear-gradient(to bottom, black 20%, rgba(0, 0, 0, 0.15) 30%);
		}
	}

	.hovered {
		rotate: 0deg !important;
		left: var(--layout-margin);
		bottom: var(--layout-margin);
	}

	.hovered .navigation-list-content {
		mask-image: none;
	}

	.list-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: white;
		transition:
			color 250ms ease,
			opacity 250ms ease;
	}

	.navigation-list-hover-overlay {
		position: fixed;
		inset: 0;
		z-index: 1;
		background-color: var(--box-color-dark);
	}

	.list-button:hover {
		opacity: 0.5;
	}

	:global(.main-menu-list-header) {
		padding-top: 5px;
	}
</style>

<script>
	import { PlusCircle, Unplug, ContactRound, TriangleAlert, Info, Earth, BicepsFlexed, Search, X } from "lucide-svelte";
	import { divisionMatchHistoryPopup, friendBrowserPopup, inboxPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { isAuthenticated, warnReportEntryData } from "$lib/stores/accountStore";
	import { loadedFriendsData, hostStage, skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
	import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
	import { loadFriends, removeFriend } from "$lib/logic/friendAPI";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { findDuel } from "$lib/logic/multiplayerLogic";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { goto } from "$app/navigation";
	import { onDestroy, onMount } from "svelte";
	import { blur, fade, scale, slide } from "svelte/transition";
	import { bounceInOut } from "svelte/easing";
	import { ChevronDown, ChevronUp, History } from "lucide-svelte";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { fetchWarnlistStatus } from "$lib/utils/checkReportStatus";
	import { get } from "svelte/store";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { showNotification } from "$lib/utils/notifications";
	import { tooltip } from "$lib/utils/tooltip";

	let friendsRefreshInterval;

	onMount(async () => {
		hostStage.set(1); // Reset host stage
		await loadFriends();
		clearInterval(friendsRefreshInterval);

		// Re-fetch friends every X seconds
		friendsRefreshInterval = setInterval(() => {
			loadFriends();
		}, 15000);

		// Check warnlist if logged in and not already (async)
		fetchWarnlistStatus();
	});

	onDestroy(() => {
		clearInterval(friendsRefreshInterval);
	});

	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1, 1); // Set to first day of next month
</script>

<svelte:head>
	<title>Multiplayer</title>
</svelte:head>

<div class="main-container">
	<div class="headerContainer">
		<h1 class="header">Multiplayer</h1>
	</div>
	{#if $warnReportEntryData}
		<div class="infoContainer warnInfo" transition:slide>
			<TriangleAlert color="white" strokeWidth={2.5} class="infoIcon triangleAlertMarginRight" />
			<p>
				You are currently on the warnlist and under close observation for "{get(warnReportEntryData)?.reason?.trim()}".
				Please contact the moderators on Discord if you think this is a mistake. Warnings can quickly turn into bans if
				ignored in order to keep the game a safe place. This warning will expire on {get(warnReportEntryData).expires_at
					? new Date(get(warnReportEntryData)?.expires_at).toLocaleDateString()
					: "forever"}.
			</p>
		</div>
	{/if}
	<div class="playBox">
		<div class="groupPartyButtons">
			<p class="playButtonsHeader">Custom</p>
			<div class="groupPartyContent">
				<button
					in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
					id="multiplayerSelectJoin"
					class="standardButton multiplayerSelect white"
					href="/multiplayer/join"
					onclick={() => {
						playSound("basic_button");
						goto("/multiplayer/join");
					}}
					>Join <span class="groupIcons"><Unplug size={20} strokeWidth={2.25} style="margin-bottom: -1px;" /></span
					></button
				>
				<button
					in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
					id="multiplayerSelectHost"
					class="standardButton multiplayerSelect white"
					href="/multiplayer/host"
					onclick={() => {
						playSound("basic_button");
						goto("/multiplayer/host");
					}}
					>Host <span class="groupIcons"><PlusCircle size={20} strokeWidth={2.25} style="margin-bottom: -1px;" /></span
					></button
				>
			</div>
		</div>
		<div class="groupPartyButtons">
			<div class="playButtonsHeader">
				<p>Matchmaking</p>
			</div>
			<div class="groupPartyContent">
				<button
					in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
					id="multiplayerSelectDuels"
					class="standardButton multiplayerSelect"
					href="/multiplayer/duel"
					onclick={() => {
						playSound("basic_button");
						findDuel();
					}}
				>
					Find duel
					<Search size={20} strokeWidth={2.75} style="margin-bottom: -2px; margin-left: 1px;" />
				</button>
				<button
					class="standardButton white multiplayerSelect"
					use:tooltip={{ text: "Skill-based / Everyone" }}
					style:flex-grow={0}
					onclick={() => {
						$skillBasedMatchmaking = !$skillBasedMatchmaking;
						showNotification("Matchmaking set to " + ($skillBasedMatchmaking ? "skill-based." : "everyone."));
					}}
				>
					{#if $skillBasedMatchmaking}
						<BicepsFlexed strokeWidth={1.75} style="margin-bottom: -3px;" />
					{:else}
						<Earth strokeWidth={1.75} style="margin-bottom: -3px;" />
					{/if}
				</button>
				<button
					class="standardButton white multiplayerSelect"
					use:tooltip={{ text: "History" }}
					style:flex-grow={0}
					onclick={() => {
						playSound("basic_button");
						divisionMatchHistoryPopup.set(true);
					}}><History strokeWidth={2} style="margin-bottom: -4px;" /></button
				>
			</div>
		</div>
	</div>
	<div class="headerContainer headerMarginTop">
		<h2 class="header">Divisions</h2>
	</div>
	<div class="infoContainer">
		<Info
			strokeWidth={2.25}
			size={24}
			color="white"
			style="opacity: 50%; margin-right: 5px; margin-left: 2px; min-width: 24px;"
		/>
		<p>
			Elo above 2000 will be converted into tokens on {nextMonth.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})}.
		</p>
	</div>
	<DuelDivisionDisplay />
	<div class="headerContainer headerMarginTop">
		<h2 class="header">Friends</h2>
		<!-- Inbox and Friend request buttons-->
		<div class="friendButtonBox">
			<button
				class="standardButton white friendActionButton"
				onclick={() => {
					playSound("basic_button");
					if ($isAuthenticated) {
						friendBrowserPopup.set(true);
					} else {
						signupPrompt();
					}
				}}><p class="addFriendText">Add friend <ContactRound strokeWidth={2} size={22} /></p></button
			>
			<button
				class="standardButton white friendActionButton"
				onclick={() => {
					playSound("basic_button");
					if ($isAuthenticated) {
						inboxPopup.set(true);
					} else {
						signupPrompt();
					}
				}}
			>
				Inbox
				<img alt="inbox icon" src={$inboxIconNew ? "/img/inbox_icon_new.png" : "/img/inbox_icon.png"} id="inboxIcon" />
			</button>
		</div>
	</div>
	<div class="friendBox">
		<div class="friendBoxScroll of-top of-bottom" style:min-height={$loadedFriendsData ? "50px" : "80px"}>
			{#if $loadedFriendsData && $isAuthenticated}
				<div class="innerFriendBox" transition:blur={{ duration: 150 }}>
					{#each $loadedFriendsData as entry}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="friendItem"
							role="menu"
							tabindex="0"
							onclick={() => {
								loadProfileFromId(entry.id, true);
							}}
						>
							{#if entry.online}
								<div transition:scale class="friendOnlineBar"></div>
							{/if}
							<p>{entry.user_name}</p>
							<button
								id="removeFriend"
								class="standardButton friendItemButtons white friendButtonLeft"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									showConfirmPopup("Remove friend?", "You are about to remove your friend from your list.", () => {
										removeFriend(entry.id);
									});
								}}
							>
								<X size={20} strokeWidth={2.5} style="vertical-align: -1px;" />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="noFriendsText">Added friends show up here.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.infoContainer {
		display: flex;
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: 15px;
		align-items: center;
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		gap: 5px;
	}

	:global(.skillBasedToggle) {
		flex-grow: 0;
		border-radius: 10px !important;
		height: 50px !important;
	}

	.warnInfo {
		flex-wrap: wrap;
	}

	:global(.infoIcon) {
		width: 30px;
		height: 30px;
		opacity: 0.5;
		margin-inline: 3px;
	}

	.friendButtonLeft {
		margin-left: auto;
	}

	:global(.triangleAlertMarginRight) {
		margin-right: auto;
		margin-bottom: 5px;
		width: 25px;
		height: 25px;
	}

	.infoContainer p {
		opacity: 0.5;
		flex-grow: 100;
	}

	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.addFriendText {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
	}

	.playBox {
		width: 100%;
		display: flex;
		justify-content: flex-start;
		gap: var(--layout-margin);
		flex-wrap: wrap;
	}

	.friendActionButton {
		justify-content: center !important;
		min-height: 50px;
		padding-inline: 15px;
		border-radius: 10px;
	}

	.playButtonsHeader {
		width: calc(100% - 10px);
		opacity: 0.5;
		padding-inline: 5px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--box-margin);
		overflow: hidden;
	}

	.headerMarginTop {
		margin-top: 50px;
	}

	.friendButtonBox {
		display: flex;
		gap: var(--layout-margin);
	}

	.friendItem {
		border-radius: 10px;
		display: flex;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--box-shadow);
		padding-inline: 6px !important;
		transition:
			filter 250ms ease,
			transform 250ms ease,
			scale 250ms ease;
		height: 50px;
		align-items: center;
		justify-content: space-between;
		border: none;
		gap: 3px;
		padding-bottom: 1px;
		flex-grow: 1;
		max-width: 25%;
		overflow: hidden;
		text-wrap: nowrap;
		cursor: pointer;
	}

	.friendItem:hover {
		filter: brightness(70%);
	}

	.friendItem:active {
		/* Shrink effect when pressed */
		transform: scale(0.95);
	}

	@media (max-width: 800px) {
		.friendItem {
			max-width: none;
		}
	}

	.friendItem p {
		padding-inline: 5px;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.friendItemButtons {
		padding-inline: 5px;
	}

	.groupIcons {
		margin-inline: 3px;
		vertical-align: -2px;
	}

	.groupPartyButtons {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
		align-items: center;
		flex-grow: 1.5;
		flex-basis: 0;
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		border-radius: 15px;
		max-width: calc(100% - 20px);
	}

	.groupPartyContent {
		width: 100%;
		display: flex;
		margin-top: -2px;
		gap: var(--box-margin);
	}

	.multiplayerSelect {
		height: 50px;
		width: auto;
		flex-grow: 1;
		border-radius: 10px;
	}

	#multiplayerSelectDuels {
		background-color: var(--brand-color);
		color: white;
		position: relative;
		overflow: hidden;
	}

	#multiplayerSelectDuels::before {
		animation: duelButtonGlint 4s 0.75s infinite;
		background: white;
		filter: blur(15px);
		content: "";
		opacity: 0;
		position: absolute;
		width: 40px;
		z-index: 1;
		height: 200%;
		top: -20px;
		left: 0;
		transform: rotate(30deg);
		pointer-events: none;
	}

	.noFriendsText {
		opacity: 0.5;
		text-align: center;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.friendOnlineBar {
		width: 6px;
		border-radius: 5px;
		height: 10px;
		background-color: #00cc00;
		margin-top: 3px;
		margin-left: 5px;
	}

	.friendBox {
		width: calc(100% - 20px);
		transition: max-height 150ms ease;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: 15px;
		padding: var(--box-margin);
		margin-bottom: 50px;
		position: relative;
		scrollbar-width: none;
	}

	.friendBoxScroll {
		overflow-y: auto;
		max-height: 250px;
		width: 100%;
	}

	.innerFriendBox {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--box-margin);
	}

	#inboxIcon {
		width: 18px;
		height: 18px;
		vertical-align: -2px;
		margin-left: 5px;
	}

	@keyframes duelButtonGlint {
		0% {
			opacity: 0.7;
			margin-left: -60px;
			visibility: visible;
		}

		20% {
			opacity: 0.5;
			margin-left: calc(100% + 60px);
		}

		100% {
			opacity: 0.5;
			margin-left: calc(100% + 60px);
		}
	}
</style>

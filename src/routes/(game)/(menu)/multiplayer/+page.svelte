<script>
	import { PlusCircle, Unplug, Swords, ContactRound, TriangleAlert } from "lucide-svelte";
	import { divisionMatchHistoryPopup, friendBrowserPopup, inboxPopup, troubleshootPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import {
		checkedForBan,
		isAuthenticated,
		isBanned,
		banReportEntryData,
		warnReportEntryData,
	} from "$lib/stores/accountStore";
	import { loadedFriendsData, hostStage, skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
	import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
	import { loadFriends, removeFriend, sendMatchInvite } from "$lib/logic/friendAPI";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { findDuel } from "$lib/logic/multiplayerLogic";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { goto } from "$app/navigation";
	import { onDestroy, onMount } from "svelte";
	import { fade, scale, slide } from "svelte/transition";
	import { bounceInOut } from "svelte/easing";
	import { getEloLeaderboard } from "$lib/logic/userAPI";
	import { ChevronDown, ChevronUp, History } from "lucide-svelte";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { fetchBlacklistStatus, fetchWarnlistStatus } from "$lib/utils/checkBanStatus";
	import { get } from "svelte/store";
	import Tabs from "$lib/components/ui/Tabs.svelte";

	let friendsRefreshInterval;

	onMount(async () => {
		hostStage.set(1); // Reset host stage
		await loadFriends();
		clearInterval(friendsRefreshInterval);

		// Re-fetch friends every X seconds
		friendsRefreshInterval = setInterval(() => {
			loadFriends();
		}, 15000);

		// Check blacklist & warnlist if logged in and not already (async)
		fetchBlacklistStatus();
		fetchWarnlistStatus();
	});

	onDestroy(() => {
		clearInterval(friendsRefreshInterval);
	});

	// Division leaderboard
	let divisionLeaderboard = $state([]);
	let isExpanded = $state(false);

	$effect(async () => {
		if (isExpanded && divisionLeaderboard.length == 0) divisionLeaderboard = await getEloLeaderboard();
	});

	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1, 1); // Set to first day of next month

	// Skill based toggle
	let skillBasedTabsValue = $derived($skillBasedMatchmaking ? 1 : 0);
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
			<p class="playButtonsHeader">
				Custom
				<button
					class="white standardButton transparentPillButton"
					onclick={() => {
						playSound("basic_button");
						troubleshootPopup.set(true);
					}}
					>Troubleshooting
					<img
						class="multiplayerMenuIcon"
						src="/img/error_icon.png"
						alt="Lightning error symbol"
						style="opacity: 60%; width: 18px;"
					/></button
				>
			</p>
			<div class="groupPartyContent">
				<button
					in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
					id="multiplayerSelectJoin"
					class="standardButton multiplayerSelect white"
					href="/multiplayer/join"
					onclick={() => {
						playSound("basic_button");
						goto("/multiplayer/join");
					}}>Join <span class="groupIcons"><Unplug size={19} strokeWidth={2.5} /></span></button
				>
				<button
					in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
					id="multiplayerSelectHost"
					class="standardButton multiplayerSelect white"
					href="/multiplayer/host"
					onclick={() => {
						playSound("basic_button");
						goto("/multiplayer/host");
					}}>Host <span class="groupIcons"><PlusCircle size={19} strokeWidth={2.5} /></span></button
				>
			</div>
		</div>
		<div class="groupPartyButtons">
			<div class="playButtonsHeader">
				<p>Matchmaking</p>
				<div class="duelOptionsContainer">
					<button
						class="standardButton white transparentPillButton"
						onclick={() => {
							playSound("basic_button");
							divisionMatchHistoryPopup.set(true);
						}}
						><span class="historyButtonText">History </span><History
							size={19}
							strokeWidth={2.5}
							style="margin-bottom: -3px;"
						/></button
					>
					<Tabs
						tabs={["Any", "Skill-based"]}
						class="skillBasedToggle"
						selectedIndex={skillBasedTabsValue}
						onchange={(_, selectionIndex) => {
							playSound("basic_button");
							$skillBasedMatchmaking = selectionIndex != 0;
						}}
					/>
				</div>
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
					Find Duel
					<img
						class="multiplayerMenuIcon"
						style="margin-left: 5px;"
						src="/img/find_icon.png"
						alt="Lightning error symbol"
					/>
				</button>
			</div>
		</div>
	</div>
	<div class="headerContainer headerMarginTop">
		<h2 class="header">Divisions</h2>
	</div>
	<div class="infoContainer">
		<img alt="info icon" class="infoIcon" src="/img/info_icon.png" />
		<p>
			Elo above 2000 will be reset on {nextMonth.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})}.
		</p>
	</div>
	<DuelDivisionDisplay />
	<!-- Division leaderboard -->
	<div class="leaderboardSection">
		<button class="sectionButton" onclick={() => (isExpanded = !isExpanded)}>
			<span class="flexSectionSpan">
				<img class="duelLeaderboardIcon" src="/img/leaderboards_icon.png" alt="duel leaderboard" />
				<p>Leaderboard</p>
			</span>
			{#if isExpanded}
				<ChevronUp size={20} strokeWidth={3} />
			{:else}
				<ChevronDown size={20} strokeWidth={3} />
			{/if}
		</button>

		{#if isExpanded}
			<div class="divisionLeaderboardContainer" transition:slide={{ duration: 150 }}>
				{#if divisionLeaderboard?.length > 0}
					{#each divisionLeaderboard as entry}
						<div
							class="divisionLeaderboardEntry"
							class:leaderboardSupporter={entry?.supporter_level > 0}
							class:divisionLeaderboardEntryYou={entry.id == localStorage.getItem("id")}
						>
							<p>#{entry.position}</p>
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<p class="leaderboardUserName" onclick={() => loadProfileFromId(entry.id, true)}>
								{entry.user_name}
							</p>
							<p>{entry.elo} Elo</p>
						</div>
					{/each}
				{:else}
					<p class="divisionLeaderboardLoading">Division leaderboard is loading...</p>
				{/if}
			</div>
		{/if}
	</div>
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
				}}><p class="addFriendText">Add friend <ContactRound strokeWidth={2.5} size={20} /></p></button
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
	<div class="friendBox" style:min-height={$loadedFriendsData ? "50px" : "80px"}>
		{#if $loadedFriendsData && $isAuthenticated}
			<div class="innerFriendBox" transition:fade={{ duration: 150 }}>
				{#each $loadedFriendsData as entry}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="standardButton white friendItem"
						role="menu"
						tabindex="0"
						onclick={() => {
							loadProfileFromId(entry.id, true);
						}}
					>
						{#if entry.online}
							<div class="friendOnlineBar"></div>
						{/if}
						<p>{entry.user_name}</p>
						<button
							id="duelFriend"
							class="standardButton friendItemButtons white"
							onclick={(e) => {
								e.stopPropagation();
								playSound("basic_button");
								sendMatchInvite(entry.id, true);
							}}
						>
							<Swords strokeWidth={3} size={17} />
						</button>
						<button
							id="removeFriend"
							class="standardButton friendItemButtons white"
							onclick={(e) => {
								e.stopPropagation();
								playSound("basic_button");
								showConfirmPopup(
									"Remove friend?",
									"You are about to remove your friend from your list. Your friend will see this and might not like it. Use this at our own risk.",
									() => {
										removeFriend(entry.id);
									},
								);
							}}
						>
							<img alt="remove friend" class="friendRemoveIcon" src="/img/delete_icon.png" />
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="noFriendsText">Added friends show up here.</p>
		{/if}
	</div>
</div>

<style>
	.infoContainer {
		display: flex;
		padding: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
		border-radius: 15px;
		align-items: center;
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		gap: 5px;
	}

	:global(.skillBasedToggle) {
		border: none !important;
		min-height: 0 !important;
		margin: 0 !important;
	}

	:global(.skillBasedToggle button) {
		padding-top: 0 !important;
		padding-bottom: 3px !important;
		min-height: 20px;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.warnInfo {
		flex-wrap: wrap;
	}

	.divisionLeaderboardLoading {
		opacity: 0.5;
	}

	.infoIcon {
		margin-inline: 1px;
		margin-right: 5px;
	}

	.duelOptionsContainer {
		display: flex;
		gap: var(--box-margin);
		justify-content: center;
		align-items: center;
	}

	.divisionLeaderboardContainer {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		border-radius: 8px;
		gap: var(--box-margin);
		margin-top: var(--layout-margin);
		overflow: hidden;
		overflow-y: auto;
		max-height: 300px;
		scrollbar-width: none;
	}

	.transparentPillButton {
		background-color: var(--box-color);
		padding-top: 0;
		padding-bottom: 3px;
		border: none;
		margin: 0;
		min-height: 20px;
	}

	.divisionLeaderboardEntry {
		display: flex;
		border-radius: 10px;
		flex-basis: 22%;
		flex-grow: 1;
		min-width: 200px;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 5px;
		padding-inline: 10px;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		box-sizing: border-box;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.divisionLeaderboardEntryYou {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.leaderboardSection {
		width: 100%;
		box-sizing: border-box;
		background-color: var(--box-color);
		border-radius: 15px;
		padding: var(--box-margin);
		min-height: 30px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
	}

	:global(.triangleAlertMarginRight) {
		margin-right: auto;
		margin-bottom: 5px;
		width: 25px;
		height: 25px;
	}

	.sectionButton {
		width: calc(100% - 10px);
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		color: white;
		font-size: 25px;
		justify-content: space-between;
		align-items: center;
		transition: opacity 250ms ease;
	}

	.flexSectionSpan {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.duelLeaderboardIcon {
		width: 22px;
		height: 22px;
	}

	.sectionButton:hover {
		opacity: 0.5;
	}

	.leaderboardUserName {
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 50%;
		transition: opacity 250ms ease;
		cursor: pointer;
	}

	.leaderboardUserName:hover {
		opacity: 0.5;
	}

	.leaderboardSupporter {
		border: 3px solid var(--supporter-green);
		padding-top: 2px;
		padding-bottom: 2px;
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
		gap: var(--box-margin-buttons);
		overflow: hidden;
	}

	.headerMarginTop {
		margin-top: 50px;
	}

	#duelFriend {
		margin-left: auto;
	}

	.friendButtonBox {
		display: flex;
		gap: var(--box-margin);
	}

	.friendItem {
		border-radius: 10px;
		display: flex;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 10px;
		padding-inline: 5px !important;
		padding-left: 12px;
		padding-bottom: 11px;
		height: 50px;
		align-items: center;
		justify-content: space-between;
		border: none;
		gap: 3px;
		flex-grow: 1;
		max-width: 25%;
		overflow: hidden;
		margin: 0;
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
		max-width: 50%;
	}

	.friendItemButtons {
		padding-inline: 5px;
	}

	.friendRemoveIcon {
		width: 25px;
		height: 25px;
		vertical-align: -4px;
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
		border-radius: 15px;
		max-width: calc(100% - 20px);
	}

	.groupPartyContent {
		width: 100%;
		display: flex;
		margin-top: -2px;
		gap: var(--box-margin-buttons);
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
		animation: duelButtonGlint 4s 0.5s infinite;
		background: white;
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

	.multiplayerMenuIcon {
		width: 20px;
		height: auto;
		margin-bottom: -2px;
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
		height: 30%;
		background-color: #00cc00;
		margin-top: 4px;
		margin-right: 3px;
	}

	.friendBox {
		width: calc(100% - 20px);
		transition: max-height 150ms ease;
		background-color: var(--box-color);
		border-radius: 15px;
		border: var(--box-margin) solid transparent;
		overflow: hidden;
		overflow-y: auto;
		max-height: 250px;
		margin-bottom: 50px;
		position: relative;
		scrollbar-width: none;
	}

	.innerFriendBox {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--box-margin);
	}

	#inboxIcon {
		width: 20px;
		height: 20px;
		vertical-align: -3px;
		margin-left: 5px;
	}

	.historyButtonText {
		margin-right: 5px;
	}

	@media (max-width: 768px) {
		.historyButtonText {
			display: none;
		}
	}

	@keyframes duelButtonGlint {
		0% {
			opacity: 0.5;
			margin-left: -60px;
			visibility: visible;
		}

		20% {
			opacity: 0.3;
			margin-left: calc(100% + 60px);
		}

		100% {
			opacity: 0.3;
			margin-left: calc(100% + 60px);
		}
	}
</style>

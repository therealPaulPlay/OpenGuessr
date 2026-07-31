<script>
	import {
		PlusCircle,
		Unplug,
		TriangleAlert,
		BicepsFlexed,
		X,
		History,
		Globe,
		Handshake,
		Plus,
		MessagesSquare,
		InfoIcon,
	} from "@lucide/svelte";
	import { divisionMatchHistoryPopup, friendBrowserPopup, messagesPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { isAuthenticated, warnReportEntryData } from "$lib/stores/accountStore";
	import { loadedFriendsData, skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
	import { newFriendRequest } from "$lib/stores/context-specific/inboxStore";
	import { loadFriends, removeFriend } from "$lib/logic/friendAPI";
	import { showProfile } from "$lib/utils/showProfile";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { createTeamDuelRoom, findDuel } from "$lib/logic/matchmakingLogic";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { goto } from "$app/navigation";
	import { onDestroy, onMount } from "svelte";
	import { blur, slide } from "svelte/transition";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { fetchWarnlistStatus } from "$lib/utils/checkReportStatus";
	import { get } from "svelte/store";
	import { showNotification } from "$lib/utils/notifications";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import TournamentOverview from "$lib/components/TournamentOverview.svelte";
	import Drawer from "$lib/components/ui/Drawer.svelte";
	import Chip from "$lib/components/ui/Chip.svelte";
	import { hasNewMessageOrInvite, hcClient, initialHasNew } from "$lib/stores/context-specific/headlessChatStore";
	import { historyForUserId } from "$lib/stores/context-specific/divisionMatchHistoryStore";

	let friendsRefreshInterval;

	onMount(async () => {
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

	// Check if user has new messages or new invites (only if they have a hcClient, and only once)
	$effect(async () => {
		if ($hcClient && $hasNewMessageOrInvite === null) {
			try {
				$initialHasNew = false; // Set non-null to prevent re-runs (updates the derived hasNewMessageOrInvite)
				const result = await $hcClient.getHasNew();
				$initialHasNew = result.hasNewMessages || result.hasNewInvites;
			} catch (error) {
				console.error("Failed to get hasNew state from headless-chat:", error);
			}
		}
	});
</script>

<svelte:head>
	<title>Multiplayer</title>
</svelte:head>

<div class="main-container">
	<div class="header-container">
		<h1 class="header">Multiplayer</h1>
	</div>
	{#if $warnReportEntryData}
		<div class="info-container warn-info" transition:slide>
			<TriangleAlert color="white" strokeWidth={2.25} class="multiplayer-info-icon" />
			<p>
				You are currently on the warnlist and under close observation for "{get(warnReportEntryData)?.reason?.trim()}".
				Please contact the moderators on Discord if you think this is a mistake. Warnings can quickly turn into bans if
				ignored in order to keep the game a safe place. This warning will expire on {get(warnReportEntryData).expires_at
					? new Date(get(warnReportEntryData)?.expires_at).toLocaleDateString()
					: "forever"}.
			</p>
		</div>
	{/if}
	<div class="play-box">
		<div class="group-party-buttons">
			<p class="select-buttons-header">Custom</p>
			<div class="group-party-content">
				<button
					id="multiplayer-select-join"
					class="standard-button multiplayer-select white large-button"
					onclick={() => {
						playSound("basic_button");
						goto("/multiplayer/join");
					}}
					>Join <span class="group-icons"><Unplug size={20} strokeWidth={2.25} style="margin-bottom: -2px;" /></span
					></button
				>
				<button
					id="multiplayer-select-host"
					class="standard-button multiplayer-select white large-button"
					onclick={() => {
						playSound("basic_button");
						goto("/multiplayer/host");
					}}
					>Host <span class="group-icons"><PlusCircle size={20} strokeWidth={2.25} style="margin-bottom: -2px;" /></span
					></button
				>
			</div>
		</div>
		<div class="group-party-buttons">
			<div class="select-buttons-header">
				<p>Matchmaking</p>
			</div>
			<div class="group-party-content">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					id="multiplayer-select-duels"
					role="button"
					tabindex="0"
					class="standard-button multiplayer-select large-button"
					onclick={() => {
						playSound("basic_button");
						findDuel("division-duel");
					}}
				>
					Duel
					<span class="inner-duel-button-container">
						<button
							class="standard-button dark inner-duel-button"
							{@attach tooltip({ text: "History" })}
							style:flex-grow={0}
							onclick={(e) => {
								e.stopPropagation();
								playSound("basic_button");
								$historyForUserId = localStorage.getItem("id");
								divisionMatchHistoryPopup.set(true);
							}}><History strokeWidth={2.15} size={20} style="margin-bottom: -1px;" /></button
						>
						<button
							class="standard-button dark inner-duel-button"
							{@attach tooltip({ text: "Division-based or Everyone" })}
							style:flex-grow={0}
							onclick={(e) => {
								e.stopPropagation();
								$skillBasedMatchmaking = !$skillBasedMatchmaking;
								showNotification("Matchmaking set to " + ($skillBasedMatchmaking ? "division-based." : "everyone."));
							}}
						>
							{#if $skillBasedMatchmaking}
								<BicepsFlexed strokeWidth={2} size={20} style="margin-bottom: -1px;" />
							{:else}
								<Globe strokeWidth={2} size={20} style="margin-bottom: -1px;" />
							{/if}
						</button>
					</span>
				</div>
				<button
					class="standard-button multiplayer-select large-button white"
					onclick={() => {
						playSound("basic_button");
						createTeamDuelRoom();
					}}
				>
					2v2
					<Handshake size={20} strokeWidth={2.25} style="margin-bottom: -2px;" />
				</button>
			</div>
		</div>
	</div>
	<Drawer title="Divisions" class="divisions-container" hasBottomLayoutMargin={false}>
		<DuelDivisionDisplay />
	</Drawer>
	<div class="header-container header-margin-top">
		<h2 class="header">Tournaments</h2>
	</div>
	<TournamentOverview />
	<div class="header-container header-margin-top">
		<h2 class="header">Friends</h2>
		<!-- Inbox, friend request and messages buttons-->
		<div class="friend-button-container bar-menu">
			<button
				class="standard-button white large-button"
				style:position="relative"
				{@attach tooltip({ text: "Messages" })}
				onclick={() => {
					playSound("basic_button");
					if ($isAuthenticated) messagesPopup.set(true);
					else signupPrompt();
				}}
			>
				{#if $hasNewMessageOrInvite}
					<div class="new-messages-or-invites-dot" transition:blur></div>
				{/if}
				<MessagesSquare strokeWidth={2.25} size={22} style="margin-bottom: -2px;" /></button
			>
			<button
				class="standard-button white large-button friend-add-button"
				style:position="relative"
				{@attach tooltip({ text: "Add friend" })}
				onclick={() => {
					playSound("basic_button");
					if ($isAuthenticated) friendBrowserPopup.set(true);
					else signupPrompt();
				}}
			>
				<Plus strokeWidth={2.25} size={22} />
				{#if $newFriendRequest}
					<Chip text="New" italic={true} red={true} mutedOpacity={false} />
				{/if}</button
			>
		</div>
	</div>
	{#if $loadedFriendsData?.length > 90}
		<div class="info-container warn-info" transition:slide>
			<InfoIcon color="white" strokeWidth={2.25} class="multiplayer-info-icon" />
			<p>
				You
				{#if $loadedFriendsData?.length >= 100}have reached{:else}are close to{/if}
				the maximum allowed number of friends.
			</p>
		</div>
	{/if}
	<div class="friend-box">
		<div
			class="friend-box-scroll of-top of-bottom"
			style:min-height={$loadedFriendsData && $isAuthenticated ? "50px" : "80px"}
		>
			{#if $loadedFriendsData && $isAuthenticated}
				<div class="inner-friend-box" transition:blur={{ duration: 150 }}>
					{#each $loadedFriendsData as entry (entry.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="friend-item large-button"
							role="menu"
							tabindex="0"
							onclick={() => {
								showProfile(entry.id);
							}}
						>
							{#if entry.online}
								<div transition:slide={{ axis: "x" }} class="friend-online-dot"></div>
							{/if}
							<p>{entry.user_name}</p>
							<button
								id="remove-friend"
								class="standard-button friend-item-buttons dark friend-button-left"
								onclick={(e) => {
									e.stopPropagation();
									playSound("basic_button");
									showConfirmPopup("Remove friend?", "You are about to remove this friend.", () => {
										removeFriend(entry.id);
									});
								}}
							>
								<X size={20} strokeWidth={2.25} style="vertical-align: -1px;" />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="no-friends-text">Friends show up here.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.info-container {
		display: flex;
		padding: var(--box-margin);
		box-shadow: var(--panel-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: var(--layout-margin);
		align-items: center;
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		gap: var(--content-margin);
	}

	:global(.skill-based-toggle) {
		flex-grow: 0;
		border-radius: var(--box-margin) !important;
		height: 50px !important;
	}

	.warn-info {
		flex-wrap: wrap;
	}

	.friend-add-button {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		gap: var(--panel-margin);
	}

	.friend-button-left {
		margin-left: auto;
	}

	:global(.multiplayer-info-icon) {
		width: 25px;
		height: 25px;
		opacity: 0.5;
		margin-inline: 3px;
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
	}

	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.play-box {
		width: 100%;
		display: flex;
		justify-content: flex-start;
		gap: var(--layout-margin);
		flex-wrap: wrap;
	}

	.friend-button-container {
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
	}

	.select-buttons-header {
		width: calc(100% - 10px);
		opacity: 0.5;
		padding-inline: var(--content-margin);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--box-margin);
		overflow: hidden;
	}

	.header-margin-top {
		margin-top: var(--layout-spacer);
	}

	.friend-item {
		display: flex;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--box-shadow);
		transition:
			filter 250ms ease,
			transform 250ms ease,
			scale 250ms ease;
		align-items: center;
		justify-content: space-between;
		border: none;
		padding: var(--panel-margin);
		gap: var(--content-margin);
		flex-grow: 1;
		max-width: 25%;
		overflow: hidden;
		text-wrap: nowrap;
		cursor: pointer;
		height: unset;
	}

	.friend-item:hover {
		filter: brightness(70%);
	}

	.friend-item:active {
		/* Shrink effect when pressed */
		transform: scale(0.95);
	}

	@media (max-width: 800px) {
		.friend-item {
			max-width: none;
		}
	}

	.friend-item p {
		padding-inline: var(--content-margin);
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.friend-item-buttons {
		padding-inline: var(--panel-margin);
	}

	.group-icons {
		margin-inline: 3px;
		vertical-align: -2px;
	}

	.group-party-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--box-margin);
		justify-content: center;
		align-items: center;
		flex-grow: 1.5;
		flex-basis: 0;
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
		max-width: calc(100% - 20px);
	}

	.group-party-content {
		width: 100%;
		display: flex;
		margin-top: -2px;
		gap: var(--box-margin);
	}

	.multiplayer-select {
		flex-grow: 1;
		flex-basis: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-inline: var(--layout-margin);
		gap: var(--layout-margin);
	}

	.inner-duel-button-container {
		position: absolute;
		right: calc(var(--box-margin) / 2);
		top: calc(var(--box-margin) / 2);
		gap: calc(var(--box-margin) / 2);
		bottom: auto;
		display: flex;
	}

	.inner-duel-button {
		padding-inline: var(--panel-margin);
		height: 34px;
		border: none;
	}

	#multiplayer-select-duels {
		background-color: var(--brand-color);
		color: white;
		position: relative;
		overflow: hidden;
		min-width: 150px;
	}

	#multiplayer-select-duels::before {
		animation: duelButtonGlint 4s 0.75s infinite;
		background: white;
		filter: blur(var(--elevated-blur));
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

	.no-friends-text {
		opacity: 0.5;
		text-align: center;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.new-messages-or-invites-dot {
		width: 7px;
		height: 7px;
		border-radius: 100%;
		background-color: var(--brand-color);
		position: absolute;
		top: 9px;
		right: 16px;
	}

	.friend-online-dot {
		width: 7px;
		height: 7px;
		border-radius: 100%;
		background-color: #00cc00;
		margin-left: var(--content-margin);
	}

	.friend-box {
		width: calc(100% - 20px);
		transition: max-height 150ms ease;
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		margin-bottom: var(--layout-spacer);
		position: relative;
		scrollbar-width: none;
	}

	.friend-box-scroll {
		overflow-y: auto;
		max-height: 215px;
		width: 100%;
		scrollbar-width: none;
	}

	.inner-friend-box {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--box-margin);
	}

	:global(.divisions-container) {
		margin-top: var(--layout-margin);
	}
</style>

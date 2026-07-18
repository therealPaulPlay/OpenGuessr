<script>
	import { isAuthenticated } from "$lib/stores/accountStore";
	import {
		participantCount,
		loadedFriendsData,
		multiplayerTableArray,
		roomCode,
		socket,
		teamAmount,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { loadFriends, sendMatchInvite } from "$lib/logic/friendAPI";
	import { showProfile } from "$lib/utils/showProfile";
	import { showNotification } from "$lib/utils/notifications";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { Eye, Link } from "@lucide/svelte";
	import { submitRoomCode } from "$lib/logic/matchmakingLogic.js";
	import { page } from "$app/state";
	import { get } from "svelte/store";
	import { onMount } from "svelte";
	import { blur, slide } from "svelte/transition";
	import { errorPopup } from "$lib/utils/errorHandling";

	let {
		showOpenRoom = true,
		startDisabledCondition,
		startFunction = () => console.warn("No start function passed!"),
		allowTeamControls = true,
	} = $props();

	let roomOpened = $state(false);

	// Truncate name
	function truncatePlayerName(text, max = 10) {
		return text?.length > max ? text?.slice(0, max) + "…" : text;
	}

	// Move player to different team
	async function updatePlayerTeam(playerId, newTeamIndex) {
		try {
			await get(socket)?.sendRequest("updateTeam", { newTeamIndex: parseInt(newTeamIndex), playerClientId: playerId });
		} catch (error) {
			errorPopup("Failed to update player's team", "An error occured trying to update the player's team index.", error.message);
			console.error("Error updating team:", error);
		}
	}

	// Refresh friends periodically
	let friendsRefreshInterval;

	onMount(async () => {
		await loadFriends();
		clearInterval(friendsRefreshInterval);

		// Re-fetch friends every X seconds
		friendsRefreshInterval = setInterval(() => {
			loadFriends();
		}, 15_000);

		return () => clearInterval(friendsRefreshInterval);
	});
</script>

<!-- Room code-->
<div class="multiplayer-host-settings no-gap">
	<p class="code-display-text">Join with code</p>
	<h1 id="room-code-display">
		{$roomCode?.slice(0, 3) || "..."}<span style="opacity: 50%; font-size: 40px;">-</span>{$roomCode?.slice(3) || "..."}
	</h1>
</div>

<!-- Team and player display -->
<div class="multiplayer-host-settings teams-display">
	{#if $teamAmount === 1 || !$multiplayerTableArray?.length}
		<p class="player-box-element">
			<span>No team:</span>
			{#if $multiplayerTableArray?.length > 0}
				{#each $multiplayerTableArray as player, i}
					<span class="player-name-inline"
						>{truncatePlayerName(player.username)}{#if i < $multiplayerTableArray.length - 1}<span>,&nbsp;</span>{/if}
					</span>
				{/each}
			{:else}
				<span class="team-empty">No players</span>
			{/if}
		</p>
	{:else}
		{#each Object.values($multiplayerTableArray) as team}
			{const teamIndex = $derived(team.teamIndex)}
			<p class="player-box-element player-box-teams">
				<span>{`Team ${teamIndex + 1}:`}</span>
				{#if team.players?.length > 0}
					{#each team.players as player, i (player.clientId)}
						<span class="player-name-inline">
							{truncatePlayerName(player.username)}
							<select
								name="teams"
								class="team-selector standard-button white"
								disabled={!allowTeamControls}
								onchange={(e) => {
									playSound("basic_button");
									updatePlayerTeam(player.clientId, e.target.value);
								}}
							>
								<!-- Generate select options for every team -->
								{#each Object.values($multiplayerTableArray) as teamObject}
									{const index = $derived(teamObject.teamIndex)}
									<option value={index} selected={player.teamIndex == index}>Team {index + 1}</option>
								{/each}
							</select>{#if i < team.players.length - 1}<span>,&nbsp;</span>{/if}
						</span>
					{/each}
				{:else}
					<span class="team-empty">No players</span>
				{/if}
			</p>
		{/each}
	{/if}
	<p id="small-join-counter">{$participantCount ?? "?"}</p>
</div>

<!-- Friend invite display -->
{#if $loadedFriendsData && $loadedFriendsData.filter((value) => value.online)?.length >= 1}
	<div id="friends-invite-display" class="multiplayer-host-settings" transition:slide>
		<div class="room-creation-friends-box of-top of-bottom">
			<!-- online players will be added here programmatically -->
			{#each $loadedFriendsData.filter((value) => value.online) as entry}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="standard-button room-creation-friend-item"
					transition:blur
					role="menu"
					tabindex="0"
					onclick={() => {
						showProfile(entry.id);
					}}
				>
					<p class="friends-room-entry-text">{entry.user_name}</p>
					<button
						class="standard-button white send-invite-button"
						{@attach tooltip({ text: "Invite" })}
						onclick={(e) => {
							e.stopPropagation();
							playSound("basic_button");
							sendMatchInvite(entry.id);
						}}
					>
						<img src="/img/send_icon.png" alt="send invite" class="send-icon" />
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Button area -->
<div class="multiplayer-host-submit-area bar-menu">
	<button
		id="roomcode-link"
		class="large-button standard-button white"
		{@attach tooltip({ text: "Copy link" })}
		disabled={!$roomCode}
		onclick={() => {
			playSound("basic_button");
			const roomId = get(roomCode);

			// Use regular or Crazy Games link for invitation
			const link = $crazyGames
				? window.CrazyGames.SDK.game.inviteLink({ join: roomId })
				: page.url.origin + "/?join=" + roomId;

			// Copy to Clipboard
			navigator.clipboard
				.writeText(link)
				.then(function () {
					showNotification("Copied!");
				})
				.catch(function (error) {
					showNotification("Error: " + error);
				});
		}}
	>
		<Link strokeWidth={2.75} size={18} />
	</button>
	{#if showOpenRoom}
		<button
			class="standard-button white large-button"
			{@attach tooltip({ text: "List room publicly" })}
			disabled={!$roomCode || roomOpened || !$isAuthenticated}
			onclick={async () => {
				playSound("basic_button");
				await submitRoomCode("open-room", false, localStorage.getItem("selectedMap") || $defaultMap);
				roomOpened = true;
				showNotification("Room is now publicly listed.");
			}}
		>
			<Eye strokeWidth={2.5} size={20} style="margin-bottom: -2px;" />
		</button>
	{/if}
	<button
		id="multiplayer-host"
		class="standard-button large-button"
		disabled={startDisabledCondition}
		onclick={() => {
			playSound("basic_button");
			startFunction?.();
		}}>Start</button
	>
</div>

<style>
	.multiplayer-host-submit-area {
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
	}

	.multiplayer-host-settings {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		padding-top: var(--box-margin);
		padding-bottom: var(--box-margin);
		box-shadow: var(--box-shadow);
		width: calc(100% - var(--box-margin) * 2);
	}

	#friends-invite-display {
		padding: var(--box-margin);
	}

	.code-display-text {
		opacity: 0.5;
		width: 100%;
		text-align: center;
	}

	.send-icon {
		vertical-align: -2px;
		width: 20px;
		height: 20px;
	}

	.send-invite-button {
		padding: 0;
		padding-inline: var(--content-margin);
		height: 35px !important;
	}

	.room-creation-friend-item {
		background-color: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: var(--box-margin);
		display: flex;
		height: fit-content;
		justify-content: space-between;
		align-items: center;
		padding: var(--panel-margin);
		flex-grow: 1;
		box-shadow: var(--box-shadow);
	}

	.teams-display {
		position: relative;
		min-height: 27px;
		font-size: 22px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.player-box-element {
		width: calc(100% - 85px);
		text-align: center;
	}

	.player-box-element span {
		color: rgba(255, 255, 255, 0.5) !important;
	}

	.player-box-element.player-box-teams {
		margin-bottom: 2px;
		line-height: 32px;
	}

	.player-name-inline {
		display: inline-block;
	}

	.team-selector {
		padding: 0px 4px;
		vertical-align: 2px;
		min-height: var(--content-margin);
		font-size: 18px;
		margin-right: 2px;
		height: unset;
	}

	.team-empty {
		opacity: 0.75;
	}

	.friends-room-entry-text {
		padding-inline: var(--box-margin);
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.room-creation-friends-box {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		max-height: 135px;
		scrollbar-width: none;
		overflow: auto;
		gap: var(--box-margin);
		width: 100%;
		transition: max-height 250ms ease;
	}

	#small-join-counter {
		position: absolute;
		box-shadow: var(--bulb-shadow);
		top: var(--content-margin);
		right: var(--content-margin);
		padding: var(--content-margin);
		background-color: rgba(255, 255, 255, 0.1);
		height: 27px;
		width: 30px;
		border-radius: var(--box-margin);
		text-align: center;
		color: rgba(255, 255, 255, 0.5);
		font-size: 22px;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	#room-code-display {
		font-size: 40px;
		min-width: 75%;
		text-align: center;
	}

	.no-gap {
		gap: unset;
	}
</style>

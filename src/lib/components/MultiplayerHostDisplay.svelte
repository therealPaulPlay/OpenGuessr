<script>
	import { isAuthenticated } from "$lib/stores/accountStore";
	import {
		participantCount,
		loadedFriendsData,
		multiplayerTableArray,
		roomcode,
		socket,
		teamAmount,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { defaultMap } from "$lib/stores/context-specific/officialMapsStore";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { sendMatchInvite } from "$lib/logic/friendAPI";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { showNotification } from "$lib/utils/notifications";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip";
	import { Eye, Link, Users, ArrowRightLeft } from "@lucide/svelte";
	import { submitRoomCode } from "$lib/logic/matchmakingLogic.js";
	import { page } from "$app/state";
	import { get } from "svelte/store";
	import { signupPrompt } from "$lib/utils/signupPrompt";

	let {
		showOpenRoom = true,
		startDisabledCondition,
		startFunction = () => console.warn("No start function passed!"),
	} = $props();

	let roomOpened = $state(false);

	// Truncate name
	function truncatePlayerName(text, max = 10) {
		return text?.length > max ? text?.slice(0, max) + "…" : text;
	}

	function updatePlayerTeam(playerId, newTeamIndex) {
		get(socket)?.sendRequest("updateTeam", { newTeamIndex: parseInt(newTeamIndex), playerClientId: playerId });
	}
</script>

<!-- Room code-->
<div class="roomCreationModule multiplayerHostSettings noGap">
	<p class="codeDisplayText">Join with code</p>
	<h1 id="roomCodeDisplay">
		{$roomcode?.slice(0, 3) || "..."}<span style="opacity: 50%; font-size: 40px;">-</span>{$roomcode?.slice(3) || "..."}
	</h1>
</div>

<!-- Team and player display -->
<div class="roomCreationModule multiplayerHostSettings teamsDisplay">
	{#if $teamAmount === 1 || !$multiplayerTableArray?.length}
		<p class="playerBoxElement">
			<span>No team:</span>
			{#if $multiplayerTableArray?.length > 0}
				{#each $multiplayerTableArray as player, i}
					<span class="playerNameInline"
						>{truncatePlayerName(player.username)}{#if i < $multiplayerTableArray.length - 1}<span>,&nbsp;</span>{/if}
					</span>
				{/each}
			{:else}
				<span class="teamEmpty">No players</span>
			{/if}
		</p>
	{:else}
		{#each Object.values($multiplayerTableArray) as team}
			{@const teamIndex = team.teamIndex}
			<p class="playerBoxElement playerBoxTeams">
				<span>{`Team ${teamIndex + 1}:`}</span>
				{#if team.players?.length > 0}
					{#each team.players as player, i (player.clientId)}
						<span class="playerNameInline">
							{truncatePlayerName(player.username)}
							<select
								name="teams"
								class="teamSelector standardButton white"
								onchange={(e) => updatePlayerTeam(player.clientId, e.target.value)}
							>
								<!-- Generate select options for every team -->
								{#each Object.values($multiplayerTableArray) as teamObject}
									{@const index = teamObject.teamIndex}
									<option value={index} selected={player.teamIndex == index}>Team {index + 1}</option>
								{/each}
							</select>{#if i < team.players.length - 1}<span>,&nbsp;</span>{/if}
						</span>
					{/each}
				{:else}
					<span class="teamEmpty">No players</span>
				{/if}
			</p>
		{/each}
	{/if}
	<p id="smallJoinCounter">{$participantCount ?? "?"}</p>
</div>

<!-- Friend invite display -->
{#if $loadedFriendsData && $loadedFriendsData.filter((value) => value.online)?.length >= 1}
	<div id="friendsInviteDisplay" class="roomCreationModule multiplayerHostSettings">
		<div class="roomCreationFriendsBox">
			<!-- online players will be added here programmatically -->
			{#each $loadedFriendsData.filter((value) => value.online) as entry}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="standardButton roomCreationFriendItem"
					role="menu"
					tabindex="0"
					onclick={() => {
						loadProfileFromId(entry.id);
					}}
				>
					<p class="friendsRoomEntryText">{entry.user_name}</p>
					<button
						class="standardButton white sendInviteButton"
						use:tooltip={{ text: "Invite" }}
						onclick={(e) => {
							e.stopPropagation();
							playSound("basic_button");
							sendMatchInvite(entry.id);
						}}
					>
						<img src="/img/send_icon.png" alt="send invite" class="sendIcon" />
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Button area -->
<div class="multiplayerHostSubmitArea">
	<button
		id="roomcodeLink"
		class="largeButton standardButton white"
		use:tooltip={{ text: "Copy link" }}
		disabled={!$roomcode}
		onclick={() => {
			playSound("basic_button");
			const roomId = get(roomcode);

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
			class="standardButton white largeButton"
			use:tooltip={{ text: "Make room public" }}
			disabled={!$roomcode || roomOpened}
			onclick={async () => {
				playSound("basic_button");
				if (!$isAuthenticated) return signupPrompt();
				await submitRoomCode("open-room", false, localStorage.getItem("selectedMap") || $defaultMap);
				roomOpened = true;
				showNotification("Room set to public.");
			}}
		>
			<Eye strokeWidth={2.5} size={20} style="margin-bottom: -2px;" />
		</button>
	{/if}
	<button
		id="multiplayerHost"
		class="standardButton largeButton"
		disabled={startDisabledCondition}
		onclick={() => {
			playSound("basic_button");
			startFunction?.();
		}}>Start</button
	>
</div>

<style>
	.multiplayerHostSubmitArea {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--layout-margin);
	}

	.multiplayerHostSettings {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		border-radius: 15px;
		padding: var(--box-margin);
		padding-top: 10px;
		width: calc(100% - var(--box-margin) * 2);
	}

	.roomCreationModule {
		padding-top: 10px;
		padding-bottom: 10px;
		box-shadow: var(--box-shadow);
	}

	#friendsInviteDisplay {
		padding: var(--box-margin);
	}

	.codeDisplayText {
		opacity: 0.5;
		width: 100%;
		text-align: center;
	}

	.sendIcon {
		vertical-align: -2px;
		width: 20px;
		height: 20px;
	}

	.sendInviteButton {
		padding: 0;
		padding-inline: 5px;
		height: 35px !important;
	}

	.roomCreationFriendItem {
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

	.teamsDisplay {
		position: relative;
		min-height: 27px;
		font-size: 22px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.playerBoxElement {
		width: calc(100% - 85px);
		text-align: center;
	}

	.playerBoxElement span {
		color: rgba(255, 255, 255, 0.5) !important;
	}

	.playerBoxElement.playerBoxTeams {
		margin-bottom: 2px;
		line-height: 32px;
	}

	.playerNameInline {
		display: inline-block;
	}

	.teamSelector {
		padding: 0px 4px;
		vertical-align: 2px;
		min-height: 5px;
		font-size: 18px;
		margin-right: 2px;
		height: unset;
	}

	.teamEmpty {
		opacity: 0.75;
	}

	.friendsRoomEntryText {
		padding-inline: var(--box-margin);
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.roomCreationFriendsBox {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		max-height: 130px;
		overflow: auto;
		gap: var(--box-margin);
		width: 100%;
		transition: max-height 250ms ease;
	}

	#smallJoinCounter {
		position: absolute;
		box-shadow: var(--bulb-shadow);
		top: 5px;
		right: 5px;
		padding: 5px;
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

	#roomCodeDisplay {
		font-size: 40px;
		min-width: 75%;
		text-align: center;
	}

	.noGap {
		gap: unset;
	}
</style>

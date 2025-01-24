<script>
	import { Link } from "lucide-svelte";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { showNotification } from "$lib/utils/notifications";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { sendMatchInvite } from "$lib/logic/friendAPI";
	import { ArrowRightLeft } from "lucide-svelte";
	import { get } from "svelte/store";
	import {
		loadedFriendsData,
		hostStage,
		teamAmount,
		roundAmount,
		roundLength,
		peerId,
		restrictionButtonText,
		peer,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { toggleMultiplayerRestriction, setupMultiplayerRoom, startRoom } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import Ticker from "$lib/components/Ticker.svelte";
	import { goto } from "$app/navigation";
	let teamsDisplayText = $state("");

	get(peer)?.onEvent("storageUpdate", () => {
		buildTeamDisplayText();
	});

	function getFormattedCategory() {
		if (typeof window === "undefined") return;
		const category = localStorage.getItem("selectedCategory") || "standard";
		return category.replace("community_", "");
	}

	function buildTeamDisplayText() {
		const amountOfTeams = get(teamAmount); // Get the amount of teams from the store
		const players = get(peer)?.getStorage?.players; // Get the connected players from the store
		let teams = {}; // To store players by team
		let noTeamPlayers = []; // To store players with no team

		// Distribute players into teams based on their team index
		players.forEach((element) => {
			const teamIndex = element[4]; // Get the team index from player data
			if (amountOfTeams === 1) {
				noTeamPlayers.push(element[1]);
			} else {
				if (!teams[teamIndex]) teams[teamIndex] = [];
				teams[teamIndex].push(element[1]);
			}
		});

		teamsDisplayText = ""; // Reset

		// Construct the display text
		if (amountOfTeams === 1) {
			teamsDisplayText = "No team: " + noTeamPlayers.join(", ");
		} else {
			for (let i = 1; i <= amountOfTeams; i++) {
				if (teams[i] && teams[i].length > 0) {
					teamsDisplayText += `Team ${i}: ${teams[i].join(", ")}\n`;
				}
			}
			if (noTeamPlayers.length > 0) {
				teamsDisplayText += `No team: ${noTeamPlayers.join(", ")}`;
			}
		}

		// Remove any trailing newline or spaces
		teamsDisplayText = teamsDisplayText.trim();
	}
</script>

<svelte:head>
	<title>Host</title>
</svelte:head>

<div class="main-container">
	<div class="multiplayerCreationArea">
		{#if $hostStage == 1}
			<div class="roomCreationModule multiplayerHostSettings">
				<p>Rounds:</p>
				<Ticker limit={10} minimum={2} initialValue={3} bind:value={$roundAmount} />
			</div>
			<div class="roomCreationModule multiplayerHostSettings">
				<p>Round Length:</p>
				<Ticker limit={300} step={10} minimum={10} note="sec" initialValue={60} bind:value={$roundLength} />
			</div>
			<div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
				<p>Restriction:</p>
				<button
					id="toggleRestrictions"
					class="standardButton white"
					onclick={() => {
						playSound("basic_button");
						toggleMultiplayerRestriction();
					}}>{$restrictionButtonText}</button
				>
			</div>
			<div id="roomCreationTeams" class="roomCreationModule multiplayerHostSettings">
				<p>Teams:</p>
				<div class="ticker">
					<Ticker limit={5} lowerLimitText="no" note="teams" initialValue={1} bind:value={$teamAmount} />
				</div>
			</div>
			<div id="roomCreationMap" class="roomCreationModule multiplayerHostSettings">
				<p>Selected Map:</p>
				<div class="selectedMapField">
					<p id="multiplayerMapDisplay">
						{getFormattedCategory()}
					</p>
					<button
						class="standardButton white"
						onclick={() => {
							playSound("basic_button");
							goto("/maps");
						}}><ArrowRightLeft size={17} strokeWidth={2} /></button
					>
				</div>
			</div>
		{/if}
		{#if $hostStage == 2}
			<div class="roomCreationModule multiplayerHostSettings">
				<p class="codeDisplayText">Join with code:</p>
				<h1 id="roomCodeDisplay">{$peerId?.replace("openguessr_", "")}</h1>
			</div>
			<div class="roomCreationModule multiplayerHostSettings teamsDisplay">
				<p id="teamsDisplayText">{teamsDisplayText}</p>
				<p id="smallJoinCounter">{get(peer)?.connectionCount + 1}</p>
			</div>
			{#if $loadedFriendsData && $loadedFriendsData.filter((value) => value.online)?.length >= 1}
				<div id="friendsInviteDisplay" class="roomCreationModule multiplayerHostSettings">
					<div id="roomCreationFriendsBox" class="roomCreationFriendsBox">
						<!-- online players will be added here programmatically -->
						{#each $loadedFriendsData.filter((value) => value.online) as entry}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="standardButton roomCreationFriendItem"
								role="menu"
								tabindex="0"
								onclick={() => {
									loadProfileFromId(entry.id, true);
								}}
							>
								<p class="friendsRoomEntryText">{entry.user_name}</p>
								<button
									class="standardButton white sendInviteButton"
									onclick={(e) => {
										e.stopPropagation();
										playSound("basic_button");
										sendMatchInvite(entry.id, false);
									}}
								>
									<img src="/img/send_icon.png" alt="send invite" class="sendIcon" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
		<div class="multiplayerHostSubmitArea">
			<div id="innerSubmitAreaBlock">
				{#if $hostStage == 2}
					<button
						id="roomcodeLink"
						class="copyLinkButton standardButton white"
						onclick={() => {
							playSound("basic_button");
							const roomId = get(peerId)?.replace("openguessr_", "");

							// Use regular or Crazy Games link for invitation
							const link = $crazyGames
								? window.CrazyGames.SDK.game.inviteLink({ join: roomId })
								: window.location.origin + "/?join=" + roomId;

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
						<Link strokeWidth="2.5" size="18" />
					</button>
				{/if}
				<button
					id="multiplayerHost"
					class="standardButton"
					class:buttonDisabled={$hostStage == 2 &&
						(get(peer)?.connectionCount + 1 < get(teamAmount) || get(peer)?.connectionCount + 1 <= 1)}
					onclick={() => {
						playSound("basic_button");

						// Switch to stage 2 (host code area) if on stage 1 (after the create room function!!)
						if ($hostStage == 1) {
							setupMultiplayerRoom(get(roundAmount), get(roundLength));
							hostStage.set(2);
						} else {
							startRoom();
						}
					}}>{$hostStage == 1 ? "Create room" : "Start"}</button
				>
			</div>
		</div>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 50dvh;
	}

	.teamsDisplay {
		position: relative;
	}

	.multiplayerCreationArea {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 500px;
	}

	.codeDisplayText {
		opacity: 0.5;
		font-size: 20px;
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
	}

	.roomCreationFriendItem {
		background-color: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-inline: 5px;
		flex-grow: 1;
	}

	.friendsRoomEntryText {
		padding-inline: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.roomCreationModule {
		margin-top: 8px;
		padding-top: 10px;
		padding-bottom: 10px;
	}

	#roomCreationFriendsBox {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		max-height: 130px;
		overflow: auto;
		gap: 5px;
		width: 100%;
		transition: max-height 250ms ease;
	}

	.multiplayerHostSettings {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		gap: 5px;
		background-color: var(--box-color);
		border-radius: 15px;
		padding: 10px;
		padding-top: 10px;
		margin-top: 10px;
		width: calc(100% - 20px);
	}

	#toggleRestrictions {
		min-width: 170px;
	}

	#smallJoinCounter {
		position: absolute;
		top: 5px;
		right: 5px;
		padding: 5px;
		background-color: rgba(255, 255, 255, 0.1);
		height: 27px;
		width: 30px;
		border-radius: 10px;
		text-align: center;
		color: rgba(255, 255, 255, 0.75);
		font-size: 22px;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	#teamsDisplayText {
		padding-inline: 40px;
		opacity: 0.5;
		font-size: 22px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	#innerSubmitAreaBlock {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 10px;
		gap: 10px;
	}

	.copyLinkButton {
		min-height: 50px;
		border-radius: 10px;
	}

	#multiplayerHost {
		padding-inline: 20px;
		border-radius: 10px;
		min-height: 50px;
	}

	.multiplayerHostSubmitArea {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 10px;
		padding-bottom: 0;
	}

	#roomCodeDisplay {
		font-size: 40px;
		min-width: 75%;
		text-align: center;
	}

	.buttonDisabled {
		pointer-events: none !important;
		opacity: 0.5;
	}

	.selectedMapField {
		display: flex;
		gap: 10px;
		border-radius: 10px;
		justify-content: left;
		padding: 4px;
		width: fit-content;
		align-items: center;
		margin-bottom: 10px;
		margin-top: 10px;
		flex-wrap: wrap;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.selectedMapField p {
		margin-inline: 10px;
	}
</style>

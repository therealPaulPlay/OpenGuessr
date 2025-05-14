<script>
	import { Eye, EyeOff, Link, Users } from "lucide-svelte";
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
		socket,
		roomcode,
		connectionCount,
		multiplayerTableArray,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { setupMultiplayerRoom, startRoom } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import Ticker from "$lib/components/ui/Ticker.svelte";
	import { goto } from "$app/navigation";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { addPublicRoom, deletePublicRoom } from "$lib/utils/publicRooms";
	import { onDestroy, onMount } from "svelte";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { fade, scale, slide } from "svelte/transition";

	function getFormattedCategory() {
		if (typeof window === "undefined") return "loading...";
		const category = localStorage.getItem("selectedCategory") || "standard";
		return category.replace("community_", "");
	}

	let roomOpened = $state(false);
	let roomOpenAddInterval = $state();
	let publicTooltipShown = $state(false);
	let tooltipTimout;

	const unsubscribeFromHostStage = hostStage.subscribe((value) => {
		if (value == 2) {
			clearTimeout(tooltipTimout);
			tooltipTimout = setTimeout(() => {
				if (localStorage.getItem("publicRoomTooltip")) return;
				publicTooltipShown = true;
				localStorage.setItem("publicRoomTooltip", "shown");
			}, 3000);
		} else {
			clearTimeout(tooltipTimout);
		}
	});

	onDestroy(() => {
		unsubscribeFromHostStage();
		clearInterval(roomOpenAddInterval);
		clearTimeout(tooltipTimout);
		if (roomOpened) deletePublicRoom();
	});

	function updatePlayerTeam(playerId, newTeamIndex) {
		const playerIndex = get(socket)?.getStorage?.players?.findIndex((player) => player[0] === playerId);

		if (playerIndex !== -1) {
			const thisPlayer = get(socket)?.getStorage?.players[playerIndex];
			let newPlayer = [...thisPlayer];
			newPlayer[4] = parseInt(newTeamIndex); // Update team index at position 4

			get(socket)?.updateStorageArray("players", "update-matching", thisPlayer, newPlayer);
		}
	}

	// Restriction Toggle
	let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
	let restrictionsText = ["Standard", "NMPZ", "Grayscale", "Invert Colors", "Hue Shift", "Blink (Fade)"];
	let currentRestrictionIndex = 0;
	let restrictionButtonText = $state("Standard");

	function toggleMultiplayerRestriction() {
		currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
		restrictionButtonText = restrictionsText[currentRestrictionIndex];
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
					}}>{restrictionButtonText}</button
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
			<!-- Room code-->
			<div class="roomCreationModule multiplayerHostSettings">
				<p class="codeDisplayText">Join with code:</p>
				<h1 id="roomCodeDisplay">{$roomcode?.replace("openguessr_", "")}</h1>
			</div>

			<!-- Team and player display -->
			<div class="roomCreationModule multiplayerHostSettings teamsDisplay">
				{#if $teamAmount === 1}
					<p class="playerBoxElement">
						<span>No team:</span>
						{#if $multiplayerTableArray?.length > 0}
							{#each $multiplayerTableArray as player, i}
								<span class="playerNameInline"
									>{player[1]}{#if i < $multiplayerTableArray.length - 1}<span>,&nbsp;</span>{/if}
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
							<span>{teamIndex !== 0 ? `Team ${teamIndex}:` : `No team:`}</span>
							{#if team.players?.length > 0}
								{#each team.players as player, i (player[0])}
									<span class="playerNameInline">
										{player[1]}
										<select
											name="teams"
											class="teamSelector standardButton white"
											onchange={(e) => updatePlayerTeam(player[0], e.target.value)}
										>
											{#each Object.values($multiplayerTableArray) as teamObject}
												{@const index = teamObject.teamIndex}
												<option value={index} selected={player[4] == index}>{index}</option>
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
				<p id="smallJoinCounter">{$connectionCount + 1}</p>
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
		<!-- Bottom button area -->
		<div class="multiplayerHostSubmitArea">
			<div id="innerSubmitAreaBlock">
				{#if $hostStage == 2}
					<button
						id="roomcodeLink"
						class="copyLinkButton standardButton white"
						onclick={() => {
							playSound("basic_button");
							const roomId = get(roomcode)?.replace("openguessr_", "");

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
						<Link strokeWidth={2.75} size={18} />
					</button>
					<button
						class="standardButton white makeRoomPublicButton"
						onclick={async () => {
							playSound("basic_button");
							publicTooltipShown = false;
							if (!$isAuthenticated) return signupPrompt();
							if (!$roomcode || $roomcode.includes("loading")) return showNotification("Not initialized yet.");
							if (!roomOpened) {
								await addPublicRoom(
									$roomcode,
									$connectionCount + 1,
									localStorage.getItem("selectedCategory") || "standard",
								);
								clearInterval(roomOpenAddInterval);
								roomOpenAddInterval = setInterval(async () => {
									await addPublicRoom(
										$roomcode,
										$connectionCount + 1,
										localStorage.getItem("selectedCategory") || "standard",
									);
								}, 5000);
								roomOpened = true;
								showNotification("Room set to public.");
							} else {
								clearInterval(roomOpenAddInterval);
								await deletePublicRoom();
								roomOpened = false;
								showNotification("Room set to private.");
							}
						}}
					>
						{#if roomOpened}
							<EyeOff strokeWidth={2.5} size={20} style="margin-bottom: -2px;" />
						{:else}
							<Eye strokeWidth={2.5} size={20} style="margin-bottom: -2px;" />
						{/if}
					</button>
				{/if}
				<button
					id="multiplayerHost"
					class="standardButton"
					class:buttonDisabled={$hostStage == 2 &&
						($connectionCount + 1 < get(teamAmount) || $connectionCount + 1 <= 1)}
					onclick={() => {
						playSound("basic_button");

						// Switch to stage 2 (host code area) if on stage 1 (after the create room function!!)
						if ($hostStage == 1) {
							setupMultiplayerRoom(get(roundAmount), get(roundLength), null, restrictions[currentRestrictionIndex]);
							hostStage.set(2);
						} else {
							startRoom();
						}
					}}>{$hostStage == 1 ? "Create room" : "Start"}</button
				>
			</div>
		</div>
		<!-- Tooltip for public rooms -->
		{#if publicTooltipShown && $hostStage == 2}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div transition:slide>
				<div
					class="publicRoomTooltip"
					transition:scale={{ delay: 250 }}
					role="tooltip"
					onclick={() => {
						publicTooltipShown = false;
					}}
				>
					<div class="innerRoomTooltip">
						<p>Need more players?</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: calc(100dvh - 120px);
	}

	.teamsDisplay {
		position: relative;
		min-height: 27px;
		font-size: 22px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.teamsDisplay p {
		color: rgba(255, 255, 255, 0.5);
	}

	.multiplayerCreationArea {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 500px;
		gap: var(--layout-margin);
		margin-top: auto;
		margin-bottom: auto;
	}

	#friendsInviteDisplay {
		padding: var(--box-margin);
	}

	.codeDisplayText {
		opacity: 0.5;
		width: 100%;
		text-align: center;
	}

	.makeRoomPublicButton {
		border-radius: 10px;
		min-height: 50px;
		position: relative;
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
		padding: var(--panel-margin);
		flex-grow: 1;
	}

	.playerBoxElement {
		width: calc(100% - 85px);
		text-align: center;
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
	}

	.teamEmpty {
		opacity: 0.75;
	}

	.publicRoomTooltip {
		position: relative;
		display: block;
		cursor: pointer;
		margin-top: 10px;
	}

	/* The tooltip bubble */
	.publicRoomTooltip .innerRoomTooltip {
		position: absolute;
		left: -18px;
		transform: translateX(-50%);
		background-color: rgba(255, 255, 255, 0.15);
		padding: 8px 12px;
		border-radius: 10px;
		text-wrap: nowrap;
		z-index: 10;
	}

	/* Show the tooltip when hovering */
	.publicRoomTooltip:hover .innerRoomTooltip {
		opacity: 1;
		visibility: visible;
	}

	/* The upward-pointing arrow */
	.publicRoomTooltip .innerRoomTooltip::before {
		content: "";
		position: absolute;
		top: -10px; /* Position the arrow above the tooltip bubble */
		left: 50%;
		transform: translateX(-50%);
		border-width: 0 10px 10px 10px; /* No top border; bottom border creates the arrow */
		border-style: solid;
		border-color: transparent transparent rgba(255, 255, 255, 0.15) transparent;
	}

	.friendsRoomEntryText {
		padding-inline: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.roomCreationModule {
		padding-top: 10px;
		padding-bottom: 10px;
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
		color: rgba(255, 255, 255, 0.5);
		font-size: 22px;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	#innerSubmitAreaBlock {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--layout-margin);
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
		gap: var(--box-margin);
		border-radius: 10px;
		justify-content: left;
		padding: var(--panel-margin);
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

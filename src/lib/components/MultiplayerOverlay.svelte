<!-- Multiplayer Overlay which shows a table with Results, shows the players in the room etc. -->
<script>
	import {
		multiplayerOverlay,
		multiplayerOverlayTitle,
		rematchButtonVisible,
		leaveMatchButtonVisible,
		overlayTitleElement,
		multiplayerTableArray,
		teamAmount,
		peer,
		overlayShowSubtitle,
	} from "$lib/stores/context-specific/multiplayerStore";
	import Badge from "$lib/components/Badge.svelte";
	import { leaveMultiplayerRound } from "$lib/logic/multiplayerLogic";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";
	import { slide } from "svelte/transition";
</script>

<div
	id="multiplayerFade"
	style:opacity={$multiplayerOverlay ? "1" : "0"}
	style:pointer-events={$multiplayerOverlay ? "auto" : "none"}
>
	<h1 class="multiplayerTitle" bind:this={$overlayTitleElement}>{$multiplayerOverlayTitle}</h1>
	{#if $overlayShowSubtitle}
		<h2 class="multiplayerTitle">1.5x Multiplier</h2>
	{/if}
	<div id="multiplayerTable">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		{#if $multiplayerTableArray.length > 0}
			{#if $teamAmount > 1}
				<!-- Teams version -->
				{#each $multiplayerTableArray as team}
					{#each team.players as [entryPeerId, username, elo, score, teamIndex, id, badge]}
						<div
							transition:slide
							class="multiplayerOverlayEntry"
							class:yourMultiplayerOverlay={entryPeerId && entryPeerId == get(peer)?.id}
							style:background-image={"linear-gradient(90deg, transparent 60%, " + team.color + ")"}
						>
							<div class="multiplayerEntryPlayerInfo">
								<div
									class="multiplayerEntryPlayerName"
									class:entryNotClickable={!id}
									role="cell"
									tabindex="0"
									onclick={() => {
										if (id) {
											loadProfileFromId(id, true);
										}
									}}
								>
									{username} ({elo || "Error"} Elo)
									<div class="multiplayerBadge">
										{#if badge}
											<Badge interactive={false} display={true} id={badge} />
										{/if}
									</div>
								</div>
								<div class="multiplayerEntryPlayerScore">Score: {score?.toLocaleString()}</div>
							</div>
						</div>
					{/each}
				{/each}
			{:else}
				<!-- No teams version -->
				{#each $multiplayerTableArray as [entryPeerId, username, elo, score, teamIndex, id, badge]}
					<div
						transition:slide
						class="multiplayerOverlayEntry"
						class:yourMultiplayerOverlay={entryPeerId && entryPeerId == get(peer)?.id}
					>
						<div class="multiplayerEntryPlayerInfo">
							<div
								class="multiplayerEntryPlayerName"
								class:entryNotClickable={!id}
								role="cell"
								tabindex="0"
								onclick={() => {
									if (id) {
										loadProfileFromId(id, true);
									}
								}}
							>
								{username} ({elo || 0} Elo)
								<div class="multiplayerBadge">
									{#if badge}
										<Badge interactive={false} display={true} id={badge} />
									{/if}
								</div>
							</div>
							<div class="multiplayerEntryPlayerScore">Score: {score?.toLocaleString()}</div>
						</div>
					</div>
				{/each}
			{/if}
		{/if}
	</div>
	<div class="buttonSpacer"></div>
	{#if $rematchButtonVisible}
		<button
			id="endMultiplayerRematchButton"
			class="standardButton"
			onclick={() => {
				playSound("basic_button");
				get(peer)?.updateStorage("rematch", true);
			}}>Play again</button
		>
	{/if}
	{#if $leaveMatchButtonVisible}
		<button
			id="endMultiplayerRoundButton"
			class="standardButton"
			onclick={() => {
				playSound("basic_button");
				leaveMultiplayerRound();
			}}>Exit</button
		>
	{/if}
</div>

<style>
	#multiplayerFade {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		z-index: 4;
		transition: opacity 250ms ease;
		overflow: hidden;
		backdrop-filter: blur(50px);
		-webkit-backdrop-filter: blur(50px);
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		pointer-events: none;
		user-select: none;
	}

	.buttonSpacer {
		width: 100%;
		height: 20px;
	}

	.multiplayerBadge {
		width: fit-content;
	}

	:global(.multiplayerBadge p) {
		font-size: 20px !important;
	}

	#endMultiplayerRoundButton {
		min-width: 150px;
		height: 50px;
		font-size: 25px;
		margin-top: 10px;
	}

	#endMultiplayerRematchButton {
		min-width: 150px;
		height: 50px;
		font-size: 25px;
		color: white;
		background-color: rgba(255, 255, 255, 0.2);
	}

	.multiplayerTitle {
		overflow: hidden;
		white-space: nowrap;
		transition:
			opacity 250ms ease,
			transform 250ms ease,
			color 250ms ease;
		color: white;
	}

	#multiplayerFade h1 {
		font-size: 50px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
	}

	#multiplayerFade h2 {
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
		margin-top: -20px;
		opacity: 0.75;
	}

	:global(#multiplayerFade p),
	:global(#multiplayerTable p) {
		font-size: 30px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
	}

	#multiplayerTable {
		display: flex;
		justify-content: safe center;
		align-items: safe flex-start;
		width: 50%;
		min-width: 350px;
		max-width: 750px;
		font-size: 25px;
		max-height: 350px;
		overflow-x: hidden;
		overflow-y: auto;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.multiplayerOverlayEntry {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 5px;
		width: 100%;
	}

	.yourMultiplayerOverlay {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.multiplayerEntryPlayerInfo {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--box-margin);
		padding-inline: 20px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-height: 50px;
	}

	.multiplayerEntryPlayerName {
		flex: 1;
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		overflow: hidden;
	}

	.multiplayerEntryPlayerName:hover {
		opacity: 0.5 !important;
	}

	.entryNotClickable {
		pointer-events: none;
	}

	.multiplayerEntryPlayerScore {
		margin-left: 10px;
	}
</style>

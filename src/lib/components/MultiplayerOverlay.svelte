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
		socket,
		overlayShowSubtitle,
	} from "$lib/stores/context-specific/multiplayerStore";
	import Badge from "$lib/components/Badge.svelte";
	import Flag from "$lib/components/Flag.svelte";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";
	import { fade, slide } from "svelte/transition";
	import { showErrorPopup, showConfirmPopup } from "openguessr-ui";
	import { Info } from "@lucide/svelte";
	import { multiplayer } from "$lib/stores/modeStore";
</script>

{#if $multiplayerOverlay}
	<div class="multiplayer-overlay" out:fade={{ duration: 150 }}>
		<h1 class="multiplayer-title" bind:this={$overlayTitleElement}>{$multiplayerOverlayTitle}</h1>
		{#if $overlayShowSubtitle}
			<h2 class="multiplayer-title">1.5x Multiplier</h2>
		{/if}
		<div class="multiplayer-table of-top of-bottom of-length-1.5">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			{#if $multiplayerTableArray.length > 0}
				{#if $teamAmount > 1}
					<!-- Teams version -->
					{#each $multiplayerTableArray as team}
						{#if team.players?.length}
							<div
								class="team-box"
								style:background-image={"linear-gradient(90deg, transparent 60%, " + team.color + ")"}
								class:your-team={team.players.find((p) => p.clientId === get(socket)?.id)}
								transition:slide
							>
								<div class="team-header">
									<p>Team {team.colorName}</p>
									<p class="team-score-box">
										<span
											role="button"
											tabindex="0"
											class="standard-button dark team-score-info"
											onclick={() => {
												playSound("basic_button");
												showConfirmPopup(
													"Team points",
													"Each round, only your team's closest guess counts. Those points add up to the team's score.",
												);
											}}><Info size={20} /></span
										>{(team.score ?? 0).toLocaleString()} Pts.
									</p>
								</div>
								{#each team.players as { username, elo, score, userId, badge, flag, spectator }}
									<div
										transition:slide
										class="multiplayer-overlay-entry"
										style:box-shadow="var(--box-shadow)"
										class:half-transparent={spectator}
									>
										<div class="multiplayer-entry-player-info">
											<div
												class="multiplayer-entry-player-name of-left of-right"
												class:entry-not-clickable={!userId}
												role="cell"
												tabindex="0"
												onclick={() => {
													if (userId) showProfile(userId);
												}}
											>
												<span class="username-span"
													>{username}{#if flag}<Flag code={flag} />{/if}</span
												>
												{#if badge}
													<Badge interactive={false} display={true} id={badge} />
												{/if}
												{#if userId}
													{@render eloDisplay(elo)}
												{/if}
												{#if spectator}
													{@render spectatorDisplay()}
												{/if}
											</div>
											<p class="multiplayer-entry-player-score" style:opacity="0.5">{score?.toLocaleString()} Pts.</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				{:else}
					<!-- No teams version -->
					{#each $multiplayerTableArray as { clientId, username, elo, score, userId, badge, flag, spectator }}
						<div
							transition:slide
							class="multiplayer-overlay-entry"
							style:box-shadow="var(--panel-shadow)"
							class:half-transparent={spectator}
							class:your-entry={clientId && clientId == get(socket)?.id}
						>
							<div class="multiplayer-entry-player-info">
								<div
									class="multiplayer-entry-player-name of-left of-right"
									class:entry-not-clickable={!userId}
									role="cell"
									tabindex="0"
									onclick={() => {
										if (userId) showProfile(userId);
									}}
								>
									<span class="username-span"
										>{username}{#if flag}<Flag code={flag} />{/if}</span
									>
									{#if badge}
										<Badge interactive={false} display={true} id={badge} />
									{/if}
									{#if userId}
										{@render eloDisplay(elo)}
									{/if}
									{#if spectator}
										{@render spectatorDisplay()}
									{/if}
								</div>
								<p class="multiplayer-entry-player-score">{score?.toLocaleString()} Pts.</p>
							</div>
						</div>
					{/each}
				{/if}
			{/if}
		</div>
		{#if $rematchButtonVisible || $leaveMatchButtonVisible}
			<div class="button-box" transition:slide={{ axis: "y" }}>
				{#if $rematchButtonVisible}
					{let currentlyStartingRematch = $state(false)}
					<div class="host-button-container bar-menu">
						<button
							disabled={currentlyStartingRematch}
							style:min-width="130px"
							class="standard-button bright large"
							onclick={async () => {
								playSound("basic_button");
								currentlyStartingRematch = true;
								try {
									await get(socket)?.sendRequest("rematch");
								} catch (error) {
									if (get(multiplayer)) {
										showErrorPopup("Failed to rematch", "An error occurred trying to rematch.", error.message);
									}
									console.error("Error processing rematch:", error);
								}
								currentlyStartingRematch = false;
							}}>Play again</button
						>
					</div>
				{/if}
				{#if $leaveMatchButtonVisible}
					<div class="host-button-container bar-menu">
						<button
							style:min-width="130px"
							class="standard-button large"
							onclick={() => {
								playSound("basic_button");
								leaveMultiplayer();
							}}>Leave</button
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#snippet eloDisplay(elo = "Default")}
	<div class="elo-display">
		<p>{elo?.toLocaleString()} Elo</p>
	</div>
{/snippet}

{#snippet spectatorDisplay()}
	<div class="elo-display">
		<p>Spectator</p>
	</div>
{/snippet}

<style>
	.multiplayer-overlay {
		position: fixed;
		inset: 0 0 0 0;
		z-index: 4;
		overflow: hidden;
		backdrop-filter: blur(var(--strong-blur));
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		user-select: none;
	}

	.team-box {
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		gap: var(--box-margin);
		display: flex;
		flex-direction: column;
		width: 100%;
		box-shadow: var(--panel-shadow);
	}

	.team-score-info {
		height: 30px;
		display: inline-block;
		padding: 0;
		padding-inline: 3px;
		margin-right: var(--box-margin);
		background-color: var(--box-color);
	}

	.team-header {
		display: flex;
		justify-content: space-between;
		gap: var(--box-margin);
		padding-inline: var(--content-margin);
	}

	.team-score-box {
		display: inline-flex;
		align-items: stretch;
	}

	.host-button-container {
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		backdrop-filter: none !important;
	}

	.username-span {
		margin-right: 3px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.elo-display {
		padding: var(--panel-margin);
		box-shadow: var(--bulb-shadow);
		border-radius: var(--content-margin);
		position: relative;
		color: white;
		text-wrap: nowrap;
		padding-inline: 12px;
		user-select: none;
		background-color: rgba(255, 255, 255, 0.15);
	}

	.elo-display p {
		font-size: 20px !important;
	}

	.half-transparent {
		opacity: 0.5;
	}

	.button-box {
		gap: var(--layout-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		margin-inline: var(--layout-margin);
		flex-wrap: wrap;
	}

	.multiplayer-title {
		overflow: hidden;
		white-space: nowrap;
		transition:
			opacity 250ms ease,
			transform 250ms ease,
			color 250ms ease;
		color: white;
		width: 750px;
		max-width: 100%;
		padding-inline: calc(var(--layout-margin) + var(--box-margin));
		text-overflow: ellipsis;
		text-align: center;
	}

	.multiplayer-overlay h1 {
		text-shadow: 2px 2px 15px var(--dark-shadow-color);
	}

	.multiplayer-overlay h2 {
		text-shadow: 2px 2px 15px var(--dark-shadow-color);
		opacity: 0.75;
	}

	.multiplayer-table {
		display: flex;
		justify-content: safe center;
		align-items: safe flex-start;
		width: 100%;
		max-width: 800px;
		max-height: calc(55dvh - 100px);
		overflow-x: hidden;
		scrollbar-width: none;
		overflow-y: auto;
		flex-direction: column;
		gap: var(--layout-margin);
		padding: calc(var(--layout-margin) + var(--box-margin));
	}

	.multiplayer-overlay-entry {
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		width: 100%;
	}

	.your-entry {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.your-team {
		background-color: rgba(255, 255, 255, 0.25);
	}

	.multiplayer-entry-player-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--box-margin);
		padding-inline: var(--layout-margin);
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		height: 54px;
	}

	.multiplayer-entry-player-name {
		flex: 1;
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
		padding: var(--panel-margin);
		padding-left: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.multiplayer-entry-player-name:hover {
		opacity: 0.5 !important;
	}

	.entry-not-clickable {
		pointer-events: none;
	}

	.multiplayer-entry-player-score {
		margin-left: var(--box-margin);
	}
</style>

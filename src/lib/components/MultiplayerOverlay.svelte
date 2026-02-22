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
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";
	import { blur, slide } from "svelte/transition";
</script>

<div
	class="multiplayerFade"
	style:opacity={$multiplayerOverlay ? "1" : "0"}
	style:pointer-events={$multiplayerOverlay ? "auto" : "none"}
>
	<h1 class="multiplayerTitle" bind:this={$overlayTitleElement}>{$multiplayerOverlayTitle}</h1>
	{#if $overlayShowSubtitle}
		<h2 class="multiplayerTitle">1.5x Multiplier</h2>
	{/if}
	<div class="multiplayerTable of-top of-bottom of-length-1.5">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		{#if $multiplayerTableArray.length > 0}
			{#if $teamAmount > 1}
				<!-- Teams version -->
				{#each $multiplayerTableArray as team}
					{#each team.players as { clientId, username, elo, score, teamIndex, userId, badge, spectator }}
						<div
							transition:slide
							class="multiplayerOverlayEntry"
							class:halfTransparent={spectator}
							class:yourMultiplayerOverlay={clientId && clientId == get(socket)?.id}
							style:background-image={"linear-gradient(90deg, transparent 60%, " + team.color + ")"}
						>
							<div class="multiplayerEntryPlayerInfo">
								<div
									class="multiplayerEntryPlayerName"
									class:entryNotClickable={!userId}
									role="cell"
									tabindex="0"
									onclick={() => {
										if (userId) loadProfileFromId(userId);
									}}
								>
									<span class="usernameSpan">{username}</span>
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
								<p class="multiplayerEntryPlayerScore">{score?.toLocaleString()} Pts.</p>
							</div>
						</div>
					{/each}
				{/each}
			{:else}
				<!-- No teams version -->
				{#each $multiplayerTableArray as { clientId, username, elo, score, teamIndex, userId, badge, spectator }}
					<div
						transition:slide
						class="multiplayerOverlayEntry"
						class:halfTransparent={spectator}
						class:yourMultiplayerOverlay={clientId && clientId == get(socket)?.id}
					>
						<div class="multiplayerEntryPlayerInfo">
							<div
								class="multiplayerEntryPlayerName"
								class:entryNotClickable={!userId}
								role="cell"
								tabindex="0"
								onclick={() => {
									if (userId) loadProfileFromId(userId);
								}}
							>
								<span class="usernameSpan">{username}</span>
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
							<p class="multiplayerEntryPlayerScore">{score?.toLocaleString()} Pts.</p>
						</div>
					</div>
				{/each}
			{/if}
		{/if}
	</div>
	{#if $rematchButtonVisible || $leaveMatchButtonVisible}
		<div class="buttonBox" in:blur={{ delay: 500 }}>
			{#if $rematchButtonVisible}
				<div class="hostButtonContainer barMenu">
					<button
						class="standardButton white largeButton roundEndButton"
						onclick={() => {
							playSound("basic_button");
							get(socket)?.sendRequest("rematch");
						}}>Play again</button
					>
				</div>
			{/if}
			{#if $leaveMatchButtonVisible}
				<div class="hostButtonContainer barMenu">
					<button
						class="standardButton largeButton roundEndButton"
						onclick={() => {
							playSound("basic_button");
							leaveMultiplayer();
						}}>Exit</button
					>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#snippet eloDisplay(elo = "Default")}
	<div class="eloDisplay">
		<p>{elo?.toLocaleString()} Elo</p>
	</div>
{/snippet}

{#snippet spectatorDisplay()}
	<div class="eloDisplay">
		<p>Spectator</p>
	</div>
{/snippet}

<style>
	.multiplayerFade {
		position: fixed;
		inset: 0 0 0 0;
		z-index: 4;
		transition: opacity 250ms ease;
		overflow: hidden;
		backdrop-filter: blur(50px);
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		pointer-events: none;
		user-select: none;
	}

	.hostButtonContainer {
		box-shadow: var(--box-shadow);
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: var(--layout-margin);
	}

	.usernameSpan {
		margin-right: 3px;
		font-size: 25px;
	}

	.eloDisplay {
		padding: var(--panel-margin);
		box-shadow: var(--bulb-shadow);
		border-radius: var(--content-margin);
		position: relative;
		color: white;
		text-wrap: nowrap;
		padding-inline: 12px;
		box-sizing: border-box;
		user-select: none;
		background-color: rgba(255, 255, 255, 0.15);
	}

	.eloDisplay p {
		font-size: 20px !important;
	}

	.halfTransparent {
		opacity: 0.5;
	}

	.buttonBox {
		margin-top: calc(var(--layout-margin) + var(--box-margin));
		gap: var(--layout-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		margin-inline: var(--layout-margin);
		flex-wrap: wrap;
	}

	.roundEndButton {
		min-width: 130px;
	}

	.multiplayerTitle {
		overflow: hidden;
		white-space: nowrap;
		transition:
			opacity 250ms ease,
			transform 250ms ease,
			color 250ms ease;
		color: white;
		max-width: 750px;
		width: 75%;
		text-overflow: ellipsis;
		text-align: center;
	}

	.multiplayerFade h1 {
		font-size: 50px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
	}

	.multiplayerFade h2 {
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
		margin-top: -20px;
		opacity: 0.75;
	}

	.multiplayerTable {
		display: flex;
		justify-content: safe center;
		align-items: safe flex-start;
		width: 75%;
		min-width: 350px;
		max-width: 750px;
		max-height: calc(55dvh - 150px);
		overflow-x: hidden;
		scrollbar-width: none;
		overflow-y: auto;
		flex-direction: column;
		gap: var(--layout-margin);
	}

	.multiplayerOverlayEntry {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: var(--box-margin);
		width: 100%;
		box-shadow: var(--box-shadow);
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
		height: 54px;
	}

	.multiplayerEntryPlayerName {
		flex: 1;
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: var(--panel-margin);
		padding: var(--panel-margin);
		padding-left: 0;
		mask-image: linear-gradient(to right, black 95%, transparent 100%);
		overflow: hidden;
	}

	.multiplayerEntryPlayerName:hover {
		opacity: 0.5 !important;
	}

	.entryNotClickable {
		pointer-events: none;
	}

	.multiplayerEntryPlayerScore {
		margin-left: var(--box-margin);
		font-size: 25px;
	}

	/* Shift up table on mobile where the indicator bar spans across the device width */
	@media (orientation: portrait) and (max-width: 800px) {
		.multiplayerFade {
			padding-bottom: 150px;
		}
	}
</style>

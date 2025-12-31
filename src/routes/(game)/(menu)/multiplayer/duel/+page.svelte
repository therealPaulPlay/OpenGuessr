<script>
	import {
		multiplayerStatus,
		matchmakingActive,
		skillBasedMatchmaking,
		matchmakingHosting,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { findDuel, leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import { Info, RefreshCcw } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";
	import { deleteRoomCodeFromMatchmakingServer } from "$lib/logic/matchmakingAPI";
</script>

<svelte:head>
	<title>Duel</title>
</svelte:head>

<div class="main-container">
	<div class="duelCenterBox">
		<p class="multiplayerDuelStatus" class:loading={$multiplayerStatus && $matchmakingHosting}>
			{$multiplayerStatus || "No match found."}
		</p>
		{#if $skillBasedMatchmaking}
			<div class="infoContainer" transition:slide>
				<Info strokeWidth={2.25} size={34} color="white" style="opacity: 50%; margin-right: 5px; margin-left: 2px;" />
				<p>Skill-based matchmaking has longer waiting times.</p>
			</div>
		{/if}
		<button
			class="standardButton tryButton largeButton"
			disabled={$matchmakingActive && !$matchmakingHosting}
			onclick={() => {
				if (!$matchmakingActive) {
					playSound("basic_button");
					findDuel();
				} else {
					deleteRoomCodeFromMatchmakingServer();
					leaveMultiplayer();
				}
			}}
			>{$matchmakingActive ? "Cancel" : "Try again"}
			{#if !$matchmakingActive}
				<span class="refreshIcon"><RefreshCcw strokeWidth={3} size={18} /></span>
			{/if}</button
		>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 50dvh;
	}

	.infoContainer {
		display: flex;
		padding: var(--box-margin);
		border-radius: 15px;
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		gap: 5px;
		margin-bottom: var(--layout-margin);
		max-width: 300px;
	}

	.infoContainer p {
		opacity: 0.5;
		flex-grow: 100;
	}

	.multiplayerDuelStatus.loading {
		animation: loadingText 1s infinite;
	}

	.refreshIcon {
		margin-left: 5px;
		vertical-align: -1px;
	}

	.tryButton {
		padding-inline: 20px;
	}

	.duelCenterBox {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
	}

	.multiplayerDuelStatus {
		text-align: center;
		width: 100%;
		text-wrap: wrap;
		font-size: 30px;
		color: white;
		margin-bottom: var(--layout-margin);
		max-width: 400px;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 250ms ease;
	}

	@keyframes loadingText {
		0% {
			color: white;
		}

		50% {
			color: rgb(140, 140, 140);
		}

		100% {
			color: white;
		}
	}
</style>

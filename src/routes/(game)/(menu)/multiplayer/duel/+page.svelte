<script>
	import {
		multiplayerStatus,
		matchmakingActive,
		skillBasedMatchmaking,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { findDuel } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import { RefreshCcw } from "lucide-svelte";
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";
</script>

<svelte:head>
	<title>Duel</title>
</svelte:head>

<div class="main-container">
	<div class="duelCenterBox">
		<p
			id="multiplayerDuelInfo"
			class="multiplayerDuelStatus"
			class:loading={$multiplayerStatus && $multiplayerStatus?.toLowerCase()?.includes("wait")}
		>
			{$multiplayerStatus || "No match found."}
		</p>
		{#if $skillBasedMatchmaking && !$matchmakingActive}
			<div class="infoContainer" transition:slide>
				<img alt="info icon" class="infoIcon" src="/img/info_icon.png" />
				<p>Skill-based matchmaking has longer waiting times.</p>
			</div>
		{/if}
		<button
			class="standardButton tryButton"
			class:buttonDisabled={$matchmakingActive}
			onclick={() => {
				playSound("basic_button");
				findDuel();
			}}
			>Try again <span class="refreshIcon"
				><RefreshCcw strokeWidth={3} size={18} class={$matchmakingActive ? "rotateDuelRefreshIcon" : ""} /></span
			></button
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

	.infoIcon {
		margin-inline: 1px;
		margin-right: 5px;
	}

	.infoContainer {
		display: flex;
		padding: var(--box-margin);
		border-radius: 15px;
		align-items: center;
		background-color: var(--box-color);
		gap: 5px;
		margin-bottom: var(--layout-margin);
		max-width: 300px;
	}

	.infoContainer p {
		opacity: 0.5;
		flex-grow: 100;
	}

	.buttonDisabled {
		pointer-events: none !important;
		opacity: 0.5;
	}

	:global(.rotateDuelRefreshIcon) {
		animation: rotateFindCircle 2s infinite;
	}

	.multiplayerDuelStatus.loading {
		animation: loadingText 1s infinite;
	}

	.refreshIcon {
		margin-left: 5px;
		vertical-align: -1px;
	}

	.tryButton {
		min-height: 50px;
		padding-inline: 20px;
		border-radius: 10px;
	}

	.duelCenterBox {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 500px;
	}

	.multiplayerDuelStatus {
		text-align: center;
		width: 100%;
		text-wrap: wrap;
		font-size: 30px;
		color: white;
		min-height: 60px;
		margin-top: 10px;
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

	@keyframes rotateFindCircle {
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
	}
</style>

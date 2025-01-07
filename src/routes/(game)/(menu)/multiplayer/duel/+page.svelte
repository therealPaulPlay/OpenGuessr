<script>
	import { multiplayerStatus, matchmakingActive } from "$lib/stores/context-specific/multiplayerStore";
	import { findDuel } from "$lib/logic/multiplayerLogic";
	import { playSound } from "$lib/utils/soundManager";
	import { RefreshCcw } from "lucide-svelte";
	import { onMount } from "svelte";
	import { fetchBlacklistStatus } from "$lib/utils/checkBanStatus";

	onMount(() => {
		// Check blacklist if logged in and not already (async)
		fetchBlacklistStatus();
	});
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
		<button
			class="standardButton tryButton"
			class:buttonDisabled={$matchmakingActive}
			onclick={() => {
				playSound("basic_button");
				findDuel();
			}}>Search <span class="refreshIcon"><RefreshCcw strokeWidth={3} size={18} /></span></button
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

	.buttonDisabled {
		pointer-events: none !important;
		opacity: 0.5;
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
</style>

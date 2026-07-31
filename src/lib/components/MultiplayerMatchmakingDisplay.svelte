<script>
	import {
		multiplayerStatus,
		matchmakingActive,
		matchmakingHosting,
		cancellingMatchmaking,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { RefreshCcw } from "@lucide/svelte";

	let {
		findFunction = () => console.warn("No find function set!"),
		cancelFunction = () => console.warn("No cancel function set!"),
	} = $props();
</script>

<h2 class="multiplayer-matchmaking-status" class:loading={$multiplayerStatus && $matchmakingHosting}>
	{$multiplayerStatus || "No match found."}
</h2>
<div class="try-button-container bar-menu">
	<button
		class="standard-button try-button large-button"
		disabled={($matchmakingActive && !$matchmakingHosting) || $cancellingMatchmaking}
		onclick={async () => {
			if (!$matchmakingActive) {
				playSound("basic_button");
				findFunction?.();
			} else {
				$cancellingMatchmaking = true;
				try {
					await cancelFunction?.();
				} finally {
					$cancellingMatchmaking = false;
				}
			}
		}}
		>{$matchmakingActive ? ($cancellingMatchmaking ? "Cancelling..." : "Cancel") : "Try again"}
		{#if !$matchmakingActive}
			<span class="refresh-icon"><RefreshCcw strokeWidth={3} size={18} /></span>
		{/if}</button
	>
</div>

<style>
	.multiplayer-matchmaking-status.loading {
		animation: loading-text 1s infinite;
	}

	.refresh-icon {
		margin-left: var(--content-margin);
		vertical-align: -1px;
	}

	.try-button-container {
		box-shadow: var(--panel-shadow);
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
	}

	.try-button {
		padding-inline: 20px;
	}

	.multiplayer-matchmaking-status {
		text-align: center;
		width: 100%;
		text-wrap: wrap;
		color: white;
		margin-bottom: var(--box-margin);
		max-width: 400px;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 250ms ease;
	}

	@keyframes loading-text {
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

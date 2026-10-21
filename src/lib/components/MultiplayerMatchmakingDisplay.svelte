<script>
	import {
		multiplayerStatus,
		matchmakingActive,
		matchmakingHosting,
		matchmakingSubmitted,
		cancellingMatchmaking,
		matchmakingEloRange,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import { RefreshCcw } from "@lucide/svelte";
	import MatchmakingRange from "./MatchmakingRange.svelte";
	import { setMatchmakingRange } from "$lib/logic/matchmakingLogic";
	import { elo } from "$lib/stores/accountStore";

	let {
		findFunction = () => console.warn("No find function set!"),
		cancelFunction = () => console.warn("No cancel function set!"),
		showEloRange = false,
	} = $props();

	let rangeLeft = $state(0);
	let rangeRight = $state(0);
	let expandFrame;

	// Animate the server's range expansion
	$effect(() => {
		if (!$matchmakingEloRange) return;
		const { initialOffset, finalOffset, expandDuration, receivedAt } = $matchmakingEloRange;

		const expand = () => {
			const timeFactor = Math.min(1, (Date.now() - receivedAt) / expandDuration); // 0 at start, 1 when fully expanded
			const offset = initialOffset + (finalOffset - initialOffset) * timeFactor; // Current offset (expands over time)

			// Apply new range bounds
			rangeLeft = $elo - offset;
			rangeRight = $elo + offset;

			// Repeat until the expansion has finished (time factor 1 means 100% of the range is now shown)
			if (timeFactor < 1) expandFrame = requestAnimationFrame(expand);
		};
		expand();

		return () => cancelAnimationFrame(expandFrame);
	});
</script>

<h2 class="multiplayer-matchmaking-status" class:loading={$multiplayerStatus && $matchmakingHosting}>
	{$multiplayerStatus || "No match found."}
</h2>
{const rangeShown = $derived(showEloRange && $matchmakingSubmitted)}
<div
	style:margin-bottom={!(showEloRange && $matchmakingSubmitted) ? "calc(-1 * var(--layout-margin))" : ""}
	style:height={rangeShown ? "108px" : "0"}
	class="matchmaking-range-container"
>
	{#if rangeShown}
		<MatchmakingRange
			bind:rangeLeft
			bind:rangeRight
			startValue={$elo}
			ondragstart={() => cancelAnimationFrame(expandFrame)}
			onchange={() => setMatchmakingRange(rangeLeft, rangeRight)}
		/>
	{/if}
</div>
<div class="try-button-container bar-menu">
	<button
		class="standard-button try-button large"
		disabled={($matchmakingActive && !$matchmakingSubmitted) || $cancellingMatchmaking}
		onclick={async () => {
			playSound("basic_button");
			if (!$matchmakingActive) findFunction?.();
			else {
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

	.matchmaking-range-container {
		width: 100%;
		position: relative;
		transition:
			margin 400ms ease,
			height 400ms ease;
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

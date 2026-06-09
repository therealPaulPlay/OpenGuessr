<!-- Appears in duels when the oponnent has guessed and informs the player that the time has been reduced -->
<script>
	import { timeReducedOverlay } from "$lib/stores/context-specific/multiplayerStore";
	import { tick } from "svelte";
	import { blur } from "svelte/transition";

	let playTransition = $state(false);

	$effect(() => {
		if ($timeReducedOverlay) {
			(async () => {
				await tick();
				playTransition = true;
			})();
		} else playTransition = false;
	});
</script>

{#if $timeReducedOverlay}
	<div transition:blur={{ duration: 500 }} class="duels-time-reduced" style:scale={playTransition ? "1.03" : "1"}>
		<h1>A player has guessed</h1>
		<p id="duels-overlay-subtitle">Time reduced to max. 15s</p>
	</div>
{/if}

<style>
	.duels-time-reduced {
		position: fixed;
		inset: 0 0 0 0;
		z-index: 1;
		transition: scale 2000ms ease;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		pointer-events: none;
		user-select: none;
	}

	.duels-time-reduced h1 {
		font-size: 75px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
		opacity: 0.75;
		text-align: center;
		margin-bottom: var(--box-margin);
	}

	.duels-time-reduced p {
		font-size: 35px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
		opacity: 0.75;
		text-align: center;
	}

	@media all and (max-width: 1200px) {
		.duels-time-reduced h1 {
			font-size: 45px;
		}

		.duels-time-reduced p {
			font-size: 25px;
		}
	}
</style>

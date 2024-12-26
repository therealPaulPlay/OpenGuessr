<!-- Appears in duels when the oponnent has guessed and informs the player that the time has been reduced -->
<script>
	import { timeReducedOverlay, timeReducedOverlayText } from "$lib/stores/context-specific/multiplayerStore";
</script>

<div
	id="duelsOverlay"
	style:opacity={$timeReducedOverlay ? "1" : "0"}
	style:scale={$timeReducedOverlay ? "1.03" : "1"}
	style:filter={$timeReducedOverlay ? "none" : "blur(5px)"}
>
	<h1>Your opponent has guessed</h1>
	<p id="duelsOverlaySubtitle">{$timeReducedOverlayText}</p>
</div>

<style>
	#duelsOverlay {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		z-index: 1;
		transition:
			opacity 500ms ease,
			scale 2000ms ease,
			transform 2000ms ease,
			filter 500ms ease;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		pointer-events: none;
		user-select: none;
	}

	#duelsOverlay h1 {
		font-size: 75px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
		opacity: 0.75;
		text-align: center;
		margin-bottom: 10px;
	}

	#duelsOverlay p {
		font-size: 35px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: 20px;
		opacity: 0.75;
		text-align: center;
	}

	@media all and (max-width: 1200px) {
		#duelsOverlay h1 {
			font-size: 45px;
		}

		#duelsOverlay p {
			font-size: 25px;
		}
	}
</style>

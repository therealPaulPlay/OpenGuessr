<!-- Used for the singleplayer timer countdown  - formerly known as the hardmode fade (when hardmode was still a thing) -->
<script>
	import {
		timerCountdownOverlay,
		timerCountdownOverlayTitle,
	} from "$lib/stores/context-specific/timerCountdownOverlayStore";
</script>

<div
	id="timerCountdown"
	style:opacity={$timerCountdownOverlay ? "1" : "0"}
	style:pointer-events={$timerCountdownOverlay ? "auto" : "none"}
>
	<h1 id="hardModeTitle">{$timerCountdownOverlayTitle}</h1>
</div>

<style>
	#timerCountdown {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		z-index: 3;
		transition: opacity 250ms ease;
		opacity: 0;
		overflow: hidden;
		backdrop-filter: blur(50px);
		background-color: rgba(0, 0, 0, 0.2);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		pointer-events: none;
		user-select: none;
	}

	#timerCountdown h1 {
		font-size: 75px;
		text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
		margin-bottom: var(--layout-margin);
	}

	@media all and (max-width: 1200px) {
		#timerCountdown h1 {
			font-size: 45px;
		}
	}
</style>

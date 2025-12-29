<script>
	import {
		fullscreenCelebrationNumber,
		showFullscreenCelebration,
	} from "$lib/stores/context-specific/resultScreenStore";
	import { blur } from "svelte/transition";
</script>

{#if $showFullscreenCelebration}
	<div class="resultTakeover" transition:blur={{ duration: 250 }}>
		<h1 class="animateTitle">
			<span class="digit">{$fullscreenCelebrationNumber}</span>
			<span class="k">K</span>
		</h1>
	</div>
{/if}

<style>
	.resultTakeover {
		position: fixed;
		inset: 0;
		z-index: 17;
		background-color: var(--dark-background);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.animateTitle {
		color: white;
		filter: drop-shadow(0 0 50px rgba(0, 0, 0, 0.5));
		display: flex;
		gap: 10px;
	}

	.animateTitle span {
		font-size: 200px;
	}

	@media (max-width: 1200px) {
		.animateTitle span {
			font-size: 175px;
		}
	}

	.digit,
	.k {
		display: inline-block;
		transform-origin: center;
	}

	.digit {
		animation: spinAnim 1.2s ease-out forwards;
	}

	.k {
		animation: spinAnim 1.2s ease-out 0.1s forwards;
	}

	@keyframes spinAnim {
		0% {
			transform: scale(0) rotate(-120deg);
			opacity: 0;
		}
		20% {
			transform: scale(1.3) rotate(20deg);
			opacity: 1;
		}
		30% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		60% {
			transform: scale(1) rotate(0deg);
			color: rgb(202, 255, 202);
			opacity: 1;
		}
		80% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
			color: white;
		}
		100% {
			transform: scale(0);
			color: white;
			opacity: 0;
		}
	}
</style>

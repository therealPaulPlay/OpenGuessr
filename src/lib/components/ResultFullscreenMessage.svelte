<script>
	import { earnedExperience, resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { blur } from "svelte/transition";
	import { onMount } from "svelte";

	let animationTimeout;
	let showAnimation = $state(false);
	let currentScore = $state(0);
	let alreadyShown = false;

	resultScreenEnabled.subscribe((value) => {
		if (!value) alreadyShown = false;
	});

	$effect(() => {
		const expValue = $earnedExperience;

		if (expValue >= 5000 && $resultScreenEnabled && !alreadyShown) {
			currentScore = Math.floor(expValue / 1000);
			clearTimeout(animationTimeout);
			showAnimation = true;
			alreadyShown = true;
			animationTimeout = setTimeout(() => (showAnimation = false), 1000);
		}
	});

	onMount(() => () => clearTimeout(animationTimeout));
</script>

{#if showAnimation}
	<div class="resultTakeover" transition:blur={{ duration: 250 }}>
		<h1 class="animateTitle">
			<span class="digit">{currentScore}</span>
			<span class="k">K</span>
		</h1>
	</div>
{/if}

<style>
	.resultTakeover {
		position: fixed;
		inset: 0;
		z-index: 0;
		background-color: var(--dark-background);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.animateTitle {
		color: white;
		filter: drop-shadow(0 0 50px rgba(0, 0, 0, 0.5));
		font-size: 200px;
		display: flex;
		gap: 10px;
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

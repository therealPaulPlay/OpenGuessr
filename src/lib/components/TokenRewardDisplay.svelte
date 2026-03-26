<script>
	let { tokens = 5 } = $props();
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";

	const animatedTokens = tweened(0, {
		duration: 2000,
		easing: cubicOut,
	});

	$effect(() => {
		animatedTokens.set(tokens);
	});
</script>

<div class="token-reward-display" class:token-reward-background={tokens > 0}>
	<div class="sparkles" class:animated-sparkles={tokens > 0}></div>
	<div class="token-box" style:opacity={tokens == 0 ? 0.5 : 1}>
		<h2 class="title-text">+&hairsp;{$animatedTokens.toFixed(0)}</h2>
		<img class="token-icon" alt="token" src="/img/token_icon_white.png" />
	</div>
</div>

<style>
	.token-reward-display {
		display: flex;
		min-width: 100px;
		justify-content: center;
		flex-direction: column;
		flex-grow: 1;
		flex-basis: 0%;
		height: 38px;
		align-items: center;
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		overflow: hidden;
		position: relative;
	}
	.token-reward-background {
		background: linear-gradient(30deg, rgba(247, 27, 19, 0.6), rgba(255, 55, 55, 0.85));
		box-shadow: var(--bulb-shadow);
	}
	.token-box {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 3px;
		width: 100%;
	}
	.token-icon {
		width: 30px;
		height: 30px;
		margin-bottom: -4px;
	}
	.sparkles {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.animated-sparkles::before {
		content: "✦";
		position: absolute;
		top: 30%;
		left: 70%;
		color: white;
		font-size: 12px;
		transform-origin: center;
		animation: sparkle 12s ease-in-out infinite;
	}
	@keyframes sparkle {
		0%,
		15% {
			opacity: 0;
			transform: scale(0) rotate(45deg);
			top: 20%;
			left: 70%;
		}
		7.5% {
			opacity: 1;
			transform: scale(1) rotate(90deg);
			top: 20%;
			left: 70%;
		}
		35%,
		50% {
			opacity: 0;
			transform: scale(0) rotate(45deg);
			top: 50%;
			left: 20%;
		}
		42.5% {
			opacity: 1;
			transform: scale(1) rotate(90deg);
			top: 50%;
			left: 20%;
		}
		70%,
		85% {
			opacity: 0;
			transform: scale(0) rotate(45deg);
			top: 35%;
			left: 85%;
		}
		77.5% {
			opacity: 1;
			transform: scale(1) rotate(90deg);
			top: 35%;
			left: 85%;
		}
		85%,
		100% {
			opacity: 0;
			transform: scale(0) rotate(0deg);
			top: 35%;
			left: 85%;
		}
	}
</style>

<script>
	import { experience } from "$lib/stores/accountStore";
	import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";
	import { onMount } from "svelte";

	let progressRingLevel = $state(0);
	let circleElement = $state();
	const gradientId = `ringGradient-${Math.random().toString(36).substr(2, 9)}`;

	onMount(() => {
		progressRingLevel = getLevel();
		setProgress(getLevelFraction());
	});

	experience.subscribe((_value) => {
		progressRingLevel = getLevel();
		setProgress(getLevelFraction());
	});

	function setProgress(factor) {
		try {
			if (!circleElement) return;
			if (factor < 0.05 && factor != 0) factor = 0.05; // Avoid ultra thin line when barely having more XP than the current level
			const radius = circleElement?.r?.baseVal?.value;
			const circumference = 2 * Math.PI * radius;

			circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
			circleElement.style.strokeDashoffset = `${circumference}`;

			const offset = circumference - factor * circumference;
			circleElement.style.strokeDashoffset = offset;
		} catch (error) {
			console.warn("Error setting progress:", error);
		}
	}
</script>

<div class="progress-container">
	<svg class="progress-ring" width="30" height="30">
		<defs>
			<linearGradient id={gradientId} gradientTransform="rotate(240)">
				<stop offset="5%" stop-color="#37d738" />
				<stop offset="95%" stop-color="#22a826" />
			</linearGradient>
		</defs>
		<circle
			bind:this={circleElement}
			class="progress-ring-circle"
			stroke="url('#{gradientId}')"
			stroke-opacity={circleElement ? "" : 0}
			stroke-width="4"
			fill="transparent"
			r="13"
			cx="15"
			cy="15"
		></circle>
	</svg>
	<div class="progress-ring-text">{progressRingLevel}</div>
</div>

<style>
	.progress-container {
		position: relative;
		width: 30px;
		height: 30px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 50%;
		box-shadow: var(--bulb-shadow);
	}

	.progress-ring {
		transform: rotate(-90deg);
		border-radius: 100%;
	}

	.progress-ring-circle {
		transition: 0.35s stroke-dashoffset;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
	}

	.progress-ring-text {
		position: absolute;
		font-size: 15px;
		margin-bottom: 1px;
		color: white;
		user-select: none;
	}
</style>

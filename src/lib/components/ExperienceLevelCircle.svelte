<script>
	import { experience } from "$lib/stores/accountStore";
	import { getLevel, getLevelFraction } from "$lib/utils/experienceCalculations";

	let progressRingLevel = $state(0);
	let progress = $state(0);
	const gradientId = `ringGradient-${Math.random().toString(36).substr(2, 9)}`;

	experience.subscribe((_value) => {
		progressRingLevel = getLevel();
		setProgress(getLevelFraction());
	});

	function setProgress(factor) {
		if (factor < 0.05 && factor != 0) factor = 0.05; // Avoid ultra thin line when barely having more XP than the current level
		if (factor > 0.97) factor = 0.97; // Avoid ultra thin line when being super close to the level up
		progress = factor;
	}
</script>

<div class="progress-container">
	<svg class="progress-ring" width="30" height="30" style:--progress="{progress * 100}%">
		<defs>
			<linearGradient id={gradientId} gradientTransform="rotate(180, 0.5, 0.5)">
				<stop offset="5%" stop-color="#37d738" />
				<stop offset="95%" stop-color="#26c026" />
			</linearGradient>
		</defs>
		<circle stroke="url('#{gradientId}')" stroke-width="4" fill="transparent" r="13" cx="15" cy="15"></circle>
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

	@property --progress {
		syntax: "<percentage>";
		inherits: false;
		initial-value: 0%;
	}

	.progress-ring {
		transform: rotate(-90deg);
		border-radius: 100%;
		mask-image: conic-gradient(black max(0%, var(--progress)), transparent var(--progress));
		transition: --progress 0.35s;
	}

	.progress-ring-text {
		position: absolute;
		font-size: 15px;
		margin-bottom: 1px;
		color: white;
		user-select: none;
	}
</style>

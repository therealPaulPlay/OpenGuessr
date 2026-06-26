<script>
	import { elo } from "$lib/stores/accountStore";

	// Divisions
	let fillPercentage = $derived.by(() => {
		const value = $elo;
		if (value <= 1000) return 0;
		if (value <= 1200) return (value - 1000) * (25 / 200); // 0-25%
		if (value <= 1400) return 25 + (value - 1200) * (25 / 200); // 25-50%
		if (value <= 1600) return 50 + (value - 1400) * (25 / 200); // 50-75%
		if (value <= 2000) return 75 + (value - 1600) * (25 / 400); // 75-100%
		return 100;
	});

	function calculateDivision(elo) {
		if (elo < 1200) return 4; // V  (index 0 in the UI)
		if (elo < 1400) return 3; // IV (index 1 in the UI)
		if (elo < 1600) return 2; // III (index 2 in the UI)
		if (elo < 2000) return 1; // II (index 3 in the UI)
		return 0; // I (index 4 in the UI)
	}

	let currentDivision = $derived(calculateDivision($elo));

	const divisions = ["I", "II", "III", "IV", "V"].reverse();
	const circlePositions = [0, 25, 50, 75, 100];
</script>

<div class="progress-container">
	<div class="progress-bar-wrapper">
		<div class="progress-bar">
			<div class="progress-bar-fill" style="width: {fillPercentage}%"></div>
		</div>

		{#each divisions as division, index}
			<div class="division-marker" style="left: {circlePositions[index]}%">
				<div class="division-circle" class:active-division={4 - index === currentDivision}>
					<span class="division-text">{division}</span>
				</div>
			</div>
		{/each}

		<div class="elo-indicator" style="left: {fillPercentage}%">
			<div class="elo-line"></div>
			<div class="elo-value">{Math.round($elo)?.toLocaleString()} Elo</div>
		</div>
	</div>
</div>

<style>
	.progress-container {
		position: relative;
		width: calc(100% - 50px);
		height: 120px;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		padding-inline: 25px;
		box-shadow: var(--box-shadow);
	}

	.progress-bar-wrapper {
		position: relative;
		width: calc(100% - 60px);
		margin: 0 30px;
		height: 100%;
	}

	.progress-bar {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 100%;
		height: var(--panel-margin);
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: var(--brand-color);
		box-shadow: var(--bulb-shadow);
		border-radius: 6px;
		transition: width 300ms ease;
	}

	.division-marker {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.division-circle {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		overflow: hidden;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		background-color: rgb(114, 115, 119);
		box-shadow: var(--bulb-shadow);
	}

	.division-text {
		color: white;
		z-index: 1;
		font-size: 22px;
		position: relative;
	}

	.elo-indicator {
		position: absolute;
		top: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 50%;
		z-index: -1;
		transition: left 300ms ease;
	}

	.elo-line {
		width: 2px;
		height: 14px;
		background: var(--brand-color);
		margin-top: var(--layout-margin);
		border-radius: var(--content-margin);
	}

	.elo-value {
		color: var(--brand-color);
		box-shadow: var(--box-shadow);
		font-size: 18px;
		margin-top: 4px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border-radius: var(--content-margin);
		background-color: rgba(0, 0, 0, 0.3);
		padding-inline: 2px;
	}

	.active-division {
		background-color: rgb(160, 162, 166);
	}

	@media (max-width: 800px) {
		.division-circle {
			width: 40px;
			height: 40px;
		}
	}
</style>

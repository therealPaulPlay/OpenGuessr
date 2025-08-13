<script>
	import { elo, isAuthenticated } from "$lib/stores/accountStore";
	import { blur } from "svelte/transition";

	let { inPage = false } = $props();

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
		if (elo < 1200) return 4; // V   (index 0 in the UI)
		if (elo < 1400) return 3; // IV  (index 1 in the UI)
		if (elo < 1600) return 2; // III (index 2 in the UI)
		if (elo < 2000) return 1; // II  (index 3 in the UI)
		return 0; // I   (index 4 in the UI)
	}

	let currentDivision = $derived(calculateDivision($elo));

	const divisions = ["I", "II", "III", "IV", "V"].reverse();
	const circlePositions = [0, 25, 50, 75, 100];
</script>

<div class="progressContainer" style:border-radius={inPage ? "10px" : ""}>
	<div class="progressBarWrapper">
		<div class="progressBar">
			<div class="progressBarFill" style="width: {fillPercentage}%"></div>
		</div>

		{#each divisions as division, index}
			<div class="divisionMarker" style="left: {circlePositions[index]}%">
				<div class="divisionCircle" class:activeDivision={4 - index === currentDivision}>
					<span class="divisionText">{division}</span>
				</div>
			</div>
		{/each}

		{#if $isAuthenticated}
			<div class="eloIndicator" style="left: {fillPercentage}%" transition:blur>
				<div class="eloLine"></div>
				<div class="eloValue">{Math.round($elo)} Elo</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.progressContainer {
		position: relative;
		width: calc(100% - 50px);
		height: 120px;
		border-radius: 15px;
		background-color: var(--box-color);
		padding-inline: 25px;
		margin-bottom: var(--layout-margin);
		box-shadow: var(--box-shadow);
	}

	.progressBarWrapper {
		position: relative;
		width: calc(100% - 60px);
		margin: 0 30px;
		height: 100%;
	}

	.progressBar {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 100%;
		height: var(--panel-margin);
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		overflow: hidden;
	}

	.progressBarFill {
		height: 100%;
		background: var(--brand-color);
		box-shadow: var(--bulb-shadow);
		border-radius: 6px;
		transition: width 300ms ease;
	}

	.divisionMarker {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.divisionCircle {
		width: 50px;
		height: 50px;
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

	.divisionText {
		color: white;
		z-index: 1;
		font-size: 22px;
		position: relative;
	}

	.eloIndicator {
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

	.eloLine {
		width: 2px;
		height: 14px;
		background: var(--brand-color);
		margin-top: 15px;
		border-radius: 5px;
	}

	.eloValue {
		color: var(--brand-color);
		box-shadow: var(--box-shadow);
		font-size: 18px;
		margin-top: 4px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border-radius: 5px;
		background-color: rgba(0, 0, 0, 0.3);
		padding-inline: 2px;
	}

	.activeDivision {
		background-color: rgb(160, 162, 166);
	}

	@media (max-width: 800px) {
		.divisionCircle {
			width: 40px;
			height: 40px;
		}
	}
</style>

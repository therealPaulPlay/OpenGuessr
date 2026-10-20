<script>
	import { GripVertical } from "@lucide/svelte";

	let {
		startElo = 1500,
		rangeLeft = $bindable(0),
		rangeRight = $bindable(0),
		rangeStart = 1000,
		rangeEnd = 2000,
	} = $props();

	const TOTAL_RANGE = $derived(rangeEnd - rangeStart); // Full elo width

	let isDragging = $state(false);
	let startX = $state(0);
	let right = $state(false);

	let barPixelValue = $state(50);
	let startPixelValue = $state(50);

	let width = $state(200);

	function handleStart(event, isRight) {
		right = isRight;
		isDragging = true;
		startX = event.clientX;
		startPixelValue = barPixelValue;
	}

	function handleCancel() {
		isDragging = false;
		right = false;
		startX = 0;
		startPixelValue = 0;
	}

	function handleDrag(event) {
		if (!isDragging) return;
		const delta = (event.clientX - startX) * 2;

		barPixelValue = Math.min(width, Math.max(32, right ? startPixelValue + delta : startPixelValue - delta));
	}

	// Calculations
	$effect(() => {
		const range = (TOTAL_RANGE / width) * barPixelValue; // Selected elo range
		const halfRange = range * 0.5;
		rangeLeft = Math.round(startElo - halfRange);
		rangeRight = Math.round(startElo + halfRange);
	});

	function numberToK(num = 0) {
		if (num >= 1000) {
			return Math.round((num / 1000) * 100) / 100 + "k";
		} else return num.toLocaleString();
	}
</script>

<svelte:window onpointermove={handleDrag} onpointerup={handleCancel} />

<div class="range-container bar-menu" style:width={width + "px"}>
	<div class="elo-marker elo-start">
		<p>{numberToK(rangeStart)}</p>
		<span class="elo-line"></span>
	</div>
	<div class="elo-marker elo-end">
		<p>{numberToK(rangeEnd)}+</p>
		<span class="elo-line"></span>
	</div>
	<div class="selection-display bar-menu">
		<p class="grow-selection">{numberToK(rangeLeft)}</p>
		<p style:opacity="0.75">-</p>
		<p class="grow-selection">{numberToK(rangeRight)}</p>
	</div>
	<div class="range-texture bright-soft" style:width={barPixelValue + "px"}>
		<div class="range-texture-depth"></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="range-drag left" onpointerdown={(e) => handleStart(e, false)}>
			<GripVertical size={16} style="pointer-events: none;" />
		</div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="range-drag right" onpointerdown={(e) => handleStart(e, true)}>
			<GripVertical size={16} style="pointer-events: none;" />
		</div>
	</div>
</div>

<style>
	.range-container {
		height: 40px;
		position: relative;
		justify-content: center;
		padding: 0;
		margin-top: var(--layout-spacer);
	}

	.range-texture {
		height: 100%;
		position: relative;
		border-radius: var(--box-margin);
	}

	.range-texture-depth {
		position: absolute;
		inset: 0;
		background: linear-gradient(to right, var(--box-color) 20%, transparent, var(--box-color) 80%);
	}

	.range-drag {
		display: flex;
		align-items: center;
		background-color: white;
		border-radius: 2px;
		position: absolute;
		height: 100%;
		box-shadow:
			0 0 5px rgba(255, 255, 255, 0.5),
			inset 0 0.075rem 3px hsla(0, 0%, 100%, 0.4),
			inset 0 -0.2rem 5px rgba(0, 0, 5, 0.3);
		color: rgba(0, 0, 0, 0.25);
		cursor: ew-resize;
	}

	.range-drag.left {
		left: 0;
	}

	.range-drag.right {
		right: 0;
	}

	.elo-marker {
		position: absolute;
		bottom: calc(100% + 8px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		user-select: none;
	}

	.elo-marker.elo-start {
		left: 0;
		transform: translateX(calc(-50% + var(--panel-margin)));
	}

	.elo-marker.elo-end {
		right: 0;
		transform: translateX(calc(50% - var(--panel-margin)));
	}

	.elo-line {
		width: 2px;
		background-color: white;
		height: var(--panel-margin);
		border-radius: 2px;
		opacity: 0.5;
	}

	.selection-display {
		position: absolute;
		bottom: calc(100% + var(--layout-margin));
		margin-inline: auto;
		text-align: center;
		user-select: none;
		display: flex;
		font-variant-numeric: tabular-nums;
		min-width: 130px;
	}

	.grow-selection {
		flex-grow: 1;
        flex-basis: 0;
		text-align: center;
        font-variant-numeric: tabular-nums;
	}
</style>

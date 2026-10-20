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
	const MIN_HALF_PIXELS = 16; // Keeps both drag handles visible

	let isDragging = $state(false);
	let startX = $state(0);
	let right = $state(false);

	let halfBarWidthPixels = $state(MIN_HALF_PIXELS); // Bar extent from the center to each side
	let startPixelValue = $state(MIN_HALF_PIXELS);

	let width = $state(250); // Width of the full range container

	// Bar width and offset
	// The exact center point of the bar, accounting for the drag handle widths
	let centerPixel = $derived(
		Math.min(width - MIN_HALF_PIXELS, Math.max(MIN_HALF_PIXELS, ((startElo - rangeStart) / TOTAL_RANGE) * width)),
	);
	let maxHalfPixels = $derived(Math.max(centerPixel, width - centerPixel));

	let barLeft = $derived(Math.max(0, centerPixel - halfBarWidthPixels));
	let barRight = $derived(Math.min(width, centerPixel + halfBarWidthPixels));

	function handleStart(event, isRight) {
		right = isRight;
		isDragging = true;
		startX = event.clientX;
		startPixelValue = halfBarWidthPixels;
	}

	function handleCancel() {
		isDragging = false;
		right = false;
		startX = 0;
		startPixelValue = 0;
	}

	function handleDrag(event) {
		if (!isDragging) return;
		const delta = event.clientX - startX;

		halfBarWidthPixels = Math.min(
			maxHalfPixels,
			Math.max(MIN_HALF_PIXELS, right ? startPixelValue + delta : startPixelValue - delta),
		);
	}

	// Range left and right calculations
	$effect(() => {
		const eloPerPixel = TOTAL_RANGE / width;
		rangeLeft = Math.round(rangeStart + barLeft * eloPerPixel);
		rangeRight = Math.round(rangeStart + barRight * eloPerPixel);
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
		<p>&lt;{numberToK(rangeStart)}</p>
		<span class="elo-line"></span>
	</div>
	<div class="elo-marker elo-end">
		<p>&gt;{numberToK(rangeEnd)}</p>
		<span class="elo-line"></span>
	</div>
	<div class="selection-display bar-menu">
		<p class="grow-selection">{rangeLeft <= rangeStart ? "<" : ""}{numberToK(rangeLeft)}</p>
		<p style:opacity="0.75">-</p>
		<p class="grow-selection">{rangeRight >= rangeEnd ? ">" : ""}{numberToK(rangeRight)}</p>
		<p style:opacity="0.75">Elo</p>
	</div>
	<div class="range-texture bright-soft" style:left={barLeft + "px"} style:width={barRight - barLeft + "px"}>
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
		padding: 0;
		margin-top: 58px;
		margin-bottom: var(--box-margin);
		user-select: none;
	}

	.range-texture {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: var(--box-margin);
	}

	.range-texture-depth {
		position: absolute;
		inset: 0;
		background: linear-gradient(to right, var(--box-color) 20%, transparent 40%, transparent 60%, var(--box-color) 80%);
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
		display: flex;
		font-variant-numeric: tabular-nums;
		min-width: 175px;
		left: 0;
		right: 0;
		margin-inline: auto;
        padding-inline: var(--layout-margin);
	}

	.grow-selection {
		flex-grow: 1;
		flex-basis: 0;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>

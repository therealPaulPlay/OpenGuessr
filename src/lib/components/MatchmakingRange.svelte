<script>
	import { GripVertical } from "@lucide/svelte";
	import { blur } from "svelte/transition";
	import { onDestroy } from "svelte";

	let {
		startValue = 0,
		valueName = "Elo",
		rangeLeft = $bindable(0),
		rangeRight = $bindable(0),
		rangeStart = 1000,
		rangeEnd = 2000,
		isDragging = $bindable(false),
		ondragstart,
		onchange,
	} = $props();

	let totalRange = $derived(rangeEnd - rangeStart); // Full value range (e.g. 1000 -> 2000 it would be 1000)
	const MIN_HALF_PIXELS = 16; // Keeps both drag handles visible

	let startX = $state(0);
	let right = $state(false);
	let dragPointerId = $state(null);

	let startPixelValue = $state(MIN_HALF_PIXELS);

	let width = $state(250); // Width of the full range container
	let valuePerPixel = $derived(totalRange / width);

	// Bar width and offset
	// The exact center point of the bar (for the startValue), accounting for the drag handle widths
	let centerPixel = $derived(
		Math.min(width - MIN_HALF_PIXELS, Math.max(MIN_HALF_PIXELS, ((startValue - rangeStart) / totalRange) * width)),
	);
	let maxHalfBarWidthPixels = $derived(Math.max(centerPixel, width - centerPixel)); // The longer half of the bar texture, if it was max. extended, from center pixel to edge

	// The bar follows rangeLeft and rangeRight, but ensures the drag handles never overlap
	let barLeft = $derived(
		Math.max(0, Math.min(centerPixel - MIN_HALF_PIXELS, (rangeLeft - rangeStart) / valuePerPixel)),
	);
	let barRight = $derived(
		Math.min(width, Math.max(centerPixel + MIN_HALF_PIXELS, (rangeRight - rangeStart) / valuePerPixel)),
	);
	let halfBarWidthPixels = $derived(Math.max(centerPixel - barLeft, barRight - centerPixel)); // Bar extent from the center to each side (the greater one)

	function handleStart(event, isRight) {
		if (dragPointerId !== null) return; // Ignore start attempts while already started
		right = isRight;
		startX = event.clientX;
		dragPointerId = event.pointerId;
		startPixelValue = halfBarWidthPixels;
	}

	function handleCancel(event) {
		if (event.pointerId !== dragPointerId) return;
		dragPointerId = null;
		right = false;
		startX = 0;
		startPixelValue = 0;
		if (isDragging) {
			isDragging = false;
			onchange?.();
		}
	}

	function handleDrag(event) {
		if (event.pointerId !== dragPointerId) return;
		const delta = event.clientX - startX;
		if (!isDragging) {
			if (delta === 0) return;
			isDragging = true;
			ondragstart?.();
		}

		const newHalfBarWidthPixels = Math.min(
			maxHalfBarWidthPixels,
			Math.max(MIN_HALF_PIXELS, right ? startPixelValue + delta : startPixelValue - delta),
		);
		rangeLeft = Math.round(rangeStart + Math.max(0, centerPixel - newHalfBarWidthPixels) * valuePerPixel);
		rangeRight = Math.round(rangeStart + Math.min(width, centerPixel + newHalfBarWidthPixels) * valuePerPixel);
	}

	function numberToK(num = 0) {
		if (num >= 1000) {
			const thousands = Math.round((num / 1000) * 100) / 100;
			return (Number.isInteger(thousands) ? thousands : thousands.toFixed(2)) + "k";
		} else return Math.round(num).toLocaleString();
	}

	onDestroy(() => (isDragging = false)); // Reset on unmount (important for parent components that bind)
</script>

<svelte:window onpointermove={handleDrag} onpointerup={handleCancel} onpointercancel={handleCancel} />

<div class="range-container bar-menu" style:width={width + "px"} transition:blur={{ duration: 250 }}>
	<div class="value-marker value-marker-start">
		<p>&lt;{numberToK(rangeStart)}</p>
		<span class="value-line"></span>
	</div>
	<div class="value-marker value-marker-end">
		<p>&gt;{numberToK(rangeEnd)}</p>
		<span class="value-line"></span>
	</div>
	<div class="selection-display">
		<p class="grow-selection">{rangeLeft <= rangeStart ? "<" : ""}{numberToK(Math.max(rangeStart, rangeLeft))}</p>
		<p style:opacity="0.75">-</p>
		<p class="grow-selection">{rangeRight >= rangeEnd ? ">" : ""}{numberToK(Math.min(rangeEnd, rangeRight))}</p>
		<p style:opacity="0.75">{valueName}</p>
	</div>
	<div class="range-texture bright" style:left={barLeft + "px"} style:width={barRight - barLeft + "px"}>
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
		position: absolute;
		margin-inline: auto;
		inset: 0;
		padding: 0;
		margin-top: 58px;
		margin-bottom: var(--box-margin);
		user-select: none;
		touch-action: none;
	}

	.range-texture {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: var(--box-margin);
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

	.value-marker {
		position: absolute;
		bottom: calc(100% + 8px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}

	.value-marker p {
		opacity: 0.75;
	}

	.value-marker.value-marker-start {
		left: 0;
		transform: translateX(calc(-50% + var(--panel-margin)));
	}

	.value-marker.value-marker-end {
		right: 0;
		transform: translateX(calc(50% - var(--panel-margin)));
	}

	.value-line {
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
		width: 175px;
        margin-bottom: var(--content-margin);
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

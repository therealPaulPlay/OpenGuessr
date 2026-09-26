<script>
	import { imageGuessr } from "$lib/stores/modeStore.js";
	import { imageGuessrImageSrc, imageGuessrLoading } from "$lib/stores/context-specific/imageGuessrStore";
	import { innerWidth, innerHeight } from "svelte/reactivity/window";
	import { onDestroy } from "svelte";
	import { browser } from "$app/environment";
	import { inMenu } from "$lib/stores/uiStore";

	let zoomLevel = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);
	let rotateStyle = $state("");
	let imageElement = $state();

	// Called on resize, image change, and zoom to 1
	function resetTransformAndZoom() {
		zoomLevel = 1;
		translateX = 0;
		translateY = 0;
	}

	function boundTranslates() {
		if (!imageElement) return;

		const rect = imageElement.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;
		const limitX = innerWidth.current / 2 + width / 2;
		const limitY = innerHeight.current / 2 + height / 2;

		if (translateX > limitX) translateX = limitX;
		if (translateX < -limitX) translateX = -limitX;
		if (translateY > limitY) translateY = limitY;
		if (translateY < -limitY) translateY = -limitY;
	}

	function handleWheel(event) {
		event.preventDefault();

		const delta = event.deltaY > 0 ? -0.2 : 0.2;
		const newZoom = Math.max(1, Math.min(5, zoomLevel + delta));

		const overlay = event.currentTarget;
		const overlayRect = overlay.getBoundingClientRect();

		// Calculate the vertical offset due to attribution text
		const attributionOffset = overlayRect.height * 0.1 + 30; // 10vh + 30px margin

		// Calculate mouse position relative to overlay center
		const mouseX = event.clientX - overlayRect.left - overlayRect.width / 2;
		const mouseY = event.clientY - overlayRect.top - overlayRect.height / 2 + attributionOffset / 2;

		// Adjust for current translation to get position in image space
		const imageSpaceX = mouseX - translateX;
		const imageSpaceY = mouseY - translateY;

		// Apply zoom scaling
		if (newZoom == 1) {
			if (zoomLevel !== 1) resetTransformAndZoom();
		} else {
			translateX = mouseX - imageSpaceX * (newZoom / zoomLevel);
			translateY = mouseY - imageSpaceY * (newZoom / zoomLevel);
			boundTranslates();
		}
		zoomLevel = newZoom;
		rotateStyle = "0deg";
	}

	let isDragging = $state(false);
	let pointerId = null;
	let prevX;
	let prevY;

	function handlePointerDown(event) {
		if (isDragging) return;

		isDragging = true;
		pointerId = event.pointerId;
		prevX = event.clientX;
		prevY = event.clientY;
		document.addEventListener("pointermove", handleDrag);
		document.addEventListener("pointerup", handlePointerUp);
		document.addEventListener("pointercancel", handlePointerUp);
	}

	function handlePointerUp(event) {
		if (event.pointerId !== pointerId) return;

		isDragging = false;
		pointerId = null;
		document.removeEventListener("pointermove", handleDrag);
		document.removeEventListener("pointerup", handlePointerUp);
		document.removeEventListener("pointercancel", handlePointerUp);
	}

	function handleDrag(event) {
		if (event.pointerId !== pointerId) return;

		const deltaX = event.clientX - prevX;
		const deltaY = event.clientY - prevY;
		translateX += deltaX;
		translateY += deltaY;
		prevX = event.clientX;
		prevY = event.clientY;
		rotateStyle = "0deg";
		boundTranslates();
	}

	imageGuessrImageSrc.subscribe(() => {
		rotateStyle = Math.floor(Math.random() * 10 - 5) + "deg";
		resetTransformAndZoom();
	});

	onDestroy(() => {
		// In case currently dragging during unmount
		if (browser) {
			document.removeEventListener("pointermove", handleDrag);
			document.removeEventListener("pointerup", handlePointerUp);
			document.removeEventListener("pointercancel", handlePointerUp);
		}
	});
</script>

<svelte:window onresize={resetTransformAndZoom} />

{#if $imageGuessr}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="image-guessr-overlay"
		style:scale={$inMenu ? 1.1 : 1}
		onwheel={handleWheel}
		onpointerdown={handlePointerDown}
	>
		{const baseTransitions = "filter 250ms ease, rotate 250ms ease, opacity 500ms ease"}
		<div
			class="image-guessr-image"
			bind:this={imageElement}
			class:guess-image-loading={$imageGuessrLoading}
			style:background-image={$imageGuessrImageSrc ? `url(${$imageGuessrImageSrc})` : ""}
			style:rotate={rotateStyle}
			style:transform={`translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`}
			style:transition={isDragging ? baseTransitions : "transform 150ms ease, " + baseTransitions}
			role="img"
		></div>
		<p class="image-guessr-attribution">
			CC0 Images by <a href="https://commons.wikimedia.org/" target="_blank">Wikimedia</a>
		</p>
		<div
			class="image-guessr-background"
			class:guess-image-loading={$imageGuessrLoading}
			style:background-image={$imageGuessrImageSrc ? `url(${$imageGuessrImageSrc})` : ""}
		></div>
	</div>
{/if}

<style>
	.image-guessr-overlay {
		width: 100%;
		height: 100%;
		position: fixed;
		display: flex;
		top: 0;
		z-index: 2;
		transform: scale(1);
		overflow: hidden;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: white;
		user-select: none;
		background-color: rgb(22, 22, 22);
		transition: scale 400ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.image-guessr-image {
		max-width: 40%;
		max-height: 70%;
		width: 100%;
		height: 100%;
		pointer-events: auto;
		z-index: 3;
		opacity: 1;
		background-size: contain; /* Maintain aspect ratio */
		background-position: center;
		background-repeat: no-repeat;
		filter: drop-shadow(10px 0px 0px rgb(255, 255, 255)) drop-shadow(0px 10px 0px rgb(255, 255, 255))
			drop-shadow(-10px 0px 0px rgb(255, 255, 255)) drop-shadow(0px -10px 0px rgb(255, 255, 255));
	}

	.image-guessr-attribution {
		color: white;
		opacity: 0.5;
		z-index: 2;
		margin-bottom: 10vh;
		margin-top: var(--box-margin);
		font-size: 20px;
	}

	.image-guessr-background {
		position: fixed;
		width: 100%;
		height: 100%;
		z-index: 1;
		filter: brightness(0.5) blur(var(--strong-blur));
		background-size: cover;
		transition: opacity 500ms ease;
		opacity: 1;
	}

	.guess-image-loading {
		opacity: 0 !important;
	}

	@media all and (max-width: 1200px) {
		.image-guessr-image {
			max-width: 80%;
			max-height: 40%;
		}
	}
</style>

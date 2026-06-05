<script>
	import { imageGuessr } from "$lib/stores/modeStore.js";
	import { imageGuessrImageSrc, imageGuessrLoading } from "$lib/stores/context-specific/imageGuessrStore";

	let zoomLevel = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);
	let rotateStyle = $state("");

	function resetTransformAndZoom() {
		zoomLevel = 1;
		translateX = 0;
		translateY = 0;
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
			translateX = 0;
			translateY = 0;
		} else {
			translateX = mouseX - imageSpaceX * (newZoom / zoomLevel);
			translateY = mouseY - imageSpaceY * (newZoom / zoomLevel);
		}
		zoomLevel = newZoom;
		rotateStyle = "0deg";
	}

	imageGuessrImageSrc.subscribe(() => {
		rotateStyle = Math.floor(Math.random() * 10 - 5) + "deg";
		resetTransformAndZoom();
	});
</script>

<svelte:window onresize={resetTransformAndZoom} />

{#if $imageGuessr}
	<div class="imageGuessrOverlay" onwheel={handleWheel}>
		<div
			class="imageGuessrImage"
			class:guessImageLoading={$imageGuessrLoading}
			style:background-image={$imageGuessrImageSrc ? `url(${$imageGuessrImageSrc})` : ""}
			style:rotate={rotateStyle}
			style:transform={`translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`}
			role="img"
		></div>
		<p class="imageGuessrAttribution">
			CC0 Images by <a href="https://commons.wikimedia.org/" target="_blank">Wikimedia</a>
		</p>
		<div
			class="imageGuessrBackground"
			class:guessImageLoading={$imageGuessrLoading}
			style:background-image={$imageGuessrImageSrc ? `url(${$imageGuessrImageSrc})` : ""}
		></div>
	</div>
{/if}

<style>
	.imageGuessrOverlay {
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
	}

	.imageGuessrImage {
		max-width: 40%;
		max-height: 70%;
		width: 100%;
		height: 100%;
		transition:
			transform 250ms ease,
			filter 250ms ease,
			rotate 250ms ease,
			opacity 500ms ease;
		pointer-events: auto;
		z-index: 3;
		opacity: 1;
		background-size: contain; /* Maintain aspect ratio */
		background-position: center;
		background-repeat: no-repeat;
		filter: drop-shadow(10px 0px 0px rgb(255, 255, 255)) drop-shadow(0px 10px 0px rgb(255, 255, 255))
			drop-shadow(-10px 0px 0px rgb(255, 255, 255)) drop-shadow(0px -10px 0px rgb(255, 255, 255));
	}

	.imageGuessrAttribution {
		color: white;
		opacity: 0.5;
		z-index: 2;
		margin-bottom: 10vh;
		margin-top: var(--box-margin);
		font-size: 20px;
	}

	.imageGuessrBackground {
		position: fixed;
		width: 100%;
		height: 100%;
		z-index: 1;
		filter: brightness(0.5) blur(var(--strong-blur));
		background-size: cover;
		transition: opacity 500ms ease;
		opacity: 1;
	}

	.guessImageLoading {
		opacity: 0 !important;
	}

	@media all and (max-width: 1200px) {
		.imageGuessrImage {
			max-width: 80%;
			max-height: 40%;
		}
	}
</style>

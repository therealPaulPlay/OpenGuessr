<script>
	import { captchaPopupVisible } from "$lib/stores/context-specific/captchaPopupStore";
	import { loadingScreenVisible } from "$lib/stores/uiStore";
</script>

<div class="loadingOverlay" style:opacity={$loadingScreenVisible ? "100%" : "0%"}>
	<img src="/img/compass_spinner.png" alt="Loading new streetview" class="spinner" />
</div>

<style>
	.loadingOverlay {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		opacity: 0%;
		pointer-events: none;
		background-color: #11121f;
		transition: opacity 150ms ease;
		position: fixed;
		inset: 0 0 0 0; /* Top, right, bottom, left */
		z-index: 6;
		box-shadow: 0 0 500px rgba(165, 176, 251, 0.25) inset;
	}
</style>

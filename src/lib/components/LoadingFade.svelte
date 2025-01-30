<script>
	import { loadingScreenVisible } from "$lib/stores/uiStore";
</script>

<div id="BeforeOverlay" style:opacity={$loadingScreenVisible ? "100%" : "0%"}>
	<img
		src="/img/compass_spinner.png"
		alt="Loading new streetview"
		class="spinner"
		style:opacity={$loadingScreenVisible ? "30%" : "10%"}
	/>
	<p id="loadingText">Loading...</p>
</div>

<style>
	#BeforeOverlay {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		opacity: 0%;
		pointer-events: none;
		background-color: #11121f;
		transition: opacity 100ms ease;
		position: fixed;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 6;
		box-shadow: 0 0 700px rgba(165, 176, 251, 0.2) inset;
	}

	#loadingText {
		color: white;
		opacity: 0.3;
		font-size: 25px;
		text-align: center;
	}
</style>

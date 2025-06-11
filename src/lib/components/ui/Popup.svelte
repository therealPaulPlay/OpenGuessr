<!-- Universal Popup component, used as the "enclosure" for (basically) all Popups -->

<script>
	import { onMount, onDestroy } from "svelte";
	import { backOut } from "svelte/easing";
	import { fade, scale } from "svelte/transition";

	let { children, z, frameLess, slim, verySlim } = $props();
</script>

<div class="popupHolder" style:z-index={z} transition:fade={{ duration: 100 }}>
	<div
		class="uiWindow"
		transition:scale={{ easing: backOut, duration: 250, start: 0.9 }}
		class:frameLess={Boolean(frameLess)}
		style:max-width={Boolean(verySlim) ? "550px" : Boolean(slim) ? "700px" : ""}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.popupHolder {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--dark-background);
		pointer-events: auto;
		z-index: 100; /* Default Z-Index, can be changed with Prop */
	}

	.frameLess {
		width: calc(99% - 25px) !important ;
		height: calc(98% - 25px) !important ;
		overflow: hidden;
		padding: 5px !important;
		max-width: 600px !important;
		max-height: 750px !important;
	}

	.uiWindow {
		width: 65%;
		min-width: 300px;
		max-width: 800px;
		padding: 25px;
		border-radius: 15px;
		text-align: left;
		z-index: 900;
		font-size: 22px;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		box-shadow:
			0 2px 100px rgba(5, 6, 10, 0.5),
			inset 0 0.075rem 1px hsla(0, 0%, 100%, 0.2),
			inset 0 -0.2rem 1px rgba(0, 0, 2, 0.2) !important;
		color: white;
		pointer-events: auto;
		transition:
			opacity 250ms ease,
			transform 250ms ease;
	}
</style>

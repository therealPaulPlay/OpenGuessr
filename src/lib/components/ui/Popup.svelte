<!-- Universal Popup component, used as the "enclosure" for (basically) all Popups -->

<script>
	import { onMount, onDestroy } from "svelte";
	import { fade } from "svelte/transition";

	let { children, z, frameLess, slim, verySlim } = $props();

	let animateClass = $state("");

	onMount(() => {
		// Trigger the popup animation
		animateClass = "animate";
	});

	onDestroy(() => {
		animateClass = "";
	});
</script>

<div class="popupHolder" style:z-index={z} transition:fade={{ duration: 50 }}>
	<div
		class="uiWindow {animateClass}"
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
		background-color: var(--menu-background);
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 100px rgba(5, 6, 10, 0.5);
		color: white;
		pointer-events: auto;
		transition:
			opacity 250ms ease,
			transform 250ms ease;
	}

	.animate {
		animation: popupFadeIn 250ms ease-in-out;
	}

	@keyframes popupFadeIn {
		0% {
			transform: scale(0.99);
		}

		50% {
			transform: scale(1.02);
		}

		100% {
			transform: scale(1);
		}
	}
</style>

<script>
	import { Popup, LoadingSpinner } from "openguessr-ui";
	let { open = $bindable(false), src, wide = false, onclose, onuserclose } = $props();

	// Upwards reactivity via callback for ReportIframePopup.svelte to avoid a two-way bind Svelte issue #18404
	let wasOpen = false;

	$effect(() => {
		if (wasOpen && !open) onclose?.();
		wasOpen = open;
	});
</script>

<Popup frameless={true} {onuserclose} bind:open verySlim={!wide}>
	<div class="absolute-center">
		<LoadingSpinner style="opacity: 0.25;" />
	</div>
	<!-- svelte-ignore a11y_missing_attribute -->
	<iframe
		class="page-browser-iframe"
		allowtransparency="true"
		frameborder="0"
		{src}
		onload={(e) => (e.target.style.opacity = 1)}
	></iframe>
</Popup>

<style>
	.absolute-center {
		display: flex;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.page-browser-iframe {
		display: block; /* Inline iframes leave a gap below due to the line height, like other inline-by-default elements e.g. images*/
		width: 100%;
		height: min(800px, calc(100dvh - 75px - env(safe-area-inset-top) - env(safe-area-inset-bottom)));
		background: transparent;
		border-radius: 20px;
		opacity: 0;
		position: relative;
		z-index: 2;
	}
</style>

<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	let { open = $bindable(false), src, wide = false, onClose, onUserClose } = $props();

	// Upwards reactivity via callback for ReportIframePopup.svelte to avoid a two-way bind Svelte issue #18404
	let wasOpen = false;

	$effect(() => {
		if (wasOpen && !open) onClose?.();
		wasOpen = open;
	});
</script>

<Popup frameless={true} {onUserClose} bind:open verySlim={!wide}>
	<div class="absolute-center">
		<img src="/img/compass_spinner.png" alt="Loading" class="spinner" id="page-browser-loading" />
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
	#page-browser-loading {
		margin: 0;
		opacity: 0.25;
	}

	.absolute-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.page-browser-iframe {
		width: 100%;
		height: min(800px, calc(100dvh - 75px));
		background: transparent;
		border-radius: 20px;
		opacity: 0;
		position: relative;
		z-index: 2;
	}
</style>

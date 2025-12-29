<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	let { open = $bindable(false), src, wide = false } = $props();
</script>

<Popup z={971} frameless={true} bind:open verySlim={!wide}>
	<div class="absoluteCenter">
		<img src="/img/compass_spinner.png" alt="Loading" class="spinner" id="pageBrowserLoading" />
	</div>
	<!-- svelte-ignore a11y_missing_attribute -->
	<iframe class="pageBrowserIframe" allowtransparency="true" frameborder="0" {src}></iframe>
</Popup>

<style>
	#pageBrowserLoading {
		margin: 0;
		opacity: 0.25;
	}

	.absoluteCenter {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.pageBrowserIframe {
		width: 100%;
		height: min(800px, calc(100dvh - 75px));
		background: transparent;
		border-radius: 20px;
		position: relative;
		z-index: 2;
	}
</style>

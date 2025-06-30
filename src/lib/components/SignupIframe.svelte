<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { signupPopup } from "$lib/stores/uiStore";
	import { checkAuthenticationStatus } from "$lib/logic/accountLogic";

	if (typeof window !== "undefined") {
		window.onmessage = function (e) {
			try {
				const data = String(e.data); // Ensure data is a string

				switch (true) {
					case data === "close":
						$signupPopup = false;
						break;
					case data === "loadAccountStatus":
						checkAuthenticationStatus();
						break;
				}
			} catch (error) {
				console.error("Error processing window message: " + error);
			}
		};
	}
</script>

<Popup z={961} frameless={true} bind:open={$signupPopup} verySlim={true}>
	<div class="absoluteCenter">
		<img src="/img/compass_spinner.png" alt="Loading new streetview" class="spinner" id="pageBrowserLoading" />
	</div>
	<!-- svelte-ignore a11y_missing_attribute -->
	<iframe id="pageBrowserIframe" allowtransparency="true" frameborder="0" src="/signup"></iframe>
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

	#pageBrowserIframe {
		width: 100%;
		height: 800px;
		background: transparent;
		border-radius: 12px;
		position: relative;
		z-index: 2;
	}
</style>

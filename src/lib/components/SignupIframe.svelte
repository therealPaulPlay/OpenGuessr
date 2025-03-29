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

{#if $signupPopup}
	<Popup z={961} frameLess="true">
		<div id="browserIframeHolder">
			<div class="absoluteCenter">
				<img src="/img/compass_spinner.png" alt="Loading new streetview" class="spinner" id="pageBrowserLoading" />
			</div>
			<!-- svelte-ignore a11y_missing_attribute -->
			<iframe id="pageBrowserIframe" allowtransparency="true" frameborder="0" src="/signup"></iframe>
		</div>
	</Popup>
{/if}

<style>
	#browserIframeHolder {
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.2);
		position: relative;
	}

	#pageBrowserLoading {
		margin: 0;
		opacity: 0.15;
	}

	.absoluteCenter {
		position: absolute;
		top: 50%;
		left: 50%;
		opacity: 1;
		transform: translate(-50%, -50%);
	}

	#pageBrowserIframe {
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: transparent;
		outline: 5px solid rgba(75, 75, 75, 0.25);
		border-radius: 5px;
		position: relative;
		z-index: 2;
	}
</style>

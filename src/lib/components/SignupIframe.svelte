<script>
	import { signupPopup } from "$lib/stores/uiStore";
	import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
	import IframePopup from "./ui/IframePopup.svelte";

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

<IframePopup src="/signup" bind:open={$signupPopup} />

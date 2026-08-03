<script>
	import { signupPopup } from "$lib/stores/uiStore";
	import { checkAuthentication } from "$lib/logic/accountLogic";
	import IframePopup from "./ui/IframePopup.svelte";
	import { showNotification } from "$lib/utils/notifications";
	import { browser } from "$app/environment";
	import { postSignupAction } from "$lib/stores/context-specific/signupStore";

	if (browser) {
		window.onmessage = async function (e) {
			try {
				const data = String(e.data); // Ensure data is a string

				if (data === "close") {
					showNotification("You're now logged in.");
					checkAuthentication();
					$signupPopup = false;
				}
			} catch (error) {
				console.error("Error processing window message: " + error);
			}
		};
	}
</script>

<!-- Clearing the signup action only triggers when the user closed the popup, when it auto-closes due to signin it does not -->
<IframePopup src="/signup" bind:open={$signupPopup} onUserClose={() => postSignupAction.set()} />

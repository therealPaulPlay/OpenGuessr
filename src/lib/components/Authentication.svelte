<script>
	import { checkAuthentication, onAuthenticationUpdated } from "$lib/logic/accountLogic";
	import { attemptJoinViaLink } from "$lib/logic/multiplayerLogic";
	import { disconnectSSE, initializeSSEConnection } from "$lib/logic/sseLogic";
	import { selectedPinIndex } from "$lib/stores/accountStore";
	import { disableAutoAuthentication } from "$lib/stores/context-specific/platformSettingsStore";
	import { postSignupAction } from "$lib/stores/context-specific/signupStore";
	import { onMount } from "svelte";
	import { get } from "svelte/store";

	// Authenticate the user (ordered after components that might disable auto-auth)
	onMount(() => {
		// Register callbacks
		const unsubscribeFunctions = [
			onAuthenticationUpdated(attemptJoinViaLink),
			onAuthenticationUpdated((isAuthed) => {
				if (isAuthed) initializeSSEConnection();
				else disconnectSSE();
			}),
			onAuthenticationUpdated((isAuthed) => {
				if (isAuthed) new Image().src = "/img/pins/player_pin" + get(selectedPinIndex) + ".png";
				else new Image().src = "/img/pins/player_pin0.png";
			}),
			onAuthenticationUpdated(async (isAuthed) => {
				if (isAuthed) {
					try {
						await $postSignupAction?.(); // Optional callback passed to signupPrompt() to enable seamless click -> signup -> action flows
					} catch (error) {
						console.error("Error in post signup action:", error);
					}
				}
				postSignupAction.set(); // Reset (both when it ran, and when auth is false e.g. due to login failure)
			}),
		];

		// Check authentication state
		if (!get(disableAutoAuthentication)) checkAuthentication();

		return () => unsubscribeFunctions.forEach((u) => u());
	});
</script>

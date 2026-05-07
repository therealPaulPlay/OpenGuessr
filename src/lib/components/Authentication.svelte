<script>
	import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
	import { disableAutoAuthentication } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount } from "svelte";
	import { get } from "svelte/store";

    // Authenticate the user, ordered after components that might disable auto-auth
	onMount(() => {
		if (!get(disableAutoAuthentication)) checkAuthenticationStatus();
	});
</script>
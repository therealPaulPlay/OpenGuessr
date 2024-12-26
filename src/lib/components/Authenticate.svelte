<!-- this component solely authenticates the user -->
<script>
	import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
	import { disableAutoAuthentication } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount } from "svelte";
	import { get } from "svelte/store";

	onMount(() => {
		if (!get(disableAutoAuthentication)) checkAuthenticationStatus();
	});
</script>

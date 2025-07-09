<script>
	import { bugspotPopup } from "$lib/stores/uiStore";
	import IframePopup from "./ui/IframePopup.svelte";
</script>

<IframePopup src="https://bugspot.dev" bind:open={$bugspotPopup} />

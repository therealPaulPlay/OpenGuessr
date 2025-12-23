<script>
	import { chatArray, mobileChatLastOpenedMsgCount } from "$lib/stores/context-specific/multiplayerStore";
	import { chatMobilePopup } from "$lib/stores/uiStore";
	import Chat from "./Chat.svelte";
	import Popup from "./ui/Popup.svelte";

	$effect(() => {
		if ($chatMobilePopup)
			$mobileChatLastOpenedMsgCount = $chatArray?.filter((i) => i.username != "Server")?.length || 0;
	});
</script>

<Popup verySlim={true} bind:open={$chatMobilePopup}>
	<div class="chat-container">
		<Chat inPanel={false} />
	</div>
</Popup>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
		width: 100%;
		height: min(500px, calc(100dvh - 200px));
		overflow: hidden;
	}
</style>

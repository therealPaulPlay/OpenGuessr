<script>
	import { getTeamFromClientId } from "$lib/logic/multiplayerLogic";
	import { chatArray, mobileChatLastOpenedMsgCount, socket } from "$lib/stores/context-specific/multiplayerStore";
	import { chatMobilePopup } from "$lib/stores/uiStore";
	import { get } from "svelte/store";
	import Chat from "./Chat.svelte";
	import ChatTabSwitcher from "./ChatTabSwitcher.svelte";
	import Popup from "./ui/Popup.svelte";

	let isTeamChat = $state(false);

	$effect(() => {
		if ($chatMobilePopup) {
			$mobileChatLastOpenedMsgCount =
				$chatArray?.filter(
					(i) => i.username != "Server" && (i.teamIndex == null || i.teamIndex == getTeamFromClientId(get(socket)?.id)),
				)?.length || 0;
		}
	});
</script>

<Popup verySlim={true} bind:open={$chatMobilePopup}>
	<div class="chat-container">
		<ChatTabSwitcher inPanel={false} {isTeamChat} onChange={(value) => (isTeamChat = value)} />
		<Chat inPanel={false} {isTeamChat} />
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

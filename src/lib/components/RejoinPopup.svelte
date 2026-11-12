<script>
	import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
	import { rejoinRoomCode } from "$lib/stores/context-specific/multiplayerStore";
	import { rejoinPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { Popup, showErrorPopup } from "openguessr-ui";
</script>

<Popup verySlim={true} bind:open={$rejoinPopup}>
	<div class="popup-title">
		<h1>Disconnected</h1>
	</div>

	<p>
		You were disconnected from Multiplayer. Please re-establish an internet connection, then click <i>rejoin</i> to reconnect
		to the room.
	</p>

	<button
		class="standard-button popup-bottom-button large"
		onclick={() => {
			playSound("basic_button");
			if ($rejoinRoomCode) joinFromAnywhere($rejoinRoomCode, () => ($rejoinPopup = false));
			else
				showErrorPopup(
					"No rejoin room code",
					"The rejoin popup was shown without a valid rejoin room code. This should not happen.",
				);
		}}
	>
		Rejoin
	</button>
</Popup>

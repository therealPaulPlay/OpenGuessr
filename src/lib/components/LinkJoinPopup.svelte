<!-- This is being shown when joining a multiplayer round via a link. It displays the loading status and shows if joining is possible -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { linkJoinPopup } from "$lib/stores/uiStore";
	import { leaveMultiplayerRound } from "$lib/logic/multiplayerLogic";
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

<Popup verySlim={true} bind:open={$linkJoinPopup} onclose={leaveMultiplayerRound}>
	<div class="popup-title">
		<h1 id="socialHeader">Room</h1>
	</div>
	<p id="linkjoinStatus">Status: {$multiplayerStatus || "No status."}</p>
</Popup>

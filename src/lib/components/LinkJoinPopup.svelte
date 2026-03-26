<!-- This is being shown when joining a multiplayer round via a link. It displays the loading status and shows if joining is possible -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { linkJoinPopup } from "$lib/stores/uiStore";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
</script>

<Popup verySlim={true} bind:open={$linkJoinPopup} onclose={leaveMultiplayer}>
	<div class="popup-title">
		<h1 id="socialHeader">Room</h1>
	</div>
	<p>{$multiplayerStatus || "Loading..."}</p>
</Popup>

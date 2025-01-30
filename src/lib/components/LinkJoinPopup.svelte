<!-- This is being shown when joining a multiplayer round via a link. It displays the loading status and shows if joining is possible -->
<script>
	import Popup from "$lib/components/Popup.svelte";
	import { linkJoinPopup } from "$lib/stores/uiStore";
	import { leaveMultiplayerRound } from "$lib/logic/multiplayerLogic";
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

{#if $linkJoinPopup}
	<Popup verySlim="true">
		<div class="popup-title">
			<h1 id="socialHeader">Room</h1>
		</div>
		<p id="linkjoinStatus">Status: {$multiplayerStatus || "No status."}</p>
		<br />
		<button
			id="linkJoinClose"
			class="standardButton white closeButton"
			onclick={() => {
				linkJoinPopup.set(false);
				leaveMultiplayerRound();
				playSound("basic_button");
			}}>Cancel</button
		>
	</Popup>
{/if}

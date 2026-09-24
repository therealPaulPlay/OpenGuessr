<!-- This is being shown when joining a multiplayer round via a link. It displays the loading status and shows if joining is possible -->
<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { linkJoinPopup } from "$lib/stores/uiStore";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
	import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
</script>

<Popup verySlim={true} bind:open={$linkJoinPopup} onUserClose={leaveMultiplayer}>
	<div class="popup-title">
		<h1>Room</h1>
	</div>
	<TitleSeparator text="Status" />
	<div class="status-box">
		<p>{$multiplayerStatus || "Loading..."}</p>
	</div>
</Popup>

<style>
	.status-box {
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-sizing: border-box;
		width: 100%;
	}
</style>

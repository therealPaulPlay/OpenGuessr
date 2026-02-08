<script>
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import { findDuel } from "$lib/logic/matchmakingLogic";
	import { leaveMultiplayer } from "$lib/logic/multiplayerLogic";
</script>

<svelte:head>
	<title>Duel</title>
</svelte:head>

<div class="main-container">
	<div class="duelCenterBox">
		<MultiplayerMatchmakingDisplay findFunction={findDuel} cancelFunction={leaveMultiplayer} supportsSkillbased={true} />
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 50dvh;
	}

	.duelCenterBox {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
	}
</style>

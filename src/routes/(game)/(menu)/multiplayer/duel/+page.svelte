<script>
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import { findDuel, safeCancel } from "$lib/logic/matchmakingLogic";
</script>

<svelte:head>
	<title>Duel</title>
</svelte:head>

<div class="main-container">
	<div class="controls-area">
		<MultiplayerMatchmakingDisplay findFunction={findDuel} cancelFunction={safeCancel} showEloRange={true} />
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100dvh - var(--menu-padding-top) - var(--layout-margin) - env(safe-area-inset-top));
	}

	.controls-area {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
		margin-block: var(--layout-spacer);
	}
</style>

<script>
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import { findDuel, safeCancel } from "$lib/logic/matchmakingLogic";
	import { skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
	import InfoBanner from "$lib/components/InfoBanner.svelte";
</script>

<svelte:head>
	<title>Duel</title>
</svelte:head>

<div class="main-container">
	<div class="duel-center-box">
		{#if $skillBasedMatchmaking}
			<InfoBanner
				text="Division-based matchmaking has longer waiting times."
				inPage={true}
				style="max-width: 300px;"
			/>
		{/if}
		<MultiplayerMatchmakingDisplay findFunction={findDuel} cancelFunction={safeCancel} />
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 50dvh;
	}

	.duel-center-box {
		margin-top: auto;
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
	}
</style>

<script>
	import MultiplayerHostDisplay from "$lib/components/MultiplayerHostDisplay.svelte";
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import { createTeamDuelRoom } from "$lib/logic/matchmakingLogic";
	import { matchmakingActive } from "$lib/stores/context-specific/multiplayerStore";
	import { multiplayer } from "$lib/stores/modeStore";

	function startMatchmaking() {
		// TODO
		// Endpoint that moves players from various "team-duel" rooms so that a valid 2v2 is established
	}
</script>

<svelte:head>
	<title>2v2</title>
</svelte:head>

<div class="main-container">
	<div class="controls-area">
		{#if $multiplayer && !$matchmakingActive}
			<MultiplayerHostDisplay showOpenRoom={false} startFunction={startMatchmaking} />
		{:else}
			<MultiplayerMatchmakingDisplay supportsSkillbased={false} findFunction={createTeamDuelRoom} />
		{/if}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: calc(100dvh - 120px);
	}

	.controls-area {
		display: flex;
		align-items: center;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		gap: var(--layout-margin);
		margin-top: auto;
		margin-bottom: auto;
	}
</style>

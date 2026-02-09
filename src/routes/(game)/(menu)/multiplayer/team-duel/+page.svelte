<script>
	import { onDestroy } from "svelte";
	import MultiplayerHostDisplay from "$lib/components/MultiplayerHostDisplay.svelte";
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import { createTeamDuelRoom, startFind2v2, abortFind2v2, clearFind2v2Interval } from "$lib/logic/matchmakingLogic";
	import { matchmakingActive, participantCount } from "$lib/stores/context-specific/multiplayerStore";
	import { multiplayer } from "$lib/stores/modeStore";
	import { Info } from "@lucide/svelte";

	// Auto-start matchmaking when second player joins
	$effect(() => {
		if ($multiplayer && !$matchmakingActive && $participantCount >= 2) startFind2v2();
	});

	onDestroy(() => {
		clearFind2v2Interval();
	});
</script>

<svelte:head>
	<title>2v2</title>
</svelte:head>

<div class="main-container">
	<div class="controls-area">
		{#if $multiplayer && !$matchmakingActive}
			<div class="info-container">
				<Info strokeWidth={2.25} color="white" style="opacity: 50%; margin-right: var(--panel-margin); margin-left: 2px; min-width: 24px;" />
				<p>Invite a friend, or press start to search for both a teammate and opponents.</p>
			</div>
			<MultiplayerHostDisplay showOpenRoom={false} startFunction={startFind2v2} />
		{:else}
			<MultiplayerMatchmakingDisplay
				showSkillbasedInfo={false}
				findFunction={createTeamDuelRoom}
				cancelFunction={abortFind2v2}
			/>
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

	.info-container {
		display: flex;
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		gap: 5px;
        box-sizing: border-box;
        width: 100%;
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
	}
</style>

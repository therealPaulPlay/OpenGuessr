<script>
	import { onDestroy } from "svelte";
	import MultiplayerHostDisplay from "$lib/components/MultiplayerHostDisplay.svelte";
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import {
		createTeamDuelRoom,
		startFindTeamDuel,
		abortFindTeamDuel,
		clearFindTeamDuelInterval,
	} from "$lib/logic/matchmakingLogic";
	import {
		matchmakingActive,
		matchmakingHosting,
		participantCount,
	} from "$lib/stores/context-specific/multiplayerStore";
	import { Info } from "@lucide/svelte";

	onDestroy(() => {
		clearFindTeamDuelInterval();
	});
</script>

<svelte:head>
	<title>2v2</title>
</svelte:head>

<div class="main-container">
	<div class="controls-area">
		{#if !$matchmakingActive && $matchmakingHosting}
			<div class="info-container">
				<Info
					strokeWidth={2.25}
					color="white"
					style="opacity: 50%; margin-right: var(--panel-margin); margin-left: 2px; flex-shrink: 0;"
				/>
				<p>When starting solo, you'll be paired with a random teammate.</p>
			</div>
			<MultiplayerHostDisplay
				showOpenRoom={false}
				startFunction={startFindTeamDuel}
				startDisabledCondition={$participantCount > 2}
			/>
		{:else}
			<MultiplayerMatchmakingDisplay
				showSkillbasedInfo={false}
				findFunction={createTeamDuelRoom}
				cancelFunction={abortFindTeamDuel}
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
		gap: var(--content-margin);
		box-sizing: border-box;
		width: 100%;
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
	}
</style>

<script>
	import MultiplayerMatchmakingDisplay from "$lib/components/MultiplayerMatchmakingDisplay.svelte";
	import { findDuel, safeCancel } from "$lib/logic/matchmakingLogic";
	import { skillBasedMatchmaking } from "$lib/stores/context-specific/multiplayerStore";
	import { slide } from "svelte/transition";
	import { Info } from "@lucide/svelte";
</script>

<svelte:head>
	<title>Duel</title>
</svelte:head>

<div class="main-container">
	<div class="duel-center-box">
		{#if $skillBasedMatchmaking}
			<div class="info-container" transition:slide>
				<Info
					strokeWidth={2.25}
					size={22}
					color="white"
					style="opacity: 50%; margin-right: var(--panel-margin); margin-left: 2px; margin-bottom: -2px; flex-shrink: 0;"
				/>
				<p>Division-based matchmaking has longer waiting times.</p>
			</div>
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

	.info-container {
		display: flex;
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		gap: var(--content-margin);
		max-width: 300px;
		margin-bottom: var(--box-margin);
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
	}
</style>

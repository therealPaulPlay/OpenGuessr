<script>
	import { selectedTournament, tournamentMatchResultsIndex } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentMatchResultsPopup } from "$lib/stores/uiStore";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import Popup from "./ui/Popup.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
</script>

<Popup verySlim={true} bind:open={$tournamentMatchResultsPopup}>
	<div class="popup-title">
		<h1>Match {$tournamentMatchResultsIndex + 1}</h1>
	</div>
	<TitleSeparator
		text="Ascended ({$selectedTournament?.matches?.[$tournamentMatchResultsIndex]?.ascendedPlayers?.length})"
	/>
	{#each $selectedTournament?.matches?.[$tournamentMatchResultsIndex]?.ascendedPlayers as player}
		<div class="player-item">
			<button
				class="hover-text"
				onclick={() => {
					loadProfileFromId(player.id);
				}}>{player.username} <span class="score-span">{player.score?.toLocaleString()}</span></button
			>
		</div>
	{/each}
	<TitleSeparator
		text="Eliminated ({$selectedTournament?.matches?.[$tournamentMatchResultsIndex]?.eliminatedPlayers?.length})"
	/>
	{#each $selectedTournament?.matches?.[$tournamentMatchResultsIndex]?.eliminatedPlayers as player}
		<div class="player-item">
			<button
				class="hover-text"
				onclick={() => {
					loadProfileFromId(player.id);
				}}>{player.username} <span class="score-span">{player.score?.toLocaleString()}</span></button
			>
		</div>
	{/each}
</Popup>

<style>
	.player-item {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		box-sizing: border-box;
		padding: var(--content-margin);
		margin-bottom: var(--box-margin);
	}

	.score-span {
		opacity: 0.5 !important;
	}

	.hover-text {
		transition: opacity 250ms ease;
		cursor: pointer;
		overflow: hidden;
		text-wrap: nowrap;
		text-overflow: ellipsis;
		max-width: 80%;
	}

	.hover-text:hover {
		opacity: 50%;
	}
</style>

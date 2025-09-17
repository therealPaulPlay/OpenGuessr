<script>
	import { selectedTournament, tournamentMatchResultsIndex } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentMatchResultsPopup } from "$lib/stores/uiStore";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import Popup from "./ui/Popup.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";

	let eliminatedPlayers = $derived.by(() => {
		if ($tournamentMatchResultsIndex == 0) {
			return $selectedTournament?.initialPlayers?.filter(
				(i) => !$selectedTournament.matches?.[$tournamentMatchResultsIndex]?.ascendedPlayers?.some((e) => e.id == i.id),
			);
		} else {
			return $selectedTournament.matches?.[$tournamentMatchResultsIndex - 1]?.ascendedPlayers?.filter(
				(i) => !$selectedTournament.matches?.[$tournamentMatchResultsIndex]?.ascendedPlayers?.some((e) => e.id == i.id),
			);
		}
	});
</script>

<Popup verySlim={true} bind:open={$tournamentMatchResultsPopup}>
	<div class="popup-title">
		<h1>Match {$tournamentMatchResultsIndex + 1}</h1>
	</div>
	<TitleSeparator
		text="Ascended ({$selectedTournament.matches?.[$tournamentMatchResultsIndex]?.ascendedPlayers?.length})"
	/>
	{#each $selectedTournament.matches?.[$tournamentMatchResultsIndex]?.ascendedPlayers as player}
		<div class="player-item">
			<button
				class="hover-text"
				onclick={() => {
					loadProfileFromId(player.id);
				}}>{player.username}</button
			>
		</div>
	{/each}
	<TitleSeparator text="Eliminated ({eliminatedPlayers?.length})" />
	{#each eliminatedPlayers as player}
		<div class="player-item">
			<button
				class="hover-text"
				onclick={() => {
					loadProfileFromId(player.id);
				}}>{player.username}</button
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
		padding: 5px;
		margin-bottom: var(--box-margin);
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

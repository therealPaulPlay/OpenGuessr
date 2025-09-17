<script>
	import { selectedTournament } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentInfoPopup } from "$lib/stores/uiStore";
	import { Info } from "lucide-svelte";
	import Popup from "./ui/Popup.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";

	let readableDate = $derived.by(() => {
		const date = new Date($selectedTournament.date).toLocaleString("en-US", {
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
		return date;
	});
</script>

<Popup bind:open={$tournamentInfoPopup} slim={true}>
	<div class="popup-title">
		<h1>{$selectedTournament.name || "Default title"}</h1>
	</div>
	<div class="info-area">
		<div class="info-field">
			<p class="info-title">Start date</p>
			<p>{readableDate}</p>
		</div>
		<div class="info-field">
			<p class="info-title">Pre-saves</p>
			<p>{$selectedTournament.saves?.toLocaleString()}</p>
		</div>
		<div class="info-field">
			<p class="info-title">Prize</p>
			<p>{$selectedTournament.prize}</p>
		</div>
		<div
			class="info-field"
			class:info-field-pulse={$selectedTournament.status == "ongoing" || $selectedTournament.status == "starting"}
		>
			<p class="info-title">Status</p>
			<p>{$selectedTournament.status?.slice(0, 1)?.toUpperCase() + $selectedTournament.status?.slice(1)}</p>
		</div>
	</div>
	<TitleSeparator text="Match results" class="tournament-divider-margin" />
	<div class="info-container warnInfo">
		<Info color="white" strokeWidth={2} class="info-icon-circular" />
		<p>
			Tournaments consist of multiple matches, with the top half of players advancing each round until a grand finale
			determines the winner.
		</p>
	</div>
	<div class="match-box">
		{#if $selectedTournament.matches?.length}
			{#each $selectedTournament.matches as match, index}
				<div class="match-entry">
					<p>Match {index + 1}</p>
				</div>
			{/each}
		{:else}
			<p class="nothing-text">Match results are not yet available.</p>
		{/if}
	</div>
</Popup>

<style>
	.info-area {
		display: flex;
		gap: var(--box-margin);
		flex-wrap: wrap;
		max-width: 100%;
		box-sizing: border-box;
	}

	.match-entry {
		width: 100%;
		box-sizing: border-box;
		border-radius: 5px;
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		background-color: var(--box-color);
	}

	:global(.tournament-divider-margin) {
		margin-top: 25px !important;
	}

	.match-box {
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		margin-top: var(--layout-margin);
		padding: var(--box-margin);
		gap: var(--box-margin);
	}

	:global(.info-icon-circular) {
		margin-right: auto;
		margin-bottom: 5px;
		width: 25px;
		height: 25px;
		opacity: 0.5;
		margin-inline: 3px;
	}

	.info-container {
		display: flex;
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		width: 100%;
		box-sizing: border-box;
		border-radius: var(--box-margin);
		align-items: center;
		background-color: var(--box-color);
		margin-top: var(--layout-margin);
		gap: 5px;
		flex-wrap: wrap;
	}

	.info-container p {
		opacity: 0.5;
		flex-grow: 100;
	}

	.info-field {
		display: flex;
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		flex-direction: column;
		padding: var(--box-margin);
		text-wrap: nowrap;
		box-sizing: border-box;
		max-width: 100%;
		flex-grow: 1;
	}

    .info-field-pulse {
        animation: info-fade 2s infinite;
    }

	@keyframes info-fade {
		0% {
			background-color: var(--box-color);
		}
		50% {
			background-color: rgba(255, 255, 255, 0.15);
		}
	}

	.info-field p {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.info-title {
		opacity: 0.5;
		font-size: 20px;
	}

	.nothing-text {
		opacity: 0.5;
		text-align: center;
	}
</style>

<script>
	import { selectedTournamentId, tournamentData } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentInfoPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { fetchTournaments } from "$lib/utils/tournamentUtils";
	import { CalendarCheck2, Clock, Info, Medal, Ticket } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import Chip from "./ui/Chip.svelte";
	import Drawer from "./ui/Drawer.svelte";

	let noTournamentsText = $state("No tournaments scheduled.");
	let showOlder = $state(false);

	onMount(async () => {
		const error = await fetchTournaments();
		if (error) noTournamentsText = "Error: " + error;
	});
</script>

{#snippet tournamentItem(tournament)}
	{const readableDate = $derived(
		new Date(tournament.date).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		}),
	)}

	<div class="tournament-box">
		<div class="tournament-name-box">
			<h3 class="tournament-name-title">
				{tournament.name}{#if tournament.status == "ongoing"}
					<Chip text="Ongoing" red={true} italic={true} mutedOpacity={false} class="status-chip" />
				{:else if tournament.status == "starting"}
					<Chip text="Enter now" red={true} italic={true} mutedOpacity={false} class="status-chip" />
				{/if}
			</h3>
		</div>
		<div class="tournament-field">
			<Clock style="margin-top: 1px; opacity: 0.75;" strokeWidth={1.75} />
			<p>{readableDate}</p>
		</div>
		<div class="tournament-field">
			<CalendarCheck2 style="opacity: 0.75;" strokeWidth={1.75} />
			<p>{tournament.saves?.toLocaleString()}</p>
		</div>
		<div class="tournament-field">
			<Medal style="margin-top: 1px; opacity: 0.75;" strokeWidth={1.5} />
			<p>{tournament.prize}</p>
		</div>
		<button
			class="tournament-field-button standard-button {tournament.status == 'starting' ? '' : 'white'}"
			{@attach tooltip({ text: "Details" })}
			onclick={() => {
				playSound("basic_button");
				$selectedTournamentId = tournament.id;
				$tournamentInfoPopup = true;
			}}
		>
			{#if tournament.status != "finished" && tournament.status != "ongoing"}
				<Ticket strokeWidth={1.75} style="margin-bottom: -4px;" />
			{:else}
				<Info strokeWidth={1.75} style="margin-bottom: -3px;" />
			{/if}
		</button>
	</div>
{/snippet}

<div class="tournaments-container" class:container-min-height={!$tournamentData?.length}>
	{#if $tournamentData?.length}
		<div transition:blur class="inner-tournaments-container">
			{#each $tournamentData?.filter((i) => i.status !== "finished") as tournament (tournament.id)}
				{@render tournamentItem(tournament)}
			{/each}
		</div>
	{:else}
		<p class="no-tournaments-text">{noTournamentsText}</p>
	{/if}
</div>

<Drawer title="Recently finished" bind:isOpen={showOlder} hasBottomLayoutMargin={false}>
	<div class="tournament-scroll-container of-top of-bottom">
		{#each $tournamentData?.filter((i) => i.status === "finished") as tournament (tournament.id)}
			{@render tournamentItem(tournament)}
		{/each}
	</div>
</Drawer>

<style>
	.tournaments-container {
		position: relative;
		width: calc(100% - 20px);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		box-shadow: var(--panel-shadow);
		padding: var(--box-margin);
	}

	.tournament-scroll-container {
		max-height: 185px;
		overflow-y: auto;
		gap: var(--box-margin);
		display: flex;
		justify-content: safe center;
		align-items: safe center;
		flex-direction: column;
		box-sizing: border-box;
		scrollbar-width: none;
		width: 100%;
	}

	.inner-tournaments-container {
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		width: 100%;
	}

	.container-min-height {
		min-height: 80px;
	}

	.tournament-name-box {
		mask-image: linear-gradient(to right, black 90%, transparent 100%);
		flex-grow: 2;
	}

	.tournament-name-title {
		margin-right: auto;
		margin-left: var(--content-margin);
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.tournament-box {
		padding: var(--box-margin);
		display: flex;
		justify-content: space-between;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		gap: var(--box-margin);
		align-items: center;
		flex-wrap: wrap;
		box-sizing: border-box;
		width: 100%;
	}

	:global(.status-chip) {
		margin-left: var(--panel-margin);
	}

	.tournament-field {
		border-radius: var(--content-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		padding: var(--panel-margin);
		display: flex;
		color: white;
		gap: var(--panel-margin);
		padding-inline: var(--box-margin);
		text-wrap: nowrap;
		max-width: 100%;
		box-sizing: border-box;
	}

	.tournament-field p {
		text-overflow: ellipsis;
		overflow: hidden;
		opacity: 0.75;
	}

	.tournament-field-button {
		height: 43px;
		margin-left: auto;
	}

	.no-tournaments-text {
		opacity: 0.5;
		text-align: center;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	@media (max-width: 1200px) {
		.tournament-field {
			flex-grow: 1;
		}
	}
</style>

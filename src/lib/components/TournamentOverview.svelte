<script>
	import { selectedTournamentId, tournamentData } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentInfoPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip";
	import { fetchTournaments } from "$lib/utils/tournamentUtils";
	import { CalendarCheck2, Clock, Info, Medal, Ticket } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import Drawer from "./ui/Drawer.svelte";

	let noTournamentsText = $state("No tournaments scheduled.");
	let showOlder = $state(false);

	onMount(async () => {
		const error = await fetchTournaments();
		if (error) noTournamentsText = "Error: " + error;
	});
</script>

{#snippet tournamentItem(tournament)}
	{@const readableDate = new Date(tournament.date).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	})}

	<div class="tournamentBox">
		<div class="tournamentNameBox">
			<h3 class="tournamentNameTitle">
				{tournament.name}{#if tournament.status == "ongoing"}
					<span class="ongoingBadge">Ongoing</span>
				{:else if tournament.status == "starting"}
					<span class="ongoingBadge">Enter now</span>
				{/if}
			</h3>
		</div>
		<div class="tournamentField">
			<Clock style="margin-top: 1px; opacity: 0.75;" strokeWidth={1.75} />
			<p>{readableDate}</p>
		</div>
		<div class="tournamentField">
			<CalendarCheck2 style="opacity: 0.75;" strokeWidth={1.75} />
			<p>{tournament.saves?.toLocaleString()}</p>
		</div>
		<div class="tournamentField">
			<Medal style="margin-top: 1px; opacity: 0.75;" strokeWidth={1.5} />
			<p>{tournament.prize}</p>
		</div>
		<button
			class="tournamentFieldButton standardButton {tournament.status == 'starting' ? '' : 'white'}"
			use:tooltip={{ text: "Details" }}
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

<div class="tournamentsContainer" class:containerMinHeight={!$tournamentData?.length}>
	{#if $tournamentData?.length}
		<div transition:blur class="innerTournamentsContainer">
			{#each $tournamentData?.filter((i) => i.status !== "finished") as tournament (tournament.id)}
				{@render tournamentItem(tournament)}
			{/each}
		</div>
	{:else}
		<p class="noTournamentsText">{noTournamentsText}</p>
	{/if}
</div>

<Drawer title="Recently finished" bind:isOpen={showOlder}>
	<div class="tournamentScrollContainer of-top of-bottom">
		{#each $tournamentData?.filter((i) => i.status === "finished") as tournament (tournament.id)}
			{@render tournamentItem(tournament)}
		{/each}
	</div>
</Drawer>

<style>
	.tournamentsContainer {
		position: relative;
		width: calc(100% - 20px);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
	}

	.tournamentScrollContainer {
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

	.innerTournamentsContainer {
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		width: 100%;
	}

	.containerMinHeight {
		min-height: 80px;
	}

	.tournamentNameBox {
		mask-image: linear-gradient(to right, black 90%, transparent 100%);
		flex-grow: 2;
	}

	.tournamentNameTitle {
		margin-right: auto;
		margin-left: var(--content-margin);
		margin-left: var(--box-margin);
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.tournamentBox {
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

	.ongoingBadge {
		padding-inline: var(--content-margin);
		border-radius: 3px;
		background-color: var(--brand-color);
		box-shadow: var(--bulb-shadow);
		font-size: 20px;
		margin-bottom: 2px;
		margin-left: var(--panel-margin);
	}

	.tournamentField {
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

	.tournamentField p {
		text-overflow: ellipsis;
		overflow: hidden;
		opacity: 0.75;
	}

	.tournamentFieldButton {
		height: 43px;
		margin-left: auto;
	}

	.noTournamentsText {
		opacity: 0.5;
		text-align: center;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	@media (max-width: 1200px) {
		.tournamentField {
			flex-grow: 1;
		}
	}
</style>

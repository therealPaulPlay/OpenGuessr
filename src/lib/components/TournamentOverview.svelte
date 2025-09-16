<script>
	import { Clock, Medal, Ticket, Tickets, Users } from "lucide-svelte";

	// !TODO: Fetch tournament data
	let tournamentData = $state([
		{
			name: "Weekend tournament",
			date: "2025-09-26 16:00:00",
			entered: 239,
			prize: "500 tokens",
		},
		{
			name: "Fun tournament",
			date: "2025-10-02 16:00:00",
			entered: 239,
			prize: "Supporter Tier 1",
		},
	]);
</script>

<div class="tournamentsContainer">
	{#if tournamentData.length}
		{#each tournamentData as tournament}
			{@const readableDate = new Date(tournament.date).toLocaleString("en-US", {
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			})}

			<div class="tournamentBox">
				<h3 class="tournamentNameTitle">{tournament.name}</h3>
				<div class="tournamentField">
					<Clock style="margin-top: 1px; opacity: 0.75;" />
					<p>{readableDate}</p>
				</div>
				<div class="tournamentField">
					<Users style="opacity: 0.75;" />
					<p>{tournament.entered} players</p>
				</div>
				<div class="tournamentField">
					<Medal style="margin-top: 1px; opacity: 0.75;" />
					<p>{tournament.prize}</p>
				</div>
				<button class="tournamentFieldButton standardButton white">
					<Ticket strokeWidth={1.75} style="margin-bottom: -4px;" />
				</button>
			</div>
		{/each}
	{:else}
		<p class="noTournamentsText">No tournaments scheduled.</p>
	{/if}
</div>

<style>
	.tournamentsContainer {
		position: relative;
		width: calc(100% - 20px);
		min-height: 80px;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		padding: var(--box-margin);
		gap: var(--box-margin);
	}

	.tournamentNameTitle {
		margin-right: auto;
		margin-left: var(--box-margin);
		mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%);
		text-overflow: ellipsis;
		text-wrap: nowrap;
		flex-grow: 10;
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
	}

	.tournamentField {
		border-radius: 5px;
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		padding: var(--panel-margin);
		display: flex;
		color: white;
		gap: var(--panel-margin);
		padding-inline: var(--box-margin);
		text-wrap: nowrap;
		flex-grow: 1;
		max-width: 100%;
		box-sizing: border-box;
	}

	.tournamentField p {
		text-overflow: ellipsis;
		overflow: hidden;
		opacity: 0.75;
	}

	.tournamentFieldButton {
		padding-inline: 20px;
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
</style>

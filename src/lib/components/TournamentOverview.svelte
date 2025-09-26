<script>
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { selectedTournamentId, tournamentData } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentInfoPopup } from "$lib/stores/uiStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { playSound } from "$lib/utils/soundManager";
	import { tooltip } from "$lib/utils/tooltip";
	import { fetchTournaments } from "$lib/utils/tournamentUtils";
	import { AlertCircle, ChevronDown, Clock, Info, Medal, Ticket, Tickets, Users } from "lucide-svelte";
	import { onMount } from "svelte";
	import { blur, slide } from "svelte/transition";

	let noTournamentsText = $state("No tournaments scheduled.");
	let showOlder = $state(false);

	onMount(async () => {
		const error = await fetchTournaments();
		if (error) noTournamentsText = "Error: " + error;
	});
</script>

{#snippet tournamentItem(tournament)}
	{@const readableDate = new Date(tournament.date).toLocaleString("en-US", {
		month: "long",
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
			<p>{tournament.status == "finished" ? "Finished" : readableDate}</p>
		</div>
		<div class="tournamentField">
			<Users style="opacity: 0.75;" strokeWidth={1.75} />
			<p>{tournament.saves?.toLocaleString()} calendar saves</p>
		</div>
		<div class="tournamentField">
			<Medal style="margin-top: 1px; opacity: 0.75;" strokeWidth={1.5} />
			<p>{tournament.prize}</p>
		</div>
		<button
			class="tournamentFieldButton standardButton {tournament.status == 'starting' ? '' : 'white'}"
			use:tooltip={{ text: "View details" }}
			onclick={() => {
				playSound("basic_button");
				$selectedTournamentId = tournament.id;
				if (!$isAuthenticated) return signupPrompt();
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

<div class="tournamentsContainer">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="toggleFinishedBar"
		role="button"
		tabindex={0}
		onclick={() => {
			playSound("floating_button");
			showOlder = !showOlder;
		}}
	>
		<p style:margin-left="var(--panel-margin)">Finished tournaments</p>
		<div class="viewOlderIcon">
			<ChevronDown
				style="margin-bottom: -4px; transition: transform 250ms ease; {showOlder ? 'transform: rotate(180deg)' : ''}"
			/>
		</div>
	</div>
	{#if showOlder}
		<div transition:slide={{ duration: 250 }} class="innerTournamentsContainer" style:margin-top={"var(--box-margin)"}>
			{#each $tournamentData?.filter((i) => i.status === "finished") as tournament (tournament.id)}
				{@render tournamentItem(tournament)}
			{/each}
		</div>
	{/if}
</div>

<style>
	.toggleFinishedBar {
		display: flex;
		width: 100%;
		gap: var(--box-margin);
		transition: opacity 250ms ease;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}

	.viewOlderIcon {
		color: white;
		padding: 5px;
		padding-inline: var(--panel-margin);
	}

	.toggleFinishedBar:hover {
		opacity: 0.5;
	}

	.tournamentsContainer {
		position: relative;
		width: calc(100% - 20px);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
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
		min-width: 33%;
	}

	.tournamentNameTitle {
		margin-right: auto;
		margin-left: 5px;
		mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%);
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
	}

	.ongoingBadge {
		padding-inline: 5px;
		border-radius: 3px;
		background-color: var(--brand-color);
		box-shadow: var(--bulb-shadow);
		font-size: 20px;
		margin-bottom: 2px;
		margin-left: var(--panel-margin);
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

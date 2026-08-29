<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { divisionMatchHistoryPopup, matchOverviewPopup } from "$lib/stores/uiStore";
	import { historyForUserId, matchData } from "$lib/stores/context-specific/divisionMatchHistoryStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { showProfile } from "$lib/utils/showProfile";
	import { ArrowLeft, ArrowRight, Info } from "@lucide/svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { playSound } from "$lib/utils/soundManager";
	import Chip from "./ui/Chip.svelte";
	import { get } from "svelte/store";
	import { untrack } from "svelte";

	// Local state variables
	let matchEntries = $state([]);
	let currentPage = $state(1);
	let currentFilterId = $state();
	let filterInput = $state();

	const limit = 50; // must match the backend limit

	// Fetch duel entries for the current page.
	async function fetchEntries() {
		matchEntries = null;
		try {
			currentFilterId = get(historyForUserId); // Get instead of $ to avoid triggering update causing a reactivity loop

			const response = await fetch(
				$apiUrl +
					`/divisions/duel-history?page=${currentPage}` +
					(get(historyForUserId) ? `&id=${get(historyForUserId)}` : ""),
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				// Expecting data.duels to be an array.
				if (data.duels && data.duels.length > 0) {
					matchEntries = data;
				} else {
					// No entries on this page; we use an empty array.
					matchEntries = { duels: [] };
				}
			} else {
				console.error("Error loading history: " + response.status);
				errorPopup(
					"Error loading history",
					"An error occurred loading matches in the division history popup.",
					response.status,
				);
			}
		} catch (error) {
			console.error("Fetch/Network error occurred while loading match results: ", error);
			errorPopup(
				"Error loading history (Network)",
				"A network error occurred loading matches in the duel history popup.",
				error,
			);
		}
	}

	// Re-fetch whenever the expected user ID is changed (or set to the same val again) when the popup is open
	$effect(() => {
		$historyForUserId;
		if ($divisionMatchHistoryPopup) {
			untrack(() => {
				filterInput = get(historyForUserId); // Sync filter input to store
				currentPage = 1; // Reset cur page
				fetchEntries();
			});
		} else matchEntries = null;
	});

	async function openMatchOverview(uuid) {
		matchData.set(null);
		$matchOverviewPopup = true;
		try {
			const response = await fetch($apiUrl + `/divisions/duel-rounds/${uuid}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			if (!response.ok) throw new Error(response.status);
			matchData.set(await response.json());
		} catch (error) {
			$matchOverviewPopup = false;
			console.error("Error loading match:", error);
			errorPopup("Error loading match", "An error occurred loading the match overview.", error.message);
		}
	}
</script>

<Popup z={960} slim={true} bind:open={$divisionMatchHistoryPopup}>
	<div class="popup-title">
		<h1>Duel history</h1>
	</div>
	<div class="top-popup-flex">
		<div class="filter-box">
			<p>Filter: user-</p>
			<input
				placeholder="all"
				class="filter-input"
				bind:value={filterInput}
				onchange={() => ($historyForUserId = filterInput === "" ? null : filterInput)}
			/>
		</div>
	</div>
	<div class="history-box">
		<div class="history-box-scroll of-top of-bottom">
			{#if !matchEntries}
				<p class="player-search-error">Loading...</p>
			{:else if matchEntries.duels && matchEntries.duels.length > 0}
				{#each matchEntries.duels as entry}
					<div class="match-history-item-container">
						<div
							class="match-history-item of-left of-right"
							class:your-match={!currentFilterId &&
								(entry.player1?.id == localStorage.getItem("id") || entry.player2?.id == localStorage.getItem("id"))}
						>
							<div class="player-info">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<span class="player-name" role="button" tabindex="0" onclick={() => showProfile(entry.player1.id)}>
									{entry.player1?.name}
								</span>
								<span class="player-status">
									{entry.player1?.won ? "W" : entry.player2?.won ? "L" : "D"}
								</span>
							</div>
							<span class="vs">vs.</span>
							<div class="player-info">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<span class="player-name" role="button" tabindex="0" onclick={() => showProfile(entry.player2?.id)}>
									{entry.player2?.name}
								</span>
								<span class="player-status">
									{entry.player2?.won ? "W" : entry.player1?.won ? "L" : "D"}
								</span>
							</div>
						</div>
						<div class="elo-info">
							<p style:padding-right="2px">
								{#if entry.eloChange != null}
									{#if entry.player1?.id == currentFilterId || entry.player2?.id == currentFilterId}
										{(entry.player1?.won && entry.player1?.id == currentFilterId) ||
										(entry.player2?.won && entry.player2?.id == currentFilterId)
											? "+"
											: "-"}
									{:else}
										+/-
									{/if}
								{/if}
								{entry.eloChange ?? "N/A"}
								{#if entry.eloChange != null}Elo{/if}
								{#if entry.refunded}
									<Chip text="Refunded" style="margin-left: var(--content-margin)" />
								{/if}
							</p>
							<button
								class="standard-button dark info-button"
								aria-label="Match overview"
								onclick={() => {
									playSound("basic_button");
									openMatchOverview(entry.uuid);
								}}
							>
								<Info size={20} strokeWidth={2.25} />
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<p class="player-search-error">No recent duels.</p>
			{/if}
		</div>
	</div>

	<div class="pagination-controls">
		<button
			class="standard-button white"
			onclick={() => {
				playSound("basic_button");
				currentPage -= 1;
				fetchEntries();
			}}
			disabled={currentPage === 1}
		>
			<ArrowLeft size={20} strokeWidth={2} />
		</button>
		<span class="page-counter">{currentPage}</span>
		<button
			class="standard-button white"
			onclick={() => {
				playSound("basic_button");
				currentPage += 1;
				fetchEntries();
			}}
			disabled={!(matchEntries && matchEntries.duels && matchEntries.duels.length === limit)}
		>
			<ArrowRight size={20} strokeWidth={2} />
		</button>
	</div>
</Popup>

<style>
	.player-search-error {
		opacity: 0.5;
		font-size: 22px;
		text-align: center;
		margin-bottom: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.match-history-item-container {
		display: flex;
		gap: var(--box-margin);
		width: 100%;
	}

	.elo-info {
		border-radius: var(--content-margin);
		box-shadow: var(--box-shadow);
		padding: var(--content-margin);
		padding-inline: var(--panel-margin);
		display: flex;
		background-color: var(--box-color);
		text-wrap: nowrap;
		gap: var(--box-margin);
		box-sizing: border-box;
	}

	.elo-info p {
		align-self: center;
	}

	.filter-input {
		border-radius: var(--content-margin);
		max-width: 65px;
		padding-inline: var(--box-margin);
	}

	.filter-box {
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		max-width: fit-content;
		background-color: var(--box-color);
		display: flex;
		gap: var(--content-margin);
		justify-content: center;
		align-items: center;
		flex-grow: 1;
	}

	.filter-box p {
		color: rgba(255, 255, 255, 0.5);
	}

	.top-popup-flex {
		display: flex;
		flex-wrap: wrap;
		gap: var(--layout-margin);
	}

	.history-box {
		position: relative;
		box-shadow: var(--box-shadow);
		width: calc(100% - 20px);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		margin-top: var(--layout-margin);
		padding: var(--box-margin);
	}

	.history-box-scroll {
		gap: var(--box-margin);
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
		overflow-y: auto;
		scrollbar-width: none;
		height: min(525px, calc(100dvh - 350px));
		min-height: 150px;
		width: 100%;
	}

	.page-counter {
		padding: var(--content-margin);
		box-shadow: var(--box-shadow);
		user-select: none;
		padding-inline: var(--box-margin);
		border-radius: var(--content-margin);
		min-width: 50px;
		text-align: center;
		background-color: var(--box-color);
		font-size: 22px;
	}

	.match-history-item {
		display: flex;
		box-shadow: var(--box-shadow);
		gap: var(--box-margin);
		padding: var(--content-margin) 15px;
		border-radius: var(--content-margin);
		justify-content: space-between;
		transition: background-color 250ms ease;
		background-color: var(--box-color);
		flex-grow: 1;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.your-match {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
	}

	.player-name {
		cursor: pointer;
		transition: opacity 250ms ease;
		max-width: 200px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.player-name:hover {
		opacity: 0.5;
	}

	.player-status {
		opacity: 0.75;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vs {
		align-self: center;
		box-shadow: var(--bulb-shadow);
		margin: var(--content-margin) 0;
		border-radius: var(--content-margin);
		padding-inline: var(--content-margin);
		background-color: var(--box-color);
	}

	.pagination-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--layout-margin);
		margin-top: var(--layout-margin);
	}

	.pagination-controls button {
		padding: var(--content-margin) var(--box-margin);
	}

	.info-button {
		display: flex;
		align-items: center;
		justify-content: center;
		height: calc(100% - var(--panel-margin));
		margin-top: auto;
		margin-bottom: auto;
		padding: var(--panel-margin);
	}
</style>

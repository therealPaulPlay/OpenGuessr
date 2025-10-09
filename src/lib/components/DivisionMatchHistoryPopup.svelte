<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { divisionMatchHistoryPopup } from "$lib/stores/uiStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { onMount } from "svelte";
	import { ArrowLeft, ArrowRight } from "lucide-svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

	// local state variables
	let matchResults = $state([]);
	let currentPage = $state(1);
	const limit = 50; // must match the backend limit

	let filterId = $state();
	let currentFilterId = $state();

	// Fetch duel entries for the current page.
	async function fetchEntries() {
		matchResults = undefined;
		try {
			currentFilterId = filterId;

			const response = await fetch(
				$apiUrl + `/divisions/duel-history?page=${currentPage}` + (filterId ? `&id=${filterId}` : ""),
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
					matchResults = data;
				} else {
					// No entries on this page; we use an empty array.
					matchResults = { duels: [] };
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

	divisionMatchHistoryPopup.subscribe((value) => {
		if (value) {
			filterId = localStorage.getItem("id") || null;
			fetchEntries();
		}
	});

	// Handlers for pagination
	function prevPage() {
		if (currentPage > 1) {
			currentPage -= 1;
			fetchEntries();
		}
	}

	function nextPage() {
		// Only allow next page if we have "full" results (i.e. possibly more pages)
		if (matchResults && matchResults.duels && matchResults.duels.length === limit) {
			currentPage += 1;
			fetchEntries();
		}
	}
</script>

<Popup z={960} slim={true} bind:open={$divisionMatchHistoryPopup}>
	<div class="popup-title">
		<h1>Duel history</h1>
	</div>
	<div class="topPopupFlex">
		<div class="filterBox">
			<p>Filter: user-</p>
			<input placeholder="all" class="filterInput" bind:value={filterId} onchange={fetchEntries} />
		</div>
	</div>
	<div class="historyBox">
		<div class="historyBoxScroll of-top of-bottom">
			{#if matchResults && matchResults.duels && matchResults.duels.length > 0}
				{#each matchResults.duels as entry}
					<div class="matchHistoryItemContainer">
						<div
							class="matchHistoryItem of-left of-right"
							class:matchInvalid={entry.player1?.won == entry.player2?.won}
							class:yourMatch={!currentFilterId &&
								(entry.player1?.id == localStorage.getItem("id") || entry.player2?.id == localStorage.getItem("id"))}
						>
							<div class="playerInfo">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<span class="playerName" role="button" tabindex="0" onclick={() => loadProfileFromId(entry.player1.id)}>
									{entry.player1?.name}
								</span>
								<span class="playerStatus">
									{entry.player1?.won ? "W" : entry.player2?.won ? "L" : "D"}
								</span>
							</div>
							<span class="vs">vs.</span>
							<div class="playerInfo">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<span
									class="playerName"
									role="button"
									tabindex="0"
									onclick={() => loadProfileFromId(entry.player2?.id)}
								>
									{entry.player2?.name}
								</span>
								<span class="playerStatus">
									{entry.player2?.won ? "W" : entry.player1?.won ? "L" : "D"}
								</span>
							</div>
						</div>
						<div class="eloInfo">
							<p>
								{#if entry.eloChange != null}
									{#if entry.player1?.id == currentFilterId || entry.player2?.id == currentFilterId}
										{(entry.player1?.won && entry.player1?.id == currentFilterId) ||
										(entry.player2?.won && entry.player2?.id == currentFilterId)
											? "+"
											: "-"}
									{:else}
										{"+/-"}
									{/if}
								{/if}
								{entry.eloChange ?? "N/A"}
								{#if entry.eloChange != null}
									{" Elo"}
								{/if}
							</p>
						</div>
					</div>
				{/each}
			{:else}
				<p class="playerSearchError">No matches in the history.</p>
			{/if}
		</div>
	</div>

	<div class="paginationControls">
		<button class="standardButton white" onclick={prevPage} class:disabledButton={currentPage === 1}>
			<ArrowLeft size={20} strokeWidth={2} />
		</button>
		<span class="pageCounter">{currentPage}</span>
		<button
			class="standardButton white"
			onclick={nextPage}
			class:disabledButton={!(matchResults && matchResults.duels && matchResults.duels.length === limit)}
		>
			<ArrowRight size={20} strokeWidth={2} />
		</button>
	</div>
</Popup>

<style>
	.playerSearchError {
		opacity: 0.5;
		font-size: 22px;
		text-align: center;
		margin-bottom: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.matchHistoryItemContainer {
		display: flex;
		gap: var(--box-margin);
		width: 100%;
	}

	.eloInfo {
		border-radius: 5px;
		box-shadow: var(--box-shadow);
		padding-inline: var(--panel-margin);
		display: flex;
		background-color: var(--box-color);
		text-wrap: nowrap;
	}

	.eloInfo p {
		align-self: center;
	}

	.filterInput {
		border-radius: 5px;
		max-width: 65px;
		padding-inline: 10px;
	}

	.filterBox {
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		max-width: fit-content;
		background-color: var(--box-color);
		display: flex;
		gap: 5px;
		justify-content: center;
		align-items: center;
		flex-grow: 1;
	}

	.filterBox p {
		color: rgba(255, 255, 255, 0.5);
	}

	.topPopupFlex {
		display: flex;
		flex-wrap: wrap;
		gap: var(--layout-margin);
	}

	.historyBox {
		position: relative;
		box-shadow: var(--box-shadow);
		width: calc(100% - 20px);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		margin-top: 25px;
		padding: var(--box-margin);
	}

	.historyBoxScroll {
		gap: var(--box-margin);
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
		overflow-y: auto;
		scrollbar-width: none;
		height: min(500px, calc(100dvh - 350px));
		width: 100%;
	}

	.disabledButton {
		opacity: 0.5;
		pointer-events: none;
	}

	.pageCounter {
		padding: 5px;
		box-shadow: var(--box-shadow);
		user-select: none;
		padding-inline: 10px;
		border-radius: 5px;
		min-width: 50px;
		text-align: center;
		background-color: var(--box-color);
		font-size: 22px;
	}

	.matchHistoryItem {
		display: flex;
		box-shadow: var(--box-shadow);
		gap: var(--box-margin);
		padding: 5px 15px;
		border-radius: 5px;
		justify-content: space-between;
		transition: background-color 250ms ease;
		background-color: var(--box-color);
		flex-grow: 1;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.matchInvalid {
		text-decoration: line-through;
		text-decoration-thickness: 2px;
		opacity: 0.5;
	}

	.yourMatch {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.playerInfo {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.playerName {
		cursor: pointer;
		transition: opacity 250ms ease;
		max-width: 200px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.playerName:hover {
		opacity: 0.5;
	}

	.playerStatus {
		opacity: 0.75;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vs {
		align-self: center;
		box-shadow: var(--bulb-shadow);
		margin: 5px 0;
		border-radius: 5px;
		padding-inline: 5px;
		background-color: var(--box-color);
	}

	.paginationControls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--layout-margin);
		margin-top: 25px;
	}

	.paginationControls button {
		padding: 5px 10px;
	}
</style>

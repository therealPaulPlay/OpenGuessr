<script>
	import Popup from "$lib/components/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { divisionMatchHistoryPopup } from "$lib/stores/uiStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { onMount } from "svelte";
	import { ArrowLeft, ArrowRight } from "lucide-svelte";

	// local state variables
	let matchResults;
	let currentPage = 1;
	const limit = 50; // must match the backend limit

	// Fetch duel entries for the current page.
	async function fetchEntries() {
		matchResults = undefined;
		try {
			const response = await fetch(`https://friends.openguessr.com/multiplayer/duel-history?page=${currentPage}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

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
				console.error("Error loading match results: " + response.status);
				errorPopup(
					"Error loading division matches",
					"An error occurred loading matches in the division history popup.",
					response.status,
				);
			}
		} catch (error) {
			console.error("Fetch/Network error occurred while loading match results: ", error);
			errorPopup(
				"Error loading matches (Network)",
				"A network error occurred loading matches in the division history popup.",
				error,
			);
		}
	}

	divisionMatchHistoryPopup.subscribe((value) => {
		if (value) fetchEntries();
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

{#if $divisionMatchHistoryPopup}
	<Popup z={960} slim="true">
		<div class="popup-title">
			<h1>Division History</h1>
		</div>
		<div class="infoBox">
			<img alt="info icon" class="infoIcon" src="/img/info_icon.png" />
			<p>Entries process up to 10 minutes before showing up.</p>
		</div>
		<div class="historyBox">
			{#if matchResults && matchResults.duels && matchResults.duels.length > 0}
				{#each matchResults.duels as entry}
					<div class="matchHistoryItem" class:matchInvalid={entry.player1?.left && entry.player2?.left}>
						<div class="playerInfo">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<span
								class="playerName"
								role="button"
								tabindex="0"
								onclick={() => loadProfileFromId(entry.player1.id, true)}
							>
								{entry.player1?.name}
							</span>
							<span class="playerStatus">
								{entry.player1?.won ? "W" : "L"}
								{entry.player1?.left ? " (left)" : ""}
							</span>
						</div>
						<span class="vs">vs.</span>
						<div class="playerInfo">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<span
								class="playerName"
								role="button"
								tabindex="0"
								onclick={() => loadProfileFromId(entry.player2?.id, true)}
							>
								{entry.player2?.name}
							</span>
							<span class="playerStatus">
								{entry.player2?.won ? "W" : "L"}
								{entry.player2?.left ? " (left)" : ""}
							</span>
						</div>
					</div>
				{/each}
			{:else}
				<p class="playerSearchError">No matches in the history.</p>
			{/if}
		</div>

		<div class="paginationControls">
			<button class="standardButton white" onclick={prevPage} class:disabledButton={currentPage === 1}>
				<ArrowLeft size={20} strokeWidth={2.5} style="margin-bottom: -2px" />
			</button>
			<span class="pageCounter">{currentPage}</span>
			<button
				class="standardButton white"
				onclick={nextPage}
				class:disabledButton={!(matchResults && matchResults.duels && matchResults.duels.length === limit)}
			>
				<ArrowRight size={20} strokeWidth={2.5} style="margin-bottom: -2px" />
			</button>
		</div>

		<button
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				divisionMatchHistoryPopup.set(false);
			}}
		>
			Close
		</button>
	</Popup>
{/if}

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

	.historyBox {
		position: relative;
		width: calc(100% - 13px);
		border-radius: 5px;
		max-height: 40dvh;
		min-height: 40dvh;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 2px;
		background-color: var(--box-color);
		margin-top: 15px;
		margin-inline: 5px;
		outline: 5px solid var(--box-color);
		gap: 10px;
		display: flex;
		flex-direction: column;
		scrollbar-width: none;
	}

	.disabledButton {
		opacity: 0.5;
		pointer-events: none;
	}

	.pageCounter {
		padding: 5px;
		padding-inline: 10px;
		border-radius: 5px;
		min-width: 50px;
		text-align: center;
		background-color: var(--box-color);
		font-size: 22px;
	}

	.matchHistoryItem {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		padding: 5px 15px;
		border-radius: 5px;
		justify-content: space-between;
		transition: background-color 250ms ease;
		background-color: var(--box-color);
	}

	.matchInvalid {
		text-decoration: line-through;
		text-decoration-thickness: 2px;
		opacity: 0.5;
	}

	.playerInfo {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.playerName {
		cursor: pointer;
		transition: opacity 250ms ease;
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
		margin: 5px 0;
		opacity: 0.75;
		border-radius: 5px;
		padding-inline: 5px;
		background-color: var(--box-color);
	}

	.infoBox {
		padding: 10px;
		border-radius: 10px;
		background-color: var(--box-color);
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 5px;
	}

	.infoBox p {
		opacity: 0.5;
	}

	.paginationControls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		margin-top: 20px;
	}

	.paginationControls button {
		padding: 5px 10px;
	}
</style>

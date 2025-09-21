<script>
	import { selectedTournament, tournamentMatchResultsIndex } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentInfoPopup, tournamentMatchResultsPopup } from "$lib/stores/uiStore";
	import { CalendarPlus, Info, Medal } from "lucide-svelte";
	import Popup from "./ui/Popup.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { slide } from "svelte/transition";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
	import { get } from "svelte/store";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { fetchTournaments } from "$lib/utils/tournamentUtils";

	let readableDate = $derived.by(() => {
		const date = new Date($selectedTournament?.date).toLocaleString("en-US", {
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
		return date;
	});

	async function enterTournament(tournamentId) {
		try {
			const response = await fetch(`${get(apiUrl)}/tournaments/enter/${tournamentId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
				body: JSON.stringify({
					id: localStorage.getItem("id"),
				}),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				return data.roomId;
			} else {
				let responseError = response.status;
				try {
					const data = await response.json();
					if (data.error) responseError = data.error;
				} catch {}
				throw new Error(responseError);
			}
		} catch (error) {
			console.error("Failed to enter tournament:", error);
			errorPopup("Failed to enter tournament", "An error occured attempting to enter the tournament.", error.message);
		}
	}

	async function trackCalendarSave(tournamentId) {
		try {
			const response = await fetch(`${get(apiUrl)}/tournaments/calendar-save/${tournamentId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("bearer")}`,
				},
				body: JSON.stringify({
					id: localStorage.getItem("id"),
				}),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			console.error("Failed to track calendar save:", error);
			errorPopup(
				"Failed to track calendar save",
				"An error occured attempting to track the calendar save.",
				error.message,
			);
		}
	}
</script>

<Popup bind:open={$tournamentInfoPopup} slim={true}>
	<div class="popup-title">
		<h1>{$selectedTournament?.name || "Default title"}</h1>
	</div>
	<div class="info-area">
		<div class="info-field">
			<p class="info-title">Start date</p>
			<p>{readableDate}</p>
		</div>
		<div class="info-field">
			<p class="info-title">Calendar saves</p>
			<p>{$selectedTournament?.saves?.toLocaleString()}</p>
		</div>
		<div class="info-field">
			<p class="info-title">Prize</p>
			<p>{$selectedTournament?.prize}</p>
		</div>
		<div class="info-field">
			<p class="info-title">Map</p>
			<p>{idToMapName($selectedTournament?.map)}</p>
		</div>
		<div
			class="info-field"
			class:info-field-pulse={$selectedTournament?.status == "ongoing" || $selectedTournament?.status == "starting"}
		>
			<p class="info-title">Status</p>
			<p>{$selectedTournament?.status?.slice(0, 1)?.toUpperCase() + $selectedTournament?.status?.slice(1)}</p>
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
		<div class="match-box-scroll of-top of-bottom of-length-2">
			{#if $selectedTournament?.matches?.length}
				{#each $selectedTournament?.matches as match, index}
					<div class="match-entry" transition:slide={{ axis: "y" }}>
						<p>Match {index + 1}</p>
						<button
							class="standardButton white"
							onclick={() => {
								$tournamentMatchResultsIndex = index;
								playSound("basic_button");
								$tournamentMatchResultsPopup = true;
							}}
						>
							View results
						</button>
					</div>
				{/each}
			{:else}
				<p class="nothing-text">Match results will appear here.</p>
			{/if}
		</div>
	</div>
	{#if $selectedTournament?.winner?.name}
		<div transition:slide={{ axis: "y" }} style:width={"100%"}>
			<TitleSeparator text="Final result" class="tournament-divider-margin" />
			<div class="winner-box">
				<Medal class="big-medal" size={120} strokeWidth={1.25} />
				<p class="winner-description">And the winner is...</p>
				<button
					class="opacity-hover"
					onclick={() => {
						loadProfileFromId($selectedTournament?.winner?.id);
					}}
				>
					{$selectedTournament?.winner?.name}
				</button>
			</div>
		</div>
	{/if}
	{#if $selectedTournament?.status == "starting" || $selectedTournament?.status == "upcoming"}
		<TitleSeparator text="Account requirements" class="tournament-divider-margin" />
		<div class="info-container warnInfo">
			<Info color="white" strokeWidth={2} class="info-icon-circular" />
			<p>You need to have at least 1100 Elo and an account older than one week to enter a tournament.</p>
		</div>
	{/if}
	{#if $selectedTournament?.status == "starting"}
		<button
			class="standardButton largeButton"
			onclick={async () => {
				playSound("basic_button");
				const roomcode = await enterTournament($selectedTournament?.id);
				if (roomcode) {
					$tournamentInfoPopup = false;
					joinFromAnywhere(roomcode);
				}
			}}
		>
			Enter
		</button>
	{:else if $selectedTournament?.status == "upcoming"}
		<button
			class="standardButton largeButton white {$selectedTournament?.saved ? 'disabled' : ''}"
			onclick={async () => {
				playSound("basic_button");
				await trackCalendarSave($selectedTournament?.id);
				await fetchTournaments();

				const date = new Date($selectedTournament?.date);
				const startTime = date
					.toISOString()
					.replace(/[-:]/g, "")
					.replace(/\.\d{3}/, "");
				const endTime = new Date(date.getTime() + 60 * 60 * 1000)
					.toISOString()
					.replace(/[-:]/g, "")
					.replace(/\.\d{3}/, ""); // +1 hour

				const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent($selectedTournament?.name + " (OpenGuessr)")}&dates=${startTime}/${endTime}&details=${encodeURIComponent("Tournament")}`;

				window.open(calendarUrl, "_blank");
			}}
		>
			<CalendarPlus style="margin-bottom: -3px;" />
			{$selectedTournament?.saved ? "Added" : "Add"} to calendar
		</button>
	{/if}
</Popup>

<style>
	.info-area {
		display: flex;
		gap: var(--box-margin);
		flex-wrap: wrap;
		max-width: 100%;
		box-sizing: border-box;
	}

	:global(.big-medal) {
		position: absolute;
		top: -40%;
		right: 35%;
		z-index: -1;
		opacity: 0.05;
	}

	.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.opacity-hover {
		transition: opacity 250ms ease;
		cursor: pointer;
		font-size: 25px;
		text-overflow: ellipsis;
		max-width: 80%;
		text-wrap: nowrap;
		overflow: hidden;
	}

	.opacity-hover:hover {
		opacity: 0.5;
	}

	.match-entry {
		width: 100%;
		box-sizing: border-box;
		border-radius: 5px;
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		background-color: var(--box-color);
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		align-items: center;
	}

	.winner-description {
		opacity: 0.5;
	}

	:global(.tournament-divider-margin) {
		margin-top: 25px !important;
	}

	.match-box {
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		margin-top: var(--layout-margin);
		padding: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
	}

	.match-box-scroll {
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		overflow-y: auto;
		max-height: 180px;
		scrollbar-width: none;
	}

	.winner-box {
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: var(--layout-margin);
		padding: var(--box-margin);
		gap: 5px;
		padding-bottom: var(--layout-margin);
		position: relative;
		overflow: hidden;
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

<script>
	import { selectedTournament, tournamentMatchResultsIndex } from "$lib/stores/context-specific/tournamentStore";
	import { tournamentInfoPopup, tournamentMatchResultsPopup } from "$lib/stores/uiStore";
	import { CalendarPlus, Info, Medal } from "@lucide/svelte";
	import Popup from "./ui/Popup.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { slide } from "svelte/transition";
	import { idToMapName } from "$lib/utils/idToMapName";
	import { joinFromAnywhere } from "$lib/logic/multiplayerLogic";
	import { get } from "svelte/store";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { fetchTournaments } from "$lib/utils/tournamentUtils";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import InfoBanner from "./InfoBanner.svelte";

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
			if (!response.ok) throw new Error(response.status);
			return true;
		} catch (error) {
			console.error("Failed to track calendar save:", error);
			errorPopup(
				"Failed to track calendar save",
				"An error occured attempting to track the calendar save.",
				error.message,
			);
			return false;
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
			<p class="info-title">Cal. saves</p>
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
	<TitleSeparator text="Matches" class="tournament-divider-margin" />
	<InfoBanner
		text="Tournaments consist of multiple matches, with the top half of players advancing each round until a grand finale determines the winner."
	/>
	<div class="match-box">
		<div class="match-box-scroll of-top of-bottom of-length-2">
			{#if $selectedTournament?.matches?.length}
				{#each $selectedTournament?.matches, index}
					<div class="match-entry" transition:slide={{ axis: "y" }}>
						<p>Match {index + 1}</p>
						<button
							class="standard-button dark"
							onclick={() => {
								$tournamentMatchResultsIndex = index;
								playSound("basic_button");
								$tournamentMatchResultsPopup = true;
							}}
						>
							<Info size={22} strokeWidth={2} style="margin-bottom: -2.5px;" />
						</button>
					</div>
				{/each}
			{:else}
				<p class="nothing-text">No matches to display.</p>
			{/if}
		</div>
	</div>
	{#if $selectedTournament?.winner?.name}
		<div transition:slide={{ axis: "y" }} style:width="100%">
			<TitleSeparator text="Final result" class="tournament-divider-margin" />
			<div class="winner-box">
				<Medal class="big-medal" size={120} strokeWidth={1.25} />
				<p class="winner-description">And the winner is...</p>
				<button
					class="opacity-hover"
					onclick={() => {
						showProfile($selectedTournament?.winner?.id);
					}}
				>
					{$selectedTournament?.winner?.name}
				</button>
			</div>
		</div>
	{/if}
	{#if $selectedTournament?.status == "starting" || $selectedTournament?.status == "upcoming"}
		<TitleSeparator text="Account requirements" class="tournament-divider-margin" />
		<InfoBanner text={`You need to have at least ${(1100).toLocaleString()} Elo and an account older than 1 week.`} />
	{/if}
	{#if $selectedTournament?.status == "starting"}
		<button
			class="standard-button bottom-button large-button"
			onclick={async () => {
				playSound("basic_button");
				const action = async () => {
					const code = await enterTournament($selectedTournament?.id);
					if (code) {
						$tournamentInfoPopup = false;
						joinFromAnywhere(code);
					}
				};
				if (!$isAuthenticated) return signupPrompt(action);
				action();
			}}
		>
			Enter
		</button>
	{:else if $selectedTournament?.status == "upcoming"}
		<button
			class="standard-button bottom-button large-button white"
			disabled={$selectedTournament?.saved}
			onclick={async () => {
				playSound("basic_button");

				const action = async () => {
					const success = await trackCalendarSave($selectedTournament?.id);
					if (success) await fetchTournaments();

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
				};

				if (!$isAuthenticated) return signupPrompt(action);
				else action();
			}}
		>
			<CalendarPlus style="margin-bottom: -3px; margin-right: 3px;" />
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
		border-radius: var(--content-margin);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		background-color: var(--box-color);
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		align-items: center;
	}

	.match-entry p {
		margin-left: var(--content-margin);
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
		gap: var(--content-margin);
		padding-bottom: var(--layout-margin);
		position: relative;
		overflow: hidden;
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

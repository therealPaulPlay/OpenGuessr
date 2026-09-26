<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import TitleSeparator from "$lib/components/ui/TitleSeparator.svelte";
	import SupporterTag from "$lib/components/SupporterTag.svelte";
	import { competitionResultPopup } from "$lib/stores/uiStore";
	import { competitionResultId, competitionResultRating } from "$lib/stores/context-specific/competitionStore";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { showNotification } from "$lib/utils/notifications";
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { Frown, Link, Smile, TriangleAlert } from "@lucide/svelte";
	import { blur } from "svelte/transition";
	import { get } from "svelte/store";

	let leaderboardEntries = $state([]);
	let friendsEntries = $state([]);
	let leaderboardName = $state("Default");

	let showRatingBox = $state(false);
	let ratingsButtonBox = $state(false);
	let ratingText = $state();

	// Reload whenever the popup opens
	competitionResultPopup.subscribe((open) => {
		if (!open) return;

		leaderboardEntries = undefined;
		friendsEntries = undefined;
		leaderboardName = "...";
		showRatingBox = get(competitionResultRating);

		if (showRatingBox) {
			ratingsButtonBox = true;
			ratingText = "How did you like this competition?";
		}

		loadLeaderboardFromServer(get(competitionResultId));
	});

	async function loadLeaderboardFromServer(id) {
		try {
			const userId = localStorage.getItem("id");
			const url = $apiUrl + "/competitions/leaderboard/" + id + (userId ? "?id=" + userId : "");

			const response = await fetch(url, {
				method: "GET",
			});

			if (response.ok) {
				const data = await response.json();
				leaderboardEntries = data.leaderboard;
				friendsEntries = data?.friendsLeaderboard || [];
				leaderboardName = data.name;
			} else {
				let responseData = null;

				try {
					responseData = await response.json();
				} catch {}

				if (responseData?.error) {
					errorPopup("Failed loading a leaderboard", "An error occured loading a leaderboard", responseData.error);
				} else {
					errorPopup(
						"Unknown error loading a leaderboard",
						"An unknown erorr occured loading a leaderboard.",
						"Request failed with status " + response.status + ".",
					);
				}
			}
		} catch (error) {
			console.error("Error occurred during leaderboard load: ", error);
		}
	}

	async function submitRating(factor) {
		ratingsButtonBox = false;
		ratingText = "Submitting rating...";

		try {
			const body = {
				id: localStorage.getItem("id"),
				compId: Number($competitionResultId),
				updateFactor: factor,
			};

			const response = await fetch($apiUrl + "/competitions/ranking", {
				method: "POST",
				headers: {
					Authorization: `Bearer ` + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				let error = await response.json().error;
				if (!error) error = response.status;

				console.error("An occured submitting the competition rating: " + error);
				ratingText = "Error: " + error;
			} else {
				ratingText = "Rating received. Thank you!";
			}
		} catch (error) {
			console.error("A network error occured submitting the competition rating: " + error);
			ratingText = "Network error.";
		}
	}
</script>

<Popup slim={true} bind:open={$competitionResultPopup}>
	<div class="popup-title">
		<h1 id="leaderboard-header" class="text-header-left">Results for <i>{leaderboardName}</i></h1>
	</div>
	<TitleSeparator text="You & friends" />
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	{#if !$isAuthenticated}
		<div class="friends-not-played-container">
			<p class="friends-not-played" style:text-align="center">Sign up to compete with friends!</p>
		</div>
	{:else}
		{const friendsPlayed = $derived(friendsEntries?.some((entry) => entry.id != localStorage.getItem("id")))}
		{#if friendsEntries?.length > 0}
			<div class="ranking-display" style:margin-bottom="var(--box-margin)">
				<div class="ranking-display-scroll of-top of-bottom">
					{#each friendsEntries as entry}
						<div class="rank-item" transition:blur class:rank-you={entry.id == localStorage.getItem("id")}>
							<p>#{entry.position}</p>
							<p
								class="center-entry"
								onclick={() => {
									showProfile(entry.id);
								}}
							>
								{entry.userName}
								{#if entry.supporter_level > 0}
									<SupporterTag />
								{/if}
							</p>
							<p>{entry.score.toLocaleString()} Pts.</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		<div class="friends-not-played-container">
			<p class="friends-not-played">
				{!friendsEntries
					? "Loading..."
					: friendsPlayed
						? "Invite more friends to enter this competition."
						: "None of your friends entered yet, consider inviting them."}
			</p>
			<button
				class="standard-button white"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(window.location.origin + "/competitions?enter=" + $competitionResultId)
						.then(() => showNotification("Copied!"))
						.catch((error) => showNotification("Error: " + error));
				}}
				>Copy link<Link
					size={20}
					strokeWidth={2.25}
					style="margin-bottom: -2px; margin-left: var(--content-margin);"
				/></button
			>
		</div>
	{/if}
	<TitleSeparator text="All" />
	<div class="ranking-display">
		<div class="ranking-display-scroll of-top of-bottom">
			{#if leaderboardEntries?.length > 0}
				{#each leaderboardEntries as entry}
					<div class="rank-item" transition:blur class:rank-you={entry.id == localStorage.getItem("id")}>
						<p>#{entry.position}</p>
						<p
							class="center-entry"
							onclick={() => {
								showProfile(entry.id);
							}}
						>
							{entry.userName}
							{#if entry.supporter_level > 0}
								<SupporterTag />
							{/if}
						</p>
						<p>{entry.score.toLocaleString()} Pts.</p>
					</div>
				{/each}
			{:else}
				<div class="empty-leaderboard-box">
					{#if leaderboardEntries}
						<p class="error-text">No entries yet.</p>
					{:else}
						<p class="error-text">Loading...</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	{#if showRatingBox}
		<div id="rating-box">
			<p id="rating-text">{ratingText || "Default rating text."}</p>
			{#if ratingsButtonBox}
				<div class="rating-button-box" id="rating-button-box">
					<button
						class="standard-button white rate-button"
						id="rate-good"
						onclick={() => {
							playSound("basic_button");
							submitRating(5);
						}}
					>
						<Smile size={20} strokeWidth={2.5} style="margin-bottom: -2px;" />
					</button>
					<button
						class="standard-button white rate-button"
						id="rate-bad"
						onclick={() => {
							playSound("basic_button");
							submitRating(-3);
						}}
					>
						<Frown size={20} strokeWidth={2.5} style="margin-bottom: -2px;" />
					</button>
					<button
						class="standard-button white rate-button"
						id="rate-broken"
						onclick={() => {
							playSound("basic_button");
							submitRating(-10);
						}}
					>
						<TriangleAlert size={20} strokeWidth={2.5} style="margin-bottom: -2px;" />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</Popup>

<style>
	.text-header-left {
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.error-text {
		width: 100%;
		text-align: center;
		opacity: 0.5;
		margin-top: var(--layout-margin);
	}

	.empty-leaderboard-box {
		height: 300px;
		width: 100%;
		display: flex;
		align-items: center;
	}

	.ranking-display {
		box-sizing: border-box;
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		width: 100%; /* Fix for Safari */
		background-color: var(--box-color);
		padding: var(--box-margin);
		position: relative;
	}

	.ranking-display-scroll {
		overflow-x: hidden;
		overflow-y: auto;
		gap: var(--box-margin);
		display: flex;
		scrollbar-width: none;
		width: 100%;
		max-height: 400px;
		justify-content: safe center;
		flex-direction: column;
	}

	.rank-item {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--content-margin);
		width: 100%;
		box-sizing: border-box;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		gap: var(--box-margin);
	}

	.rank-item p {
		text-wrap: nowrap;
	}

	.rank-you {
		background-color: rgba(255, 255, 255, 0.2);
		box-shadow: var(--bulb-shadow);
	}

	.center-entry {
		width: 50%;
		text-align: center;
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		mask-image: linear-gradient(to right, transparent, black 0%, black 90%, transparent);
	}

	.center-entry:hover {
		opacity: 0.5;
	}

	.friends-not-played {
		opacity: 0.5;
		padding-inline: var(--content-margin);
		flex-grow: 100;
	}

	.friends-not-played-container {
		display: flex;
		justify-items: center;
		align-items: center;
		gap: var(--box-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		flex-wrap: wrap;
	}

	.friends-not-played-container button {
		margin-left: auto;
		flex-grow: 1;
	}

	#rating-box {
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		margin-top: var(--layout-margin);
		padding: var(--box-margin);
		gap: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
	}

	#rating-box p {
		padding-inline: var(--panel-margin);
		opacity: 0.5;
	}

	.rate-button {
		padding-inline: var(--content-margin);
	}

	.rating-button-box {
		display: flex;
		gap: var(--box-margin);
		justify-content: center;
		align-items: center;
	}
</style>

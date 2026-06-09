<script>
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { errorPopup } from "$lib/utils/errorHandling";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { competitionData } from "$lib/stores/context-specific/competitionStore";
	import { loadCompetition } from "$lib/logic/competitionLogic";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { goto } from "$app/navigation";
	import { Frown, Plus, Search, Smile, TriangleAlert } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { blur } from "svelte/transition";
	import SupporterTag from "$lib/components/SupporterTag.svelte";
	import Drawer from "$lib/components/ui/Drawer.svelte";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";

	const competitionsEndpoint = $apiUrl + "/competitions";

	// Format Duration of Competitions ---------------------------------------------------------------
	function formatDuration(seconds) {
		if (typeof seconds === "string") {
			seconds = parseInt(seconds, 10);
		}

		if (isNaN(seconds) || seconds < 0) return "0min";

		const days = Math.floor(seconds / 86400);
		seconds %= 86400;
		const hours = Math.floor(seconds / 3600);
		seconds %= 3600;
		const minutes = Math.floor(seconds / 60);

		let result = [];
		if (days > 0) result.push(`${days}d`);
		if (hours > 0) result.push(`${hours}h`);
		if (minutes > 0 || result.length === 0) result.push(`${minutes}min`);

		return result.join(" ");
	}

	// Enter Competition ------------------------------------------------------------------------------------------------------------------------------
	async function enterCompetition(id) {
		if (!$isAuthenticated) {
			showConfirmPopup(
				"Account required",
				"In order to enter competitions, an account is needed.",
				() => {
					signupPrompt();
				},
				null,
				null,
				"Sign up",
			);

			return;
		}

		try {
			const response = await fetch(competitionsEndpoint + "/details/" + id, {
				method: "POST",
				headers: {
					Authorization: "Bearer " + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: localStorage.getItem("id"),
				}),
			});

			if (response.ok) {
				try {
					const data = await response.json();

					let activeCompetitionDetails = {
						name: data.name,
						id: data.id,
						roundAmount: data.location_amount,
						roundLength: data.round_length,
						restriction: data.restriction,
						locations: data.locations.locations,
					};

					// Go back to main page and start competition
					competitionData.set(activeCompetitionDetails);
					loadCompetition();
					goto("/");
				} catch (error) {
					throw new Error("Error parsing competition details", { cause: error });
				}
			} else {
				let responseData = null;

				responseData = await response.json();

				let errorMessages = [];

				if (responseData.error) errorMessages.push(responseData.error);
				if (responseData.message) errorMessages.push(responseData.message);

				if (responseData.errors && Array.isArray(responseData.errors)) {
					responseData.errors.forEach((err) => {
						if (err.msg) errorMessages.push(err.msg);
						else errorMessages.push(JSON.stringify(err));
					});
				}

				throw new Error(errorMessages.join(" ") || "Unknown error - please check the network tab.");
			}
		} catch (error) {
			console.error("Error occurred trying to enter a competition:", error);
			errorPopup("Error entering competition", null, error.message);
		}
	}

	// Leaderboard ---------------------------------------------------------------------------------------------------------
	let leaderboardPopup = $state(false);
	let showRatingBox = $state(false);
	let leaderboardCompetitionId;

	function openLeaderboard(id, displaywRatingBox = false) {
		leaderboardCompetitionId = id; // Used for e.g. the ratings requests
		leaderboardPopup = true;
		leaderboardEntries = undefined;
		yourEntry = undefined;
		leaderboardName = "...";

		// Load data from endpoint using id here
		loadLeaderboardFromServer(id);

		if (!displaywRatingBox) showRatingBox = false;
		if (displaywRatingBox) displayRatingBox();
	}

	let leaderboardEntries = $state([]);
	let yourEntry = $state();
	let leaderboardName = $state("Default");

	async function loadLeaderboardFromServer(id) {
		try {
			const userId = localStorage.getItem("id");
			const url = competitionsEndpoint + "/leaderboard/" + id + (userId ? "?id=" + userId : "");

			const response = await fetch(url, {
				method: "GET",
			});

			if (response.ok) {
				const data = await response.json();
				leaderboardEntries = data.leaderboard;
				yourEntry = data?.userRank;
				leaderboardName = data.name;
			} else {
				let responseData = null;

				try {
					responseData = await response.json();
					let errorMessages = [];

					if (responseData.error) errorMessages.push(responseData.error);
					if (responseData.message) errorMessages.push(responseData.message);

					if (responseData.errors && Array.isArray(responseData.errors)) {
						responseData.errors.forEach((err) => {
							if (err.msg) {
								errorMessages.push(err.msg);
							} else {
								errorMessages.push(JSON.stringify(err));
							}
						});
					}

					errorPopup("Failed loading a leaderboard", "An error occured loading a leaderboard", errorMessages.join(" "));
				} catch {
					errorPopup(
						"Unknown error loading a leaderboard",
						"An unknown erorr occured loading a leaderboard.",
						"Please inspect console logs and network requests for more details.",
					);
				}
			}
		} catch (error) {
			console.error("Error occurred during leaderboard load: ", error);
		}
	}

	// Query Links - Enter and Load leaderboard --------------------------------------------------------------------------------------------------------
	onMount(() => {
		let urlParams = new URLSearchParams(window.location.search);

		let leaderboardIdFromLink;
		let leaderboardIdFromLinkAfterSubmit;

		// Load leaderboard via link
		try {
			leaderboardIdFromLink = urlParams.get("leaderboard");
			if (leaderboardIdFromLink) {
				openLeaderboard(leaderboardIdFromLink);
				history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
			}

			leaderboardIdFromLinkAfterSubmit = urlParams.get("leaderboard-submit");
			if (leaderboardIdFromLinkAfterSubmit) {
				openLeaderboard(leaderboardIdFromLinkAfterSubmit, true);
				history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
			}
		} catch {}

		// Enter competition via link
		let competitionIdFromLink;

		try {
			competitionIdFromLink = urlParams.get("enter");

			if (competitionIdFromLink) {
				showConfirmPopup(
					"Enter competition?",
					"This will start the competition from your link immediately. You can only enter a competition once.",
					() => {
						enterCompetition(competitionIdFromLink);
					},
				);
				history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
			}
		} catch {}
	});

	// Load competitions ----------------------------------------------------------------------------------------------------------------------------
	let notExpiredIndex = 0;
	let expiredIndex = 0;
	let expiredTabsSelection = $state("All");

	// Competition "Don't show entered Competitions" Filter
	let hideEntered = $state(false);

	// Fetched Data
	let activeCompetitionsData = $state([]);
	let expiredCompetitionData = $state([]);
	let dailyCompetitionData = $state([]);

	let loadMoreActive = $state(false);
	let loadMoreExpired = $state(false);

	// Error texts
	let dailyCompetitionError = $state("Loading...");
	let activeCompetitionError = $state("Loading...");
	let expiredCompetitionsError = $state("Loading...");

	async function getCompetitionsFromServer(expired, search, daily, filterEntered) {
		try {
			// Always hide load more bar during loading process
			if (!expired) loadMoreActive = false;
			if (expired) loadMoreExpired = false;

			// Endpoint selection
			let Endpoint = null;
			if (!expired) Endpoint = competitionsEndpoint + "/" + notExpiredIndex;
			if (expired) Endpoint = competitionsEndpoint + "/expired/" + expiredIndex;
			if (search) Endpoint = competitionsEndpoint + "/search/" + notExpiredIndex;
			if (daily) Endpoint = competitionsEndpoint + "/daily/daily-competition";
			if (filterEntered) Endpoint = competitionsEndpoint + "/not-entered/" + notExpiredIndex;

			// Build query params
			const params = new URLSearchParams();
			const userId = localStorage.getItem("id");
			if (userId) params.set("id", userId);
			if (search) params.set("search", search);
			if (params.size > 0) Endpoint += "?" + params.toString();

			const headers = {};
			if (filterEntered) headers["Authorization"] = "Bearer " + localStorage.getItem("bearer");

			const response = await fetch(Endpoint, {
				method: "GET",
				headers,
			});

			if (response.ok) {
				let noContentLoaded = true;

				try {
					const data = await response.json();

					if (expired) expiredCompetitionData = [...expiredCompetitionData, ...data.competitions];
					if (!expired && !daily) activeCompetitionsData = [...activeCompetitionsData, ...data.competitions];
					if (!expired && daily) dailyCompetitionData = data.competitions; // Only one, so no need to concatinate arrays here

					if (!daily) {
						if (!expired) notExpiredIndex += data.competitions?.length;
						else expiredIndex += data.competitions?.length;
					}

					if (data.competitions?.length > 0) noContentLoaded = false;
					let maxAmountLoaded = data.competitions.length == 10;

					if (!daily) {
						if (expired)
							loadMoreExpired = maxAmountLoaded; // Max amount loaded = more available
						else loadMoreActive = maxAmountLoaded;
					}

					if (search && noContentLoaded && notExpiredIndex == 0) activeCompetitionError = "Search returned no results.";
					if (!daily && !search && !expired && noContentLoaded && notExpiredIndex == 0)
						activeCompetitionError = "No active competitions found.";
					if (!daily && !search && expired && noContentLoaded && expiredIndex == 0)
						expiredCompetitionsError = "No expired competitions found.";
					if (daily && !expired && !search && noContentLoaded)
						dailyCompetitionError = "The daily competition is likely being generated right now.";
				} catch (error) {
					console.error("Error during the competition loading and add process: " + error);
				}
			} else {
				let responseData = null;

				try {
					responseData = await response.json();

					let errorMessages = [];

					if (responseData.error) errorMessages.push(responseData.error);
					if (responseData.message) errorMessages.push(responseData.message);

					if (responseData.errors && Array.isArray(responseData.errors)) {
						responseData.errors.forEach((err) => {
							if (err.msg) errorMessages.push(err.msg);
							else errorMessages.push(JSON.stringify(err));
						});
					}

					document.querySelectorAll(".error-text").forEach((e) => {
						e.textContent = "Error: " + errorMessages.join(" ");
					});
				} catch {
					document.querySelectorAll(".error-text").forEach((e) => {
						e.textContent = "Error did not include json.";
					});
				}
			}
		} catch (error) {
			console.error("Error occurred during competition load: ", error);
			return "A network error has occurred.";
		}
	}

	// Initial Load
	onMount(() => {
		getCompetitionsFromServer(false, false, true); // get daily comp
		getCompetitionsFromServer(false); // get initial 10 active comps
		getCompetitionsFromServer(true); // get initial 10 expired comps
	});

	// Search Competitions -------------------------------------------------------------------------------------------------
	let searchQuery = $state();

	function startSearch() {
		expiredTabsSelection = "All";
		let query = searchQuery.toLowerCase();
		activeCompetitionsData = [];
		if (hideEntered) hideEntered = false;

		notExpiredIndex = 0; // reset index if starting new search
		if (query == "") query = undefined; // so the undefined check works in the load function

		getCompetitionsFromServer(false, query);
	}

	// Rating -------------------------------------------------------------------------------------------
	let ratingText = $state();
	let ratingsButtonBox = $state(false);

	function displayRatingBox() {
		showRatingBox = true;
		ratingsButtonBox = true;
		ratingText = "Consider rating this competition.";
	}

	async function submitRating(factor) {
		ratingsButtonBox = false;
		ratingText = "Submitting rating...";

		try {
			const body = {
				id: localStorage.getItem("id"),
				compId: Number(leaderboardCompetitionId),
				updateFactor: factor,
			};

			const response = await fetch(competitionsEndpoint + "/ranking", {
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

<svelte:head>
	<title>Competitions</title>
</svelte:head>

{#snippet showMoreButton(callback)}
	<button
		class="load-more-item standard-button white fade-in-item"
		onclick={() => {
			callback?.();
		}}
	>
		More
		<Plus strokeWidth={2.75} size={20} style="margin-bottom: -4px; margin-left: var(--content-margin);" />
	</button>
{/snippet}

<Popup slim={true} bind:open={leaderboardPopup}>
	<div class="popup-title">
		<h1 id="leaderboard-header" class="text-header-left">Ranking for <i>{leaderboardName}</i></h1>
	</div>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="ranking-display">
		<div class="ranking-display-scroll of-top of-bottom">
			{#if yourEntry}
				<div class="you-bar">
					<p class="you-label">You</p>
					<div class="rank-item your-item">
						<p>#{yourEntry.position}</p>
						<p
							id="your-username"
							class="center-entry"
							onclick={() => {
								showProfile(localStorage.getItem("id"));
							}}
						>
							{yourEntry.userName}
							{#if yourEntry.supporter_level > 0}
								<SupporterTag />
							{/if}
						</p>
						<p>{yourEntry.score.toLocaleString()} Pts.</p>
					</div>
				</div>
			{/if}
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

<!-- Competition Item Component -->
{#snippet competitionItem(
	id,
	name,
	author,
	authorId,
	playercount,
	restriction,
	duration,
	remainingDuration,
	locationAmount,
	roundLength,
	description,
	expired,
	entered,
	daily,
)}
	<div class="competition-item fade-in-item" style:border-radius={daily && expired ? "8px" : ""}>
		<div>
			<h2 class="competition-item-header">{name}</h2>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p
				class="competition-author"
				onclick={() => {
					const id = authorId ? authorId : 2; // Display as 2 (PaulPlay) if created by System (meaning, no ID is set)
					showProfile(id);
				}}
			>
				by {author}
			</p>
		</div>
		<div class="competition-properties-box">
			<div class="property-item">
				<div class="label">
					<p>Plays</p>
				</div>
				<p class="item-text">{playercount.toLocaleString()}</p>
			</div>
			<div class="property-item">
				<div class="label">
					<p>Restriction</p>
				</div>
				<p class="item-text">{$restrictionNames?.[restriction] || "Invalid"}</p>
			</div>
			<div class="property-item">
				<div class="label">
					<p>Duration</p>
				</div>
				<p class="item-text">
					{formatDuration(duration)}
					{#if remainingDuration > 0}({formatDuration(remainingDuration)} left){/if}
				</p>
			</div>
			<div class="property-item">
				<div class="label">
					<p>Rounds</p>
				</div>
				<p class="item-text">{locationAmount}</p>
			</div>
			<div class="property-item">
				<div class="label">
					<p>Round length</p>
				</div>
				<p class="item-text">{roundLength}s</p>
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="about-section competition-description"
			role="button"
			tabindex="0"
			onclick={() => {
				showConfirmPopup("About", description);
			}}
		>
			<div class="label" class:expired-competition-color={expired} role="button" tabindex="0">
				<p>About</p>
			</div>
			<p class="item-text desc-text">
				{description}
			</p>
		</div>
		<div class="competition-button-box">
			<button
				class="standard-button competition-button white"
				onclick={() => {
					playSound("basic_button");
					openLeaderboard(id);
				}}
				>Results
				<img class="leaderboard-icon" src="/img/leaderboards_icon.png" alt="Leaderboards for OpenGuessr" />
			</button>
			{#if !expired}
				<button
					class="standard-button competition-button white"
					class:daily-primary={daily}
					disabled={entered || (authorId != null && authorId == localStorage.getItem("id"))}
					onclick={() => {
						playSound("basic_button");

						if ($isAuthenticated) {
							showConfirmPopup(
								"Enter " + name + "?",
								"This will start the game immediately. You can only enter a competition once.",
								() => {
									enterCompetition(id);
								},
							);
						} else {
							signupPrompt();
						}
					}}
					>{entered
						? "Already entered"
						: authorId != null && authorId == localStorage.getItem("id")
							? "Hosted by you"
							: "Enter"}</button
				>
			{/if}
		</div>
	</div>
{/snippet}

<div class="competition-element">
	<div class="header-container">
		<h2 class="header">Official</h2>
	</div>
	<div id="daily-competition-area" class="competition-area">
		<!-- daily competitions will be inserted here -->
		{#if dailyCompetitionData?.length > 0}
			{#each dailyCompetitionData as entry}
				{#if !entry.expired}
					{@render competitionItem(
						entry.id,
						entry.name,
						entry.author,
						entry.author_id,
						entry.playercount,
						entry.restriction,
						entry.duration,
						entry.remainingDuration,
						entry.location_amount,
						entry.round_length,
						entry.description,
						entry.expired,
						entry.entered,
						true,
					)}
				{:else}
					<Drawer title="Yesterday's results" class="fade-in-item">
						{@render competitionItem(
							entry.id,
							entry.name,
							entry.author,
							entry.author_id,
							entry.playercount,
							entry.restriction,
							entry.duration,
							entry.remainingDuration,
							entry.location_amount,
							entry.round_length,
							entry.description,
							entry.expired,
							entry.entered,
							true,
						)}
					</Drawer>
				{/if}
			{/each}
		{:else}
			<p class="error-text">{dailyCompetitionError}</p>
		{/if}
	</div>
</div>
<div class="competition-element">
	<div class="header-container">
		<h2 class="header">Active</h2>
	</div>
	<div class="button-toolbar">
		<button
			class="standard-button white"
			onclick={() => {
				playSound("basic_button");
				if ($isAuthenticated) {
					goto("/competitions/create");
				} else {
					signupPrompt();
				}
			}}><Plus size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-right: 2px;" /> Create</button
		>
		<Tabs
			tabs={["All", "Not entered"]}
			class="hide-entered-comps-toggle"
			disabled={!$isAuthenticated}
			bind:selected={expiredTabsSelection}
			onchange={(_, selectionIndex) => {
				playSound("basic_button");
				activeCompetitionsData = []; // Reset loaded data
				searchQuery = ""; // Reset search query
				hideEntered = Boolean(selectionIndex); // 0 = false, 1 = true
				notExpiredIndex = 0;
				getCompetitionsFromServer(false, false, false, hideEntered);
			}}
		/>
		<search>
			<input
				id="competition-search"
				bind:value={searchQuery}
				placeholder="Search"
				onkeydown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
					}
				}}
				onkeyup={(event) => {
					if (event.key === "Enter") {
						startSearch();
					}
				}}
			/>
			<button
				id="start-search"
				class="standard-button white"
				onclick={() => {
					playSound("basic_button");
					startSearch();
				}}
			>
				<Search size={20} strokeWidth={2.5} />
			</button>
		</search>
	</div>
	<div id="competition-area" class="competition-area">
		<!-- active competitions will be inserted here -->
		{#if activeCompetitionsData?.length > 0}
			{#each activeCompetitionsData as entry}
				{@render competitionItem(
					entry.id,
					entry.name,
					entry.author,
					entry.author_id,
					entry.playercount,
					entry.restriction,
					entry.duration,
					entry.remainingDuration,
					entry.location_amount,
					entry.round_length,
					entry.description,
					entry.expired,
					entry.entered,
					false,
				)}
			{/each}
		{:else}
			<p class="error-text">{activeCompetitionError}</p>
		{/if}
	</div>
	{#if loadMoreActive}
		{@render showMoreButton(() => {
			playSound("basic_button");
			getCompetitionsFromServer(false, false, false, hideEntered);
		})}
	{/if}
</div>
<div class="competition-element expired-box">
	<div class="header-container">
		<h2 class="header">Recently ended</h2>
	</div>
	<div id="expired-competition-area" class="competition-area">
		<!-- expired competitions will be inserted here -->
		{#if expiredCompetitionData?.length > 0}
			{#each expiredCompetitionData as entry}
				{@render competitionItem(
					entry.id,
					entry.name,
					entry.author,
					entry.author_id,
					entry.playercount,
					entry.restriction,
					entry.duration,
					entry.remainingDuration,
					entry.location_amount,
					entry.round_length,
					entry.description,
					entry.expired,
					entry.entered,
					false,
				)}
			{/each}
		{:else}
			<p class="error-text">{expiredCompetitionsError}</p>
		{/if}
	</div>
	{#if loadMoreExpired}
		{@render showMoreButton(() => {
			playSound("basic_button");
			getCompetitionsFromServer(true);
		})}
	{/if}
</div>

<style>
	.button-toolbar {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--box-shadow);
		flex-wrap: wrap;
		box-sizing: border-box;
		gap: var(--box-margin);
		align-items: center;
		border-radius: var(--layout-margin);
		width: calc(100%);
		padding: var(--box-margin);
		margin-bottom: var(--layout-margin);
		background-color: var(--box-color);
	}

	.competition-element {
		transition:
			background-color 250ms ease,
			filter 250ms ease;
		width: 100%;
		overflow: hidden;
		height: auto;
		margin-bottom: calc(2 * var(--layout-margin));
	}

	.competition-button-box {
		margin-top: auto !important;
		padding-top: 60px;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--box-margin);
	}

	.empty-leaderboard-box {
		height: 300px;
		width: 100%;
		display: flex;
		align-items: center;
	}

	#competition-area,
	#expired-competition-area {
		min-height: 200px;
	}

	.competition-description {
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		padding: 7px;
		padding-inline: 4px;
		font-size: 22px;
		transition: filter 250ms ease;
	}

	.competition-item {
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		transition:
			background-color 250ms ease,
			filter 250ms ease,
			opacity 250ms ease;
		flex-grow: 1;
		min-width: 220px;
		padding: var(--layout-margin);
		overflow: hidden;
		flex-basis: 25%;
		display: flex;
		flex-direction: column;
	}

	.label {
		padding: 3px;
		box-shadow: var(--box-shadow);
		padding-inline: var(--box-margin);
		width: fit-content;
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: var(--content-margin);
		margin-right: var(--content-margin);
		margin-left: 4px;
	}

	.label p {
		font-size: 20px;
	}

	.item-text {
		margin: var(--content-margin);
		margin-inline: var(--content-margin);
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
		min-width: 55px;
	}

	.competition-item-header {
		margin-bottom: 0;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.competition-properties-box {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--box-margin);
		flex-wrap: wrap;
		border-radius: var(--content-margin);
		gap: var(--box-margin);
	}

	.property-item {
		flex-grow: 1;
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		padding: 3px;
		overflow: hidden;
		text-overflow: ellipsis;
		max-height: 39px;
		display: flex;
		align-items: center;
		background-color: var(--box-color);
	}

	.desc-text {
		margin-top: var(--box-margin);
		overflow: hidden;
		max-height: 60px;
		margin-inline: var(--box-margin);
	}

	.competition-author {
		margin-bottom: 30px;
		padding-left: 2px;
		cursor: pointer;
		transition: opacity 250ms ease;
		max-width: 300px;
		text-wrap: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		user-select: none;
		opacity: 0.5;
	}

	.competition-author:hover {
		opacity: 0.25;
	}

	.leaderboard-icon {
		width: 22px;
		height: 22px;
		vertical-align: -2px;
	}

	.text-header-left {
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.expired-competition-color {
		background-color: var(--box-color);
	}

	.competition-area {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		margin-bottom: var(--layout-margin);
		justify-content: flex-start;
	}

	.error-text {
		width: 100%;
		text-align: center;
		opacity: 0.5;
		margin-top: var(--layout-margin);
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
		max-height: min(600px, calc(100dvh - 300px));
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

	.your-item {
		box-shadow: var(--bulb-shadow);
		background-color: rgba(255, 255, 255, 0.2);
		overflow: hidden;
	}

	.rank-you {
		background-color: rgba(255, 255, 255, 0.2);
		box-shadow: var(--bulb-shadow);
	}

	.load-more-item {
		flex-direction: row;
		min-height: 80px;
		justify-content: center;
		align-items: center;
		border: none;
		width: 100%;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	#competition-search {
		transition: background-color 250ms ease;
		padding-inline: var(--box-margin);
		min-width: 0;
		max-width: 225px;
		flex: 1;
		text-overflow: ellipsis;
	}

	#start-search {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	search {
		flex-grow: 1;
		flex-shrink: 1;
		min-width: 0;
		max-width: fit-content;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.fade-in-item {
		animation: fadeIn 250ms ease-in-out;
	}

	.you-bar {
		display: flex;
		gap: var(--box-margin);
		align-items: center;
	}

	.you-label {
		box-shadow: var(--bulb-shadow);
		border-radius: var(--content-margin);
		background-color: rgba(255, 255, 255, 0.2);
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
	}

	.daily-primary {
		background-color: var(--brand-color);
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

	.about-section {
		cursor: pointer;
	}

	:global(.hide-entered-comps-toggle) {
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: auto;
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
		width: calc(100% - calc(var(--box-margin-buttons * 2)));
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

	@media all and (max-width: 1000px) {
		#competition-search {
			max-width: none;
		}

		search {
			max-width: none;
		}
	}
</style>

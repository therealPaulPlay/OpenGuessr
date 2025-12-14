<script>
	import { loadProfileFromId } from "$lib/utils/loadProfile";
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
	import { page } from "$app/state";
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
			const requestBody = {
				id: localStorage.getItem("id"), // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
			};

			const response = await fetch(competitionsEndpoint + "/details/" + id, {
				method: "POST",
				headers: {
					Authorization: "Bearer " + localStorage.getItem("bearer"),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
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
					throw new Error("Error parsing competition details: " + error);
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
			errorPopup("Error entering competition", "An error occured trying to enter a competition", error.message);
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
			const requestBody = {
				id: localStorage.getItem("id"), // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
			};

			const response = await fetch(competitionsEndpoint + "/leaderboard/" + id, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
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
		if (typeof window === "undefined") return; // Exit if not in browser environment
		let urlParams = new URLSearchParams(page.url.search);

		let leaderboardIdFromLink;
		let leaderboardIdFromLinkAfterSubmit;

		// Load leaderboard via link
		try {
			leaderboardIdFromLink = urlParams.get("leaderboard");
			if (leaderboardIdFromLink) {
				openLeaderboard(leaderboardIdFromLink);
				history.replaceState({}, document.title, page.url.pathname); // reset query in the address bar
			}

			leaderboardIdFromLinkAfterSubmit = urlParams.get("leaderboard-submit");
			if (leaderboardIdFromLinkAfterSubmit) {
				openLeaderboard(leaderboardIdFromLinkAfterSubmit, true);
				history.replaceState({}, document.title, page.url.pathname); // reset query in the address bar
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
				history.replaceState({}, document.title, page.url.pathname); //reset query in the address bar
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
			let requestBody = {
				id: localStorage.getItem("id"), // If this is null, that is fine too (used to evaluate whether a user has already played certain competitions)
			};

			if (search) requestBody.search = search;

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

			const response = await fetch(Endpoint, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
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

					document.querySelectorAll(".errorText").forEach((e) => {
						e.textContent = "Error: " + errorMessages.join(" ");
					});
				} catch {
					document.querySelectorAll(".errorText").forEach((e) => {
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

<Popup slim={true} bind:open={leaderboardPopup}>
	<div class="popup-title">
		<h1 id="leaderboardHeader" class="textHeaderLeft">Ranking for <i>{leaderboardName}</i></h1>
	</div>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="rankingDisplay">
		<div class="rankingDisplayScroll of-top of-bottom">
			{#if yourEntry}
				<div class="youBar">
					<p class="youLabel">You:</p>
					<div class="rankItem yourItem">
						<p>#{yourEntry.position}</p>
						<p
							id="yourUsername"
							class="centerEntry"
							onclick={() => {
								loadProfileFromId(localStorage.getItem("id"));
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
					<div class="rankItem" transition:blur class:rankYou={entry.id == localStorage.getItem("id")}>
						<p>#{entry.position}</p>
						<p
							class="centerEntry"
							onclick={() => {
								loadProfileFromId(entry.id);
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
				<div class="emptyLeaderboardBox">
					{#if leaderboardEntries}
						<p class="errorText">No entries yet.</p>
					{:else}
						<p class="errorText">Loading...</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	{#if showRatingBox}
		<div id="ratingBox">
			<p id="ratingText">{ratingText || "Default rating text."}</p>
			{#if ratingsButtonBox}
				<div class="ratingButtonBox" id="ratingButtonBox">
					<button
						class="standardButton white rateButton"
						id="rateGood"
						onclick={() => {
							playSound("basic_button");
							submitRating(5);
						}}
					>
						<Smile size={20} strokeWidth={2.5} style="margin-bottom: -2px;" />
					</button>
					<button
						class="standardButton white rateButton"
						id="rateBad"
						onclick={() => {
							playSound("basic_button");
							submitRating(-3);
						}}
					>
						<Frown size={20} strokeWidth={2.5} style="margin-bottom: -2px;" />
					</button>
					<button
						class="standardButton white rateButton"
						id="rateBroken"
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
	<div class="competitionItem fadeInItem" style:border-radius={daily && expired ? "8px" : ""}>
		<div>
			<h2 class="competitionItemHeader">{name}</h2>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p
				class="competitionAuthor"
				onclick={() => {
					const id = authorId == 0 ? 2 : authorId; // Set to 2 (PaulPlay) if created by System (0)
					loadProfileFromId(id);
				}}
			>
				hosted by {author}
			</p>
		</div>
		<div class="competitionPropertiesBox">
			<div class="propertyItem">
				<div class="label">
					<p>Plays</p>
				</div>
				<p class="itemText">{playercount.toLocaleString()}</p>
			</div>
			<div class="propertyItem">
				<div class="label">
					<p>Restriction</p>
				</div>
				<p class="itemText">{$restrictionNames?.[restriction] || "Invalid"}</p>
			</div>
			<div class="propertyItem">
				<div class="label">
					<p>Duration</p>
				</div>
				<p class="itemText">{formatDuration(duration)} ({formatDuration(remainingDuration)} left)</p>
			</div>
			<div class="propertyItem">
				<div class="label">
					<p>Rounds</p>
				</div>
				<p class="itemText">{locationAmount}</p>
			</div>
			<div class="propertyItem">
				<div class="label">
					<p>Round length</p>
				</div>
				<p class="itemText">{roundLength}s</p>
			</div>
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			id="aboutItem${id}"
			class="aboutSection competitionDescription"
			role="button"
			tabindex="0"
			onclick={() => {
				showConfirmPopup("About", description);
			}}
		>
			<div class="label" class:expiredCompetitionColor={expired} role="button" tabindex="0">
				<p>About</p>
			</div>
			<p class="itemText descText">
				{description}
			</p>
		</div>
		<div class="competitionButtonBox">
			<button
				class="standardButton competitionButton white"
				onclick={() => {
					playSound("basic_button");
					openLeaderboard(id);
				}}
				>Results
				<img class="leaderboardIcon" src="/img/leaderboards_icon.png" alt="Leaderboards for OpenGuessr" />
			</button>
			{#if !expired}
				<button
					class="standardButton competitionButton white"
					class:dailyPrimary={daily}
					disabled={entered || authorId == localStorage.getItem("id")}
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
					}}>{entered ? "Already entered" : authorId == localStorage.getItem("id") ? "Hosted by you" : "Enter"}</button
				>
			{/if}
		</div>
	</div>
{/snippet}

<div class="competitionElement">
	<div class="headerContainer">
		<h2 class="header">Official</h2>
	</div>
	<div id="dailyCompetitionArea" class="competitionArea">
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
					<Drawer title="Yesterday's results" class="fadeInItem">
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
			<p class="errorText">{dailyCompetitionError}</p>
		{/if}
	</div>
</div>
<div class="competitionElement">
	<div class="headerContainer">
		<h2 class="header marginTopAuto">Active</h2>
		<button
			class="standardButton white createButton marginTopAuto"
			onclick={() => {
				playSound("basic_button");
				if ($isAuthenticated) {
					goto("/competitions/create");
				} else {
					signupPrompt();
				}
			}}>+ Create</button
		>
	</div>
	<div class="buttonToolbar">
		<Tabs
			tabs={["All", "Not entered"]}
			class="hideEnteredCompsToggle"
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
				id="competitionSearch"
				bind:value={searchQuery}
				placeholder="Search competitions"
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
				id="startSearch"
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					startSearch();
				}}
			>
				<Search size={20} strokeWidth={2.5} />
			</button>
		</search>
	</div>
	<div id="competitionArea" class="competitionArea">
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
			<p class="errorText">{activeCompetitionError}</p>
		{/if}
	</div>
	{#if loadMoreActive}
		<button
			id="loadMoreActive"
			class="loadMore standardButton white"
			onclick={() => {
				playSound("basic_button");
				getCompetitionsFromServer(false, false, false, hideEntered);
			}}>Show more <Plus size={20} strokeWidth={2.75} style="margin-bottom: -3px; margin-left: 2px;" /></button
		>
	{/if}
</div>
<div class="competitionElement expiredBox">
	<div class="headerContainer">
		<h2 class="header">Recently ended</h2>
	</div>
	<div id="expiredCompetitionArea" class="competitionArea">
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
			<p class="errorText">{expiredCompetitionsError}</p>
		{/if}
	</div>
	{#if loadMoreExpired}
		<button
			class="loadMore standardButton white"
			onclick={() => {
				playSound("basic_button");
				getCompetitionsFromServer(true);
			}}>Show more <Plus size={20} strokeWidth={2.75} style="margin-bottom: -3px;  margin-left: 2px;" /></button
		>
	{/if}
</div>

<svelte:head>
	<title>Competitions</title>
</svelte:head>

<style>
	.buttonToolbar {
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

	.competitionElement {
		transition:
			background-color 250ms ease,
			filter 250ms ease;
		width: 100%;
		overflow: hidden;
		height: auto;
		margin-bottom: calc(2 * var(--layout-margin));
	}

	.competitionButtonBox {
		margin-top: auto !important;
		padding-top: 60px;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--box-margin);
	}

	.marginTopAuto {
		margin-top: auto;
	}

	.emptyLeaderboardBox {
		height: 300px;
		width: 100%;
		display: flex;
		align-items: center;
	}

	#competitionArea,
	#expiredCompetitionArea {
		min-height: 200px;
	}

	.competitionDescription {
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		padding: 7px;
		padding-inline: 4px;
		font-size: 22px;
		transition: filter 250ms ease;
	}

	.competitionItem {
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
		padding-inline: 10px;
		width: fit-content;
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 5px;
		margin-right: 5px;
		margin-left: 4px;
	}

	.label p {
		font-size: 20px;
	}

	.itemText {
		margin: 5px;
		margin-inline: 5px;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
		min-width: 55px;
	}

	.competitionItemHeader {
		margin-bottom: 0;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
		font-size: 35px;
	}

	.competitionPropertiesBox {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--box-margin);
		flex-wrap: wrap;
		border-radius: 5px;
		gap: var(--box-margin);
	}

	.propertyItem {
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

	.descText {
		margin-top: 10px;
		overflow: hidden;
		max-height: 60px;
		margin-inline: 10px;
	}

	.competitionAuthor {
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

	.competitionAuthor:hover {
		opacity: 0.25;
	}

	.leaderboardIcon {
		width: 22px;
		height: 22px;
		vertical-align: -2px;
	}

	.textHeaderLeft {
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	.expiredCompetitionColor {
		background-color: var(--box-color);
	}

	.competitionArea {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		margin-bottom: var(--layout-margin);
		justify-content: flex-start;
	}

	#contentSection {
		transition: max-height 250ms ease-in-out;
		max-height: 0px;
		overflow: hidden;
	}

	.errorText {
		width: 100%;
		text-align: center;
		opacity: 0.5;
		margin-top: var(--layout-margin);
	}

	.rankingDisplay {
		box-sizing: border-box;
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		width: 100%; /* Fix for Safari */
		background-color: var(--box-color);
		padding: var(--box-margin);
		position: relative;
	}

	.rankingDisplayScroll {
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

	.rankItem {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: 5px;
		width: calc(100% - 20px);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px;
		padding-inline: 10px;
		gap: var(--box-margin);
	}

	.rankItem p {
		text-wrap: nowrap;
	}

	.yourItem {
		box-shadow: var(--bulb-shadow);
		background-color: rgba(255, 255, 255, 0.2);
	}

	.rankYou {
		background-color: rgba(255, 255, 255, 0.2);
		box-shadow: var(--bulb-shadow);
	}

	#toggleFaqBar {
		cursor: pointer;
	}

	#inputArea {
		padding: 10px;
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
	}

	#infoNoteIcon {
		width: 35px;
		height: 35px;
		margin-bottom: 20px;
		margin-top: 7px;
		opacity: 0.5;
		margin-left: -10px;
	}

	#createWindow {
		max-width: 900px;
	}

	#uploadHeader {
		text-align: left;
		margin-top: 5px;
		margin-bottom: 30px;
	}

	#uploadFirstText {
		font-size: 25px;
	}

	#uploadCompetitionDescription {
		max-width: 500px;
	}

	#visibilityInfo {
		margin-top: 20px;
		margin-bottom: 20px;
	}

	.loadMore {
		border-radius: var(--box-margin);
		width: 200px;
		padding: var(--box-margin);
		margin-bottom: 30px;
		height: 50px;
		line-height: 1;
		margin-left: calc(50% - 100px);
	}

	search {
		display: flex;
		justify-content: start;
		gap: var(--box-margin);
		overflow: hidden;
	}

	#competitionSearch {
		transition: background-color 250ms ease;
		padding-inline: 10px;
		min-width: 0;
		flex-grow: 1;
		text-overflow: ellipsis;
	}

	#startSearch {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	#searchIcon {
		width: 20px;
		height: 20px;
	}

	.createButton {
		border-radius: var(--box-margin);
		min-height: 50px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.fadeInItem {
		animation: fadeIn 250ms ease-in-out;
	}

	.youBar {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.youLabel {
		box-shadow: var(--bulb-shadow);
		border-radius: 5px;
		background-color: rgba(255, 255, 255, 0.2);
		padding: 5px;
		padding-inline: 10px;
	}

	.dailyPrimary {
		background-color: var(--brand-color);
	}

	#contentSelection {
		overflow: hidden;
	}

	.centerEntry {
		width: 50%;
		text-align: center;
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		mask-image: linear-gradient(to right, transparent, black 0%, black 90%, transparent);
	}

	.centerEntry:hover {
		opacity: 0.5;
	}

	.aboutSection {
		cursor: pointer;
	}

	:global(.hideEnteredCompsToggle) {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	#ratingBox {
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

	#ratingBox p {
		padding-inline: var(--panel-margin);
		opacity: 0.5;
	}

	.rateButton {
		padding-inline: 5px;
	}

	.ratingButtonBox {
		display: flex;
		gap: var(--box-margin);
		justify-content: center;
		align-items: center;
	}

	@media all and (max-width: 800px) {
		.competitionItem {
			flex-grow: 1;
		}

		search {
			flex-grow: 1;
		}

		.competitionButton {
			flex-grow: 1;
		}

		.competitionItemHeader {
			font-size: 27px;
		}
	}
</style>

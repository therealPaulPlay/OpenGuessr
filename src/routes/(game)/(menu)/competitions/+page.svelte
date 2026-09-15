<script>
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { competitionData } from "$lib/stores/context-specific/competitionStore";
	import { loadCompetition } from "$lib/logic/competitionLogic";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { goto } from "$app/navigation";
	import { Plus, Search } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import Drawer from "$lib/components/ui/Drawer.svelte";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
	import { openCompetitionLeaderboard } from "$lib/utils/openCompetitionLeaderboard";
	import { page } from "$app/state";

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

	// Query Links - Enter and Load leaderboard --------------------------------------------------------------------------------------------------------
	$effect(() => {
		const leaderboardIdFromLink = page.url.searchParams.get("leaderboard");
		const competitionIdFromLink = page.url.searchParams.get("enter");

		if (!leaderboardIdFromLink && !competitionIdFromLink) return;

		// Load leaderboard via link
		if (leaderboardIdFromLink) openCompetitionLeaderboard(leaderboardIdFromLink);

		// Enter competition via link
		if (competitionIdFromLink) {
			showConfirmPopup(
				"Enter competition?",
				"This will start the competition from your link. You can only enter a competition once.",
				() => {
					if (!$isAuthenticated) return signupPrompt(() => enterCompetition(competitionIdFromLink));
					enterCompetition(competitionIdFromLink);
				},
			);
		}

		history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
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
		let query = searchQuery?.toLowerCase();
		activeCompetitionsData = [];
		if (hideEntered) hideEntered = false;
		notExpiredIndex = 0; // reset index if starting new search

		getCompetitionsFromServer(false, query);
	}
</script>

<svelte:head>
	<title>Competitions</title>
</svelte:head>

{#snippet showMoreButton(callback)}
	<button
		class="load-more-item standard-button white competition-fade-in-item"
		onclick={() => {
			callback?.();
		}}
	>
		More
		<Plus strokeWidth={2.75} size={20} style="margin-bottom: -4px; margin-left: var(--content-margin);" />
	</button>
{/snippet}

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
	{const yesterdaysDaily = $derived(expired && daily)}
	<div
		class="competition-item competition-fade-in-item"
		style:border-radius={yesterdaysDaily ? "8px" : ""}
		style:box-shadow={yesterdaysDaily ? "var(--box-shadow)" : ""}
		class:daily-competition-item={daily}
	>
		<div>
			{#if !expired && daily}
				<img alt="Mascot with clock" src="/img/mascot_with_clock.png" class="clock-mascot" />
			{/if}
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
				<div class="label white-soft">
					<p>Plays</p>
				</div>
				<p class="item-text of-left of-right">{playercount.toLocaleString()}</p>
			</div>
			<div class="property-item">
				<div class="label white-soft">
					<p>Restriction</p>
				</div>
				<p class="item-text of-left of-right">{$restrictionNames?.[restriction] || "Invalid"}</p>
			</div>
			<div class="property-item">
				<div class="label white-soft">
					<p>Duration</p>
				</div>
				<p class="item-text of-left of-right">
					{formatDuration(duration)}
					{#if remainingDuration > 0}
						<span class="remaining-duration-text">
							({formatDuration(remainingDuration)} left)
						</span>
					{/if}
				</p>
			</div>
			<div class="property-item">
				<div class="label white-soft">
					<p>Rounds</p>
				</div>
				<p class="item-text of-left of-right">{locationAmount}</p>
			</div>
			<div class="property-item">
				<div class="label white-soft">
					<p>Round length</p>
				</div>
				<p class="item-text of-left of-right">{roundLength}s</p>
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="desc-section competition-description"
			role="button"
			tabindex="0"
			onclick={() => {
				showConfirmPopup("About", description);
			}}
		>
			<div class="label white-soft" role="button" tabindex="0">
				<p>Description</p>
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
					openCompetitionLeaderboard(id);
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

						const action = () => {
							showConfirmPopup("Enter " + name + "?", "You can only enter a competition once.", () => {
								enterCompetition(id);
							});
						};

						if ($isAuthenticated) action();
						else signupPrompt(action);
					}}
					>{entered
						? "Entered"
						: authorId != null && authorId == localStorage.getItem("id")
							? "Hosted by you"
							: "Enter"}</button
				>
			{/if}
		</div>
	</div>
{/snippet}

<div class="competition-container">
	<div class="header-container">
		<h2 class="header">Official</h2>
	</div>
	<div class="competition-area">
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
					<Drawer
						title="Yesterday's results"
						class="competition-fade-in-item daily-competition-item"
						hasBottomLayoutMargin={false}
					>
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
<div class="competition-container">
	<div class="header-container">
		<h2 class="header">Active</h2>
	</div>
	<div class="button-toolbar">
		<button
			class="standard-button white"
			onclick={() => {
				playSound("basic_button");
				if ($isAuthenticated) goto("/competitions/create");
				else signupPrompt(() => goto("/competitions/create"));
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
		{#if loadMoreActive}
			{@render showMoreButton(() => {
				playSound("basic_button");
				getCompetitionsFromServer(false, false, false, hideEntered);
			})}
		{/if}
	</div>
</div>
<div class="competition-container expired-box">
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
		{#if loadMoreExpired}
			{@render showMoreButton(() => {
				playSound("basic_button");
				getCompetitionsFromServer(true);
			})}
		{/if}
	</div>
</div>

<style>
	.button-toolbar {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--panel-shadow);
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

	.clock-mascot {
		position: absolute;
		top: -82px;
		width: 140px;
		right: 40px;
		rotate: -2deg;
		pointer-events: none;
		user-select: none;
	}

	.competition-container {
		transition:
			background-color 250ms ease,
			filter 250ms ease;
		width: 100%;
		overflow: hidden;
		height: auto;
		margin-bottom: var(--layout-spacer);
	}

	.competition-button-box {
		margin-top: auto !important;
		padding-top: 60px;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--box-margin);
	}

	#competition-area,
	#expired-competition-area {
		min-height: 200px;
		margin-bottom: var(--layout-margin);
		grid-auto-rows: 1fr;
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
		box-shadow: var(--panel-shadow);
		transition:
			background-color 250ms ease,
			filter 250ms ease,
			opacity 250ms ease;
		width: 100%;
		padding: var(--layout-margin);
		display: flex;
		flex-direction: column;
		position: relative;
		box-sizing: border-box;
	}

	:global(.daily-competition-item) {
		grid-column: 1 / -1;
	}

	.label {
		padding: 3px;
		box-shadow: var(--box-shadow);
		padding-inline: var(--panel-margin);
		width: fit-content;
		border-radius: var(--content-margin);
		margin-right: var(--content-margin);
		margin-left: 4px;
	}

	.label p {
		font-size: 20px;
	}

	.item-text {
		margin: var(--content-margin);
		margin-right: var(--panel-margin);
		overflow-x: auto;
		text-wrap: nowrap;
		min-width: 55px;
		scrollbar-width: none;
	}

	.remaining-duration-text {
		opacity: 0.5;
		display: inline-block;
		vertical-align: bottom;
		margin-left: 2px;
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
		margin-top: var(--panel-margin);
		overflow: hidden;
		max-height: 60px;
		margin-inline: var(--panel-margin);
		text-overflow: ellipsis;
		overflow: hidden;
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

	.competition-area {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
		gap: var(--layout-margin);
	}

	.error-text {
		width: 100%;
		text-align: center;
		opacity: 0.5;
		margin-top: var(--layout-margin);
		grid-column: 1 / -1;
	}

	.load-more-item {
		min-height: 60px;
		justify-content: center;
		align-items: center;
		border: none;
		width: 100%;
		height: 100%;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
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

	:global(.competition-fade-in-item) {
		animation: fadeIn 250ms ease-in-out;
	}

	.daily-primary {
		background-color: var(--brand-color);
	}

	.desc-section {
		cursor: pointer;
	}

	:global(.hide-entered-comps-toggle) {
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: auto;
	}

	@media all and (max-width: 1000px) {
		#competition-search {
			max-width: none;
		}

		search {
			max-width: none;
		}

		.clock-mascot {
			right: 0;
		}
	}
</style>

<script>
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { isAuthenticated, username } from "$lib/stores/accountStore";
	import { playSound } from "$lib/utils/soundManager";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import SupporterTag from "$lib/components/SupporterTag.svelte";
	import { Info } from "@lucide/svelte";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";

	let loadingText = $state("Loading...");

	// API ----------------------------------------------------------------------------------------------------------------------------
	async function getLeaderboard() {
		try {
			const response = await fetch(`${$apiUrl}/leaderboard/experience`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				return data;
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			console.error("Failed to fetch the experience leaderboard: ", error);
			loadingText = "Error: " + error.message;
		}
	}

	async function getUserLeaderboard() {
		try {
			const response = await fetch(`${$apiUrl}/leaderboard/experience-user-section`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("bearer"),
				},
				body: JSON.stringify({
					id: localStorage.getItem("id"),
				}),
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				return data;
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			console.error("Failed to fetch the experience user section of the leaderboard: ", error);
		}
	}

	async function getEloLeaderboard() {
		try {
			const response = await fetch(`${$apiUrl}/leaderboard/elo`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Check if the response is successful
			if (response.ok) {
				const data = await response.json();
				return data;
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			console.error("Failed to fetch the elo leaderboard: ", error);
			loadingText = "Error: " + error.message;
		}
	}

	// Add leaderboar entries --------------------------------------------------------------------------------------------------------
	let mainSectionEntries = $state();
	let userSectionEntries = $state();

	// Load leaderboard data -------------------------------------------------------------------------------------------------------
	async function loadLeaderboard(leaderboardType) {
		loadingText = "Loading...";
		switch (leaderboardType) {
			case "elo":
				mainSectionEntries = await getEloLeaderboard();
				break;
			case "experience":
				mainSectionEntries = await getLeaderboard();
				break;
		}
	}

	let potentialUserLeaderboardType = $state("none");

	// A section to show where the user is at, as well as a few others above them ------------------------------------------------------
	async function loadUserLeaderboard(leaderboardType) {
		potentialUserLeaderboardType = "none"; // Reset user leaderboard as it is now (soon) loaded

		if ($isAuthenticated) {
			switch (leaderboardType) {
				case "experience":
					userSectionEntries = await getUserLeaderboard();
					break;
				default:
					return;
			}
		}
	}

	// Check if user section is in view -------------------------------------------------------------------------------------
	let scrollTimeout;

	function checkIfUserSectionIsInView() {
		// If the user has scrolled down more than 1000px, load the user leaderboard section (which is at the end)
		if (window.scrollY > 1000 && potentialUserLeaderboardType) {
			loadUserLeaderboard(potentialUserLeaderboardType);
		}
	}

	// Filter / Sort Options -------------------------------------------------------------------------------------------------
	let filter = $state("Elo");
	let valueKey = $state("");
	let unitName = $state("");

	function loadCorrectLeaderboard() {
		mainSectionEntries = undefined;
		userSectionEntries = undefined;

		switch (filter) {
			case "Elo":
				loadLeaderboard("elo");
				valueKey = "elo";
				unitName = " Elo";
				potentialUserLeaderboardType = "none";
				break;
			case "XP":
				loadLeaderboard("experience");
				valueKey = "experience";
				unitName = " XP";
				potentialUserLeaderboardType = "experience";
				break;
		}
	}

	let userId = $state();

	onMount(() => {
		userId = localStorage.getItem("id");
		loadCorrectLeaderboard();
	});
</script>

<svelte:head>
	<title>Leaderboard</title>
</svelte:head>

<svelte:window
	onscroll={() => {
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			checkIfUserSectionIsInView();
		}, 150);
	}}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="leaderboardContainer">
	<div class="podium-container">
		<div class="optionBarContainer">
			<div class="optionBarItem barMenu">
				<button
					class="standardButton white largeButton"
					onclick={() => {
						playSound("basic_button");
						showConfirmPopup(
							"Resets",
							`Elo above ${Number(2000).toLocaleString()} is halved at the start of each month, and the deducted amount is converted into tokens.. Experience over 100M is halved at the start of each month.`,
						);
					}}
				>
					<Info style="vertical-align: -3px" />
				</button>
			</div>
			<div class="optionBarItem barMenu">
				<Tabs
					tabs={["Elo", "XP"]}
					class="leaderboardTabs"
					onchange={(selection) => {
						filter = selection;
						loadCorrectLeaderboard();
						playSound("basic_button");
					}}
				/>
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div id="podium" class="podium" class:podium-loaded={Boolean(mainSectionEntries)}>
			<div class="podium-item" id="second-place">
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<h3
					class="name"
					onclick={() => {
						loadProfileFromId(mainSectionEntries?.[1]?.id);
					}}
				>
					{mainSectionEntries?.[1]?.user_name || "Guest"}
				</h3>
				<div class="podium-pedestal silver">
					<h3 class="podiumValue">{(mainSectionEntries?.[1]?.[valueKey]?.toLocaleString() || "...") + unitName}</h3>
					<h3 class="rank">#2</h3>
				</div>
			</div>
			<div class="podium-item" id="first-place">
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<h3
					class="name"
					onclick={() => {
						loadProfileFromId(mainSectionEntries?.[0]?.id);
					}}
				>
					{mainSectionEntries?.[0]?.user_name || "Guest"}
				</h3>
				<div class="podium-pedestal gold">
					<span class="podiumValue">{(mainSectionEntries?.[0]?.[valueKey]?.toLocaleString() || "...") + unitName}</span>
					<h3 class="rank">#1</h3>
				</div>
			</div>
			<div class="podium-item" id="third-place">
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<h3
					class="name"
					onclick={() => {
						loadProfileFromId(mainSectionEntries?.[2]?.id);
					}}
				>
					{mainSectionEntries?.[2]?.user_name || "Guest"}
				</h3>
				<div class="podium-pedestal bronze">
					<span class="podiumValue">{(mainSectionEntries?.[2]?.[valueKey]?.toLocaleString() || "...") + unitName}</span>
					<h3 class="rank">#3</h3>
				</div>
			</div>
		</div>
	</div>
	{#if mainSectionEntries}
		<div class="item-container" transition:fade={{ duration: 150 }}>
			{#each mainSectionEntries.slice(3) as entry, i}
				<div class="rankedItem" role="button" tabindex="0" class:yourItem={entry.id == userId && $isAuthenticated}>
					<p class="maxlength rankedItemLeft">#{entry.position}</p>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						class="middle maxlength"
						onclick={() => {
							loadProfileFromId(entry.id);
						}}
					>
						{entry.user_name}
						{#if entry.supporter_level >= 1}
							<SupporterTag />
						{/if}
					</p>
					<p class="maxlength rankedItemRight">{entry?.[valueKey]?.toLocaleString() + unitName}</p>
				</div>
			{/each}
		</div>
	{:else}
		<p class="loadingText">{loadingText}</p>
	{/if}
	{#if userSectionEntries}
		<div id="threeDotsContainer" class="threeDotsContainer" transition:fade={{ duration: 250 }}>
			<div class="circleDot"></div>
			<div class="circleDot"></div>
			<div class="circleDot"></div>
		</div>
		<div id="yourLeagueContainer" class="item-container">
			{#each userSectionEntries as entry, i}
				<div class="rankedItem" role="button" tabindex="0" class:yourItem={entry.id == userId && $isAuthenticated}>
					<p class="maxlength rankedItemLeft">#{entry.position}</p>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						class="middle maxlength"
						onclick={() => {
							loadProfileFromId(entry.id);
						}}
					>
						{entry.user_name}
						{#if entry.supporter_level >= 1}
							<SupporterTag />
						{/if}
					</p>
					<p class="maxlength rankedItemRight">{entry?.[valueKey]?.toLocaleString() + unitName}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.loadingText {
		color: white;
		font-size: 22px;
		opacity: 0.5;
		width: 100%;
		text-align: center;
		margin-top: var(--box-margin);
	}

	.optionBarItem {
		width: fit-content;
		max-width: 80%;
		border-radius: var(--layout-margin);
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
	}

	:global(.leaderboardTabs) {
		border-radius: var(--box-margin) !important;
		min-height: 50px;
	}

	:global(.leaderboardTabs button) {
		opacity: 0.5;
		width: 65px;
	}

	.rankedItem {
		width: 100%;
		height: 50px;
		box-shadow: var(--box-shadow);
		background-color: rgba(255, 255, 255, 0.1);
		box-sizing: border-box;
		border-radius: var(--layout-margin);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-inline: 25px;
		white-space: nowrap;
		color: white;
	}

	.middle {
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		text-align: center;
		mask-image: linear-gradient(to right, transparent, black 0%, black 90%, transparent);
	}

	.middle:hover {
		opacity: 0.5;
	}

	.gold {
		background-color: rgba(255, 205, 0, 0.85);
	}

	.silver {
		background-color: rgba(223, 227, 238, 0.5);
	}

	.bronze {
		background-color: rgba(189, 87, 87, 0.5);
	}

	.yourItem {
		box-shadow: var(--bulb-shadow);
		background-color: rgba(255, 255, 255, 0.3);
	}

	.maxlength {
		max-width: 40%;
		flex-grow: 1;
		flex-basis: 0;
	}

	.rankedItemLeft {
		text-align: left;
	}

	.rankedItemRight {
		text-align: right;
	}

	.leaderboardContainer {
		border-radius: 20px;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-bottom: 80px;
		max-width: 850px;
		margin-inline: auto;
	}

	.podium-container {
		display: flex;
		justify-content: center;
		margin-bottom: var(--layout-margin);
		border-radius: calc(var(--layout-margin) * 2);
		background: linear-gradient(var(--box-color), transparent 50%);
		padding: var(--layout-margin);
		padding-bottom: 35px;
		gap: 50px;
		position: relative;
		flex-wrap: wrap;
		box-shadow: var(--box-shadow-top);
		width: 100%;
		overflow: hidden;
	}

	.optionBarContainer {
		display: flex;
		justify-content: end;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
		gap: var(--layout-margin);
	}

	.podium {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: 250px;
		width: 100%;
		max-width: 600px;
		gap: var(--layout-margin);
		position: relative;
		transform: scale(0.9);
		opacity: 0.3;
		transition:
			opacity 250ms ease,
			transform 250ms ease;
	}

	.podium-loaded {
		opacity: 1;
		transform: scale(1);
	}

	.podium-item {
		flex-grow: 1;
		margin-inline: var(--box-margin);
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-basis: 33%;
		position: relative;
		overflow: hidden;
	}

	.podium-pedestal {
		padding: var(--layout-margin);
		flex-grow: 1;
		width: 100%;
		border-radius: var(--layout-margin);
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
		align-items: center;
		box-shadow: var(--box-shadow);
		overflow: hidden;
		transition:
			filter 250ms ease,
			height 250ms ease,
			width 250ms ease;
	}

	#first-place {
		height: 260px;
	}

	#second-place {
		height: 220px;
		margin-left: 0;
	}

	#third-place {
		height: 190px;
		margin-right: 0;
	}

	.podium-item .name {
		padding: var(--content-margin);
		text-align: center;
		color: white;
		margin-top: auto;
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		max-width: 100%;
		cursor: pointer;
		transition: opacity 250ms ease;
		margin-bottom: var(--box-margin);
	}

	.podium-item .name:hover {
		opacity: 0.5;
	}

	.podium-item .rank {
		color: white;
		margin-bottom: var(--content-margin);
	}

	.podium-item .podiumValue {
		font-size: 25px;
		color: white;
		margin: auto 0;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		border-radius: var(--content-margin);
		opacity: 0.75;
		max-width: 100%;
		background-color: var(--box-color-dark-soft);
		padding-inline: var(--content-margin);
	}

	#yourLeagueContainer {
		margin-top: 25px;
		min-height: 30px;
	}

	.item-container {
		width: 100%;
		gap: var(--layout-margin);
		display: flex;
		flex-direction: column;
	}

	.threeDotsContainer {
		overflow: hidden;
		justify-content: center;
		gap: var(--layout-margin);
		width: 100%;
		margin-top: 25px;
		display: flex;
	}

	.circleDot {
		padding: 6px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--bulb-shadow);
	}

	@media (max-width: 800px) {
		.podium-item {
			border-radius: var(--box-margin);
		}

		.podium-item .rank {
			font-size: 20px;
		}

		.podium-item .podiumValue {
			font-size: 20px;
		}

		#first-place {
			height: 200px;
		}

		#second-place {
			height: 165px;
		}

		#third-place {
			height: 150px;
		}

		.podium {
			height: 180px;
			gap: var(--content-margin);
		}

		.maxlength {
			flex-basis: unset;
		}
	}
</style>

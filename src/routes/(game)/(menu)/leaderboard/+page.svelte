<script>
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { isAuthenticated, username } from "$lib/stores/accountStore";
	import { playSound } from "$lib/utils/soundManager";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";

	let loadingText = $state("Loading...");

	// API ----------------------------------------------------------------------------------------------------------------------------
	async function getLeaderboard() {
		try {
			const response = await fetch(`${$accountUrl}/leaderboard/experience`, {
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
			let id = localStorage.getItem("id");

			const response = await fetch(`${$accountUrl}/leaderboard/experience-user-section/${id}`, {
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
			console.error("Failed to fetch the experience user section of the leaderboard: ", error);
		}
	}

	async function getSupporterLeaderboard() {
		try {
			const response = await fetch(`${$accountUrl}/leaderboard/experience-supporter`, {
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
			console.error("Error occurred while fetching the user: ", error);
			loadingText = "Error: " + error.message;
		}
	}

	async function getEloLeaderboard() {
		try {
			const response = await fetch(`${$accountUrl}/leaderboard/elo`, {
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
			case "experience-supporter":
				mainSectionEntries = await getSupporterLeaderboard();
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
			case "XP (Supp.)":
				loadLeaderboard("experience-supporter");
				valueKey = "experience";
				unitName = " XP";
				potentialUserLeaderboardType = "none";
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

<svelte:document
	onscroll={() => {
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			checkIfUserSectionIsInView();
		}, 150);
	}}
/>

<div class="podium-container">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div id="podium" class="podium" class:podium-loaded={Boolean(mainSectionEntries)}>
		<div
			class="podium-item silver"
			id="second-place"
			onclick={() => {
				loadProfileFromId(mainSectionEntries?.[1]?.id, true);
			}}
		>
			<div class="name">{mainSectionEntries?.[1]?.user_name || "Guest"}</div>
			<div class="podiumExp">{(mainSectionEntries?.[1]?.[valueKey]?.toLocaleString() || "...") + unitName}</div>
			<div class="rank">#2</div>
		</div>
		<div
			class="podium-item gold"
			id="first-place"
			onclick={() => {
				loadProfileFromId(mainSectionEntries?.[0]?.id, true);
			}}
		>
			<div class="name">{mainSectionEntries?.[0]?.user_name || "Guest"}</div>
			<div class="podiumExp">{(mainSectionEntries?.[0]?.[valueKey]?.toLocaleString() || "...") + unitName}</div>
			<div class="rank">#1</div>
		</div>
		<div
			class="podium-item bronze"
			id="third-place"
			onclick={() => {
				loadProfileFromId(mainSectionEntries?.[2]?.id, true);
			}}
		>
			<div class="name">{mainSectionEntries?.[2]?.user_name || "Guest"}</div>
			<div class="podiumExp">{(mainSectionEntries?.[2]?.[valueKey]?.toLocaleString() || "...") + unitName}</div>
			<div class="rank">#3</div>
		</div>
	</div>
</div>
<div class="optionBar">
	<Tabs
		tabs={["Elo", "XP", "XP (Supp.)"]}
		class="leaderboardTabs"
		onchange={(selection) => {
			filter = selection;
			loadCorrectLeaderboard();
			playSound("basic_button");
		}}
	/>
</div>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="leaderboardContainer">
	{#if mainSectionEntries}
		<div class="item-container" transition:fade={{ duration: 150 }}>
			{#each mainSectionEntries.slice(3) as entry, i}
				<div
					class="rankedItem"
					role="button"
					tabindex="0"
					class:yourItem={entry.id == userId && $isAuthenticated}
					class:rankedItemSupporter={entry.supporter_level >= 1}
				>
					<p class="maxlength rankedItemLeft">#{entry.position}</p>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						class="middle maxlength"
						onclick={() => {
							loadProfileFromId(entry.id, true);
						}}
					>
						{entry.user_name}
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
				<div
					class="rankedItem"
					role="button"
					tabindex="0"
					class:yourItem={entry.id == userId && $isAuthenticated}
					class:rankedItemSupporter={entry.supporter_level >= 1}
					onclick={() => {
						loadProfileFromId(entry.id, true);
					}}
				>
					<p class="maxlength rankedItemLeft">#{entry.position}</p>
					<p class="middle maxlength">{entry.user_name}</p>
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
		margin-top: 10px;
	}

	.optionBar {
		display: flex;
		align-items: center;
		padding: var(--panel-margin);
		margin-inline: auto;
		width: fit-content;
		max-width: 80%;
	}

	:global(.leaderboardTabs) {
		border-radius: 10px !important;
	}

	:global(.leaderboardTabs button) {
		min-height: 25px;
		opacity: 0.5;
		width: 130px;
	}

	.rankedItem {
		width: 100%;
		height: 45px;
		box-shadow: var(--box-shadow);
		background-color: rgba(255, 255, 255, 0.1);
		box-sizing: border-box;
		border-radius: 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-inline: 25px;
		white-space: nowrap;
		color: white;
		font-size: 25px;
	}

	.rankedItemSupporter {
		box-sizing: border-box;
		border: 3px solid var(--supporter-green);
		border-bottom: 3px solid var(--supporter-green-soft);
		position: relative;
	}

	.rankedItemSupporter::before {
		animation: supporterGlint 5s 2s infinite;
		background: linear-gradient(90deg, #00ff1c00 1%, rgb(196, 255, 206) 50%, #00ff3400);
		border-radius: inherit;
		content: "";
		height: 3px;
		inset: -3px;
		opacity: 0;
		position: absolute;
		transform: translate(0);
		width: 50%;
		z-index: 1;
	}

	@keyframes supporterGlint {
		10% {
			opacity: 1;
		}

		20% {
			opacity: 0;
			transform: translate(100%);
		}

		21% {
			opacity: 0;
			transform: translate(100%, 42px);
		}

		30% {
			opacity: 1;
		}

		40% {
			opacity: 0;
			transform: translateY(42px);
		}

		41% {
			opacity: 0;
			transform: translate(0);
		}

		50% {
			opacity: 1;
		}

		60% {
			opacity: 0;
			transform: translate(100%);
		}
	}

	.middle {
		transition: opacity 250ms ease;
		cursor: pointer;
		user-select: none;
		text-align: center;
	}

	.middle:hover {
		opacity: 0.5;
	}

	.gold {
		background-color: #caa128;
	}

	.silver {
		background-color: #898993;
	}

	.bronze {
		background-color: #803b3b;
	}

	.yourItem {
		box-shadow: var(--bulb-shadow);
		background-color: rgba(255, 255, 255, 0.3);
	}

	.maxlength {
		max-width: 42%;
		text-overflow: ellipsis;
		overflow: hidden;
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
		margin-top: 22px;
		margin-bottom: 30px;
		max-width: 850px;
		margin-inline: auto;
	}

	.podium-container {
		display: flex;
		justify-content: center;
		margin-top: 120px;
		margin-bottom: 30px;
	}

	.podium {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: 250px;
		width: 70vw;
		max-width: 650px;
		gap: 20px;
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
		margin: 0 10px;
		display: flex;
		box-shadow: var(--button-shadow);
		flex-direction: column;
		align-items: center;
		border-radius: 15px;
		cursor: pointer;
		transition:
			filter 250ms ease,
			height 250ms ease,
			width 250ms ease;
		border: solid 3px rgba(255, 255, 255, 0.2);
		max-width: 25%;
	}

	.podium-item:hover {
		filter: brightness(1.2);
	}

	#first-place {
		height: 200px;
		flex-grow: 1.5;
	}

	#second-place {
		height: 170px;
	}

	#third-place {
		height: 140px;
	}

	.podium-item .name {
		padding: 5px;
		text-align: center;
		color: white;
		font-size: 25px;
		word-break: break-word;
		position: relative;
		top: -55px;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		max-width: 100%;
	}

	.podium-item .rank {
		font-size: 30px;
		color: white;
		margin-bottom: 20px;
	}

	.podium-item .podiumExp {
		font-size: 25px;
		color: white;
		margin-top: auto;
		margin-bottom: auto;
		max-width: 17vw;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		opacity: 0.75;
		border-radius: 5px;
		background-color: rgba(0, 0, 0, 0.1);
		padding-inline: 5px;
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
		gap: 15px;
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

	@media all and (orientation: portrait) {
		.podium-item {
			border-radius: 10px;
		}

		.podium-item .rank {
			font-size: 20px;
		}

		.podium-item .podiumExp {
			font-size: 18px;
		}

		#first-place {
			height: 160px;
		}

		#second-place {
			height: 130px;
		}

		#third-place {
			height: 110px;
		}

		.podium {
			width: 85vw;
			height: 150px;
			gap: 5px;
		}

		.maxlength {
			flex-basis: unset;
		}
	}
</style>

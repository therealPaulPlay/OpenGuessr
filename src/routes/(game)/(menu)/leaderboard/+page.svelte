<script>
	import { showProfile } from "$lib/utils/showProfile";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { playSound } from "$lib/utils/soundManager";
	import { onMount } from "svelte";
	import { blur, fade } from "svelte/transition";
	import Tabs from "$lib/components/ui/Tabs.svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import SupporterTag from "$lib/components/SupporterTag.svelte";
	import { EllipsisVertical } from "@lucide/svelte";
	import Popup from "$lib/components/ui/Popup.svelte";
	import TitleSeparator from "$lib/components/ui/TitleSeparator.svelte";
	import InfoBanner from "$lib/components/InfoBanner.svelte";

	let loadingText = $state("Loading...");

	// API ----------------------------------------------------------------------------------------------------------------------------
	async function getExperienceLeaderboard() {
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

	async function getExperienceUserLeaderboard() {
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

	async function getEloUserLeaderboard(onlyActive = false) {
		try {
			const response = await fetch(`${$apiUrl}/leaderboard/elo-${onlyActive ? "active-" : ""}user-section`, {
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
			console.error("Failed to fetch the Elo user section of the leaderboard: ", error);
		}
	}

	async function getEloLeaderboard(onlyActive = false) {
		try {
			const response = await fetch(`${$apiUrl}/leaderboard/elo${onlyActive ? "-active" : ""}`, {
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
			console.error("Failed to fetch the Elo leaderboard: ", error);
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
				mainSectionEntries = await getEloLeaderboard(false);
				break;
			case "elo-active":
				mainSectionEntries = await getEloLeaderboard(true);
				break;
			case "experience":
				mainSectionEntries = await getExperienceLeaderboard();
				break;
		}
	}

	let userLeaderboardType = $state("none");

	// A section to show where the user is at, as well as a few others above them ------------------------------------------------------
	let userSectionRequested = false;

	async function loadUserLeaderboard(leaderboardType) {
		if (leaderboardType === "none") return;
		userSectionRequested = true;

		if ($isAuthenticated) {
			switch (leaderboardType) {
				case "elo":
					userSectionEntries = await getEloUserLeaderboard(false);
					break;
				case "elo-active":
					userSectionEntries = await getEloUserLeaderboard(true);
					break;
				case "experience":
					userSectionEntries = await getExperienceUserLeaderboard();
					break;
			}
		}
	}

	// Check if user section is in view -------------------------------------------------------------------------------------
	let scrollTimeout;

	function checkIfUserSectionIsInView() {
		// If the user has scrolled down more than 1000px, load the user leaderboard section (which is at the end)
		if (window.scrollY > 1000 && !userSectionRequested) {
			loadUserLeaderboard(userLeaderboardType);
		}
	}

	// Filter / Sort Options -------------------------------------------------------------------------------------------------
	let filter = $state("Elo");
	let valueKey = $state("");
	let unitName = $state("");

	function loadCorrectLeaderboard() {
		mainSectionEntries = undefined;
		userSectionEntries = undefined;
		userSectionRequested = false;

		switch (filter) {
			case "Elo":
				eloShowActiveOnly ? loadLeaderboard("elo-active") : loadLeaderboard("elo");
				userLeaderboardType = eloShowActiveOnly ? "elo-active" : "elo";
				valueKey = "elo";
				unitName = " Elo";
				break;
			case "XP":
				loadLeaderboard("experience");
				userLeaderboardType = "experience";
				valueKey = "experience";
				unitName = " XP";
				break;
		}
	}

	let userId = $state();

	onMount(() => {
		userId = localStorage.getItem("id");
		loadCorrectLeaderboard();
	});

	// Leaderboard popup ------------------------------------------------
	let leaderboardMenu = $state(false);
	let eloActiveSelection = $state("All");
	let eloShowActiveOnly = $derived(eloActiveSelection == "Only active");

	// Dynamic podium scale -----------------------------------------------
	let podiumContainerEl = $state();
	let podiumEl = $state();
	let scale = $state(1);
	let podiumHeight = $state(0);
	let initialScaleSet = $state(false);

	onMount(() => {
		const observer = new ResizeObserver(calculatePodiumScale);
		observer.observe(podiumContainerEl);
		observer.observe(podiumEl);

		return () => {
			observer.disconnect();
		};
	});

	function calculatePodiumScale() {
		if (!podiumContainerEl || !podiumEl) return;
		const width = podiumContainerEl.getBoundingClientRect().width;
		const newScale = Math.min(1, (width / 800) * 1.2);
		scale = newScale;
		podiumHeight = podiumEl.offsetHeight;
		if (!initialScaleSet) initialScaleSet = true;
	}

	function formatPodiumValue(number) {
		if (number == null || number === false) return null;
		if (number < 10_000) return number.toLocaleString();
		return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(number);
	}
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

<Popup verySlim={true} bind:open={leaderboardMenu}>
	<div class="popup-title">
		<h1>More</h1>
	</div>
	<TitleSeparator text="Resets" />
	<p class="popup-description">
		At the start of each month, Elo above 2k and experience above 100M are halved. The deducted Elo amount is converted
		into tokens.
	</p>
	<TitleSeparator text="Elo" />
	<div class="activity-box">
		<p style="padding-inline: var(--content-margin)">Player visibility</p>
		<Tabs
			class="elo-active-tabs"
			tabs={["All", "Only active"]}
			bind:selected={eloActiveSelection}
			onchange={(_selection) => {
				loadCorrectLeaderboard();
				playSound("basic_button");
			}}
		/>
	</div>
</Popup>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="leaderboard-container">
	<div class="podium-container" bind:this={podiumContainerEl}>
		<div class="option-bar-container">
			<div class="option-bar-item bar-menu">
				<button
					class="standard-button white large-button"
					onclick={() => {
						playSound("basic_button");
						leaderboardMenu = true;
					}}
				>
					<EllipsisVertical style="vertical-align: -3px" />
				</button>
			</div>
			<div class="option-bar-item bar-menu">
				<Tabs
					tabs={["Elo", "XP"]}
					class="leaderboard-tabs"
					onchange={(selection) => {
						filter = selection;
						loadCorrectLeaderboard();
						playSound("basic_button");
					}}
				/>
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			id="podium"
			class="podium"
			class:podium-loaded={Boolean(mainSectionEntries)}
			bind:this={podiumEl}
			style:scale
			style:--podium-scale={scale}
			style:--podium-height="{podiumHeight}px"
			style:opacity={initialScaleSet ? "" : 0}
		>
			<img alt="podium illustration" src="/img/podium_illustration.png" class="podium-image" />
			<div class="podium-item-container">
				<div class="podium-item" id="second-place-item">
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<h3
						class="name"
						onclick={() => {
							showProfile(mainSectionEntries?.[1]?.id);
						}}
					>
						{mainSectionEntries?.[1]?.user_name || "Guest"}
					</h3>
					<div class="podium-pedestal" id="second-place">
						<h3 class="podium-value">
							{(formatPodiumValue(mainSectionEntries?.[1]?.[valueKey]) || "...") + unitName}
						</h3>
					</div>
				</div>
				<div class="podium-item" id="first-place-item">
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<h3
						class="name"
						onclick={() => {
							showProfile(mainSectionEntries?.[0]?.id);
						}}
					>
						{mainSectionEntries?.[0]?.user_name || "Guest"}
					</h3>
					<div class="podium-pedestal" id="first-place">
						<span class="podium-value"
							>{(formatPodiumValue(mainSectionEntries?.[0]?.[valueKey]) || "...") + unitName}</span
						>
					</div>
				</div>
				<div class="podium-item" id="third-place-item">
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<h3
						class="name"
						onclick={() => {
							showProfile(mainSectionEntries?.[2]?.id);
						}}
					>
						{mainSectionEntries?.[2]?.user_name || "Guest"}
					</h3>
					<div class="podium-pedestal" id="third-place">
						<span class="podium-value"
							>{(formatPodiumValue(mainSectionEntries?.[2]?.[valueKey]) || "...") + unitName}</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
	{#if mainSectionEntries}
		<div class="item-container" transition:fade={{ duration: 150 }}>
			{#if userLeaderboardType == "elo-active"}
				<InfoBanner text="Inactive players are hidden." inPage={true} center={true} />
			{/if}
			{#each mainSectionEntries.slice(3) as entry}
				<div
					class="ranked-item white-soft"
					role="button"
					tabindex="0"
					class:your-item={entry.id == userId && $isAuthenticated}
				>
					<p class="maxlength ranked-item-left">#{entry.position}</p>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						class="middle maxlength"
						onclick={() => {
							showProfile(entry.id);
						}}
					>
						{entry.user_name}
						{#if entry.supporter_level >= 1}
							<SupporterTag />
						{/if}
					</p>
					<p class="maxlength ranked-item-right">{entry?.[valueKey]?.toLocaleString() + unitName}</p>
				</div>
			{/each}
		</div>
	{:else}
		<p class="loading-text">{loadingText}</p>
	{/if}
	{#if userSectionEntries}
		<div id="three-dots-container" class="three-dots-container" transition:blur>
			<div class="circle-dot white-soft"></div>
			<div class="circle-dot white-soft"></div>
			<div class="circle-dot white-soft"></div>
		</div>
		<div id="your-league-container" class="item-container" transition:blur>
			{#if !userSectionEntries.find((u) => u.id == localStorage.getItem("id"))?.isActive && userLeaderboardType === "elo-active"}
				<InfoBanner text="You're inactive. Play a duel to see your actual rank." inPage={true} center={true} />
			{/if}
			{#each userSectionEntries as entry}
				<div
					class="ranked-item white-soft"
					role="button"
					tabindex="0"
					class:your-item={entry.id == userId && $isAuthenticated}
				>
					<p class="maxlength ranked-item-left">#~{entry.position?.toLocaleString()}</p>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						class="middle maxlength"
						onclick={() => {
							showProfile(entry.id);
						}}
					>
						{entry.user_name}
						{#if entry.supporter_level >= 1}
							<SupporterTag />
						{/if}
					</p>
					<p class="maxlength ranked-item-right">{entry?.[valueKey]?.toLocaleString() + unitName}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.loading-text {
		color: white;
		font-size: 22px;
		opacity: 0.5;
		width: 100%;
		text-align: center;
		margin-top: var(--box-margin);
	}

	.activity-box {
		box-shadow: var(--box-shadow);
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		display: flex;
		padding: var(--box-margin);
		gap: var(--box-margin);
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
	}

	.activity-box p {
		flex-grow: 100;
	}

	:global(.elo-active-tabs) {
		flex-grow: 1;
	}

	.option-bar-item {
		width: fit-content;
		max-width: 80%;
		border-radius: var(--layout-margin);
		box-shadow: var(--panel-shadow);
		background-color: var(--box-color);
	}

	:global(.leaderboard-tabs) {
		border-radius: var(--box-margin) !important;
		min-height: 50px;
	}

	:global(.leaderboard-tabs button) {
		width: 65px;
	}

	.ranked-item {
		width: 100%;
		height: 50px;
		box-shadow: var(--panel-shadow);
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

	.your-item {
		box-shadow: var(--bulb-shadow);
		background-color: rgba(255, 255, 255, 0.25);
	}

	.maxlength {
		max-width: 40%;
		flex-grow: 1;
		flex-basis: 0;
	}

	.ranked-item-left {
		text-align: left;
	}

	.ranked-item-right {
		text-align: right;
	}

	.leaderboard-container {
		border-radius: 20px;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-bottom: var(--layout-spacer);
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
		gap: 50px;
		position: relative;
		flex-wrap: wrap;
		box-shadow: var(--box-shadow-top);
		width: 100%;
		box-sizing: border-box;
	}

	.option-bar-container {
		display: flex;
		justify-content: end;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
		gap: var(--layout-margin);
	}

	.podium {
		--podium-shrink: calc(var(--podium-height, 0px) * (1 - var(--podium-scale, 1)) / 2);
		width: 800px;
		min-width: 800px;
		position: relative;
		transform: scale(0.9);
		opacity: 0.3;
		margin-top: calc(-90px * var(--podium-scale, 1) - var(--podium-shrink));
		margin-bottom: calc(-70px * var(--podium-scale, 1) - var(--podium-shrink));
		pointer-events: none;
		transition:
			opacity 250ms ease,
			transform 250ms ease;
	}

	.podium-item-container {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: calc(var(--layout-margin) + var(--box-margin));
		max-width: 100%;
		position: absolute;
		inset: 0;
		padding: 128px;
	}

	.podium-image {
		width: 800px;
		height: 448px;
		user-select: none;
		pointer-events: none;
	}

	.podium-loaded {
		opacity: 1;
		transform: scale(1);
	}

	.podium-item {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-basis: 0;
		position: relative;
		min-width: 0;
	}

	.podium-pedestal {
		flex-grow: 1;
		width: 100%;
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
		align-items: center;
	}

	#first-place-item {
		height: 225px;
	}

	#first-place .podium-value {
		margin-bottom: -16px;
	}

	#second-place-item {
		height: 167px;
		margin-left: -5px;
	}

	#second-place .podium-value {
		margin-bottom: -26px;
	}

	#second-place-item .name {
		padding-left: calc(var(--content-margin) * 2);
	}

	#second-place-item .podium-value {
		padding-left: var(--content-margin);
	}

	#third-place-item {
		height: 141px;
	}

	#third-place-item .name {
		padding-left: calc(var(--content-margin) * 2);
	}

	#third-place-item .podium-value {
		padding-left: var(--content-margin);
	}

	#third-place .podium-value {
		margin-bottom: -30px;
	}

	.podium-item .name {
		padding: var(--content-margin);
		text-align: center;
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		cursor: pointer;
		transition: opacity 250ms ease;
		filter: drop-shadow(0 0 5px var(--dark-shadow-color));
		pointer-events: auto;
		max-width: 75%;
	}

	.podium-item .name:hover {
		opacity: 0.5;
	}

	.podium-item .podium-value {
		font-size: 25px;
		margin-top: auto;
		overflow: hidden;
		text-overflow: ellipsis;
		text-wrap: nowrap;
		max-width: 100%;
		pointer-events: auto;
	}

	#your-league-container {
		margin-top: 25px;
		min-height: 30px;
	}

	.item-container {
		width: 100%;
		gap: var(--layout-margin);
		display: flex;
		flex-direction: column;
	}

	.three-dots-container {
		overflow: hidden;
		justify-content: center;
		gap: var(--layout-margin);
		width: 100%;
		margin-top: 25px;
		display: flex;
	}

	.circle-dot {
		padding: 6px;
		border-radius: 50%;
		box-shadow: var(--bulb-shadow);
	}

	@media (max-width: 800px) {
		.maxlength {
			flex-basis: unset;
		}

		.podium-item .name {
			font-size: calc(22px / var(--podium-scale, 1));
			margin-top: calc(1lh * (25 * var(--podium-scale, 1) / 22 - 1));
		}

		.podium-container {
			margin-bottom: var(--content-margin);
		}
	}
</style>

<script>
	import { Plus, X, User, Search, Info, ArrowDownWideNarrow, Bookmark, BookmarkOff } from "@lucide/svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { crazyGames, playlightSDK } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount, getContext } from "svelte";
	import { goto, beforeNavigate } from "$app/navigation";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { changeMap } from "$lib/utils/changeMap.js";
	import {
		specialMaps,
		continentMaps,
		countryMaps,
		baseMaps,
		defaultMap,
	} from "$lib/stores/context-specific/officialMapsStore";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { tooltip } from "$lib/utils/tooltip.svelte.js";
	import { page } from "$app/state";
	import { navigationMenu } from "$lib/stores/uiStore";
	import Chip from "$lib/components/ui/Chip.svelte";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { browser } from "$app/environment";

	const snapshotStore = getContext("snapshotStore");

	// Load state
	let currentFetchIndex = $state(0); // Auto-set
	let sortBy = $state("likes");
	let filterCategory = $state(null);
	let filterSearchQuery = $state("");
	let filterUserId = $state(null);

	// UI state
	let showLoadMore = $state(false);
	let showNothingFound = $state(false);
	let errorMessageText = $state("Loading...");
	let errorMessageShown = $state(true);
	let loadedCommunityMaps = $state([]);
	let loadedSpotlightMaps = $state([]);
	let addedCommunityMapsArray = $state([]);
	let searchInputValue = $state("");
	let selectedCategoryIndex = $state(0);
	let countrySectionExpanded = $state(false);

	let currentController;
	let currentFavController;

	let returnAfterChange = $derived(page.url.searchParams.get("return-to-multiplayer"));

	const categoriesArray = [
		"All",
		"By you",
		"Nature",
		"Architecture",
		"Urban",
		"Regions",
		"Sports",
		"Transport",
		"Miscellaneous",
	];

	// Load saved maps, restore site snapshot (if user went back to this page) or start initial load
	onMount(() => {
		addedCommunityMapsArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];

		// Check if we should restore snapshot
		const savedSnapshot = snapshotStore?.get("/maps");
		if (savedSnapshot && page.state?.restoreSnapshot) restoreSnapshot(savedSnapshot);
		else {
			loadCommunityMaps(0);
			loadCommunityMaps(null, true);
		}
	});

	// Load Playlight
	onMount(async () => {
		try {
			if (new URLSearchParams(window.location.search).get("crazy-games")) return; // Don't load Playlight on CG
			const module = await import("https://sdk.playlight.dev/playlight-sdk.es.js");
			$playlightSDK = module.default;
			$playlightSDK.init({
				exitIntent: {
					enabled: false,
				},
			});
		} catch (error) {
			console.error("Error loading the Playlight SDK:", error);
		}
	});

	// Save snapshot before navigating away
	beforeNavigate(() => {
		const data = captureSnapshot();
		if (data && snapshotStore) snapshotStore.set("/maps", data);
	});

	async function loadCommunityMaps(index, fav) {
		try {
			if (!fav) {
				if (currentController) currentController.abort();
				currentController = new AbortController();
			} else {
				if (currentFavController) currentFavController.abort();
				currentFavController = new AbortController();
			}

			showLoadMore = false;
			showNothingFound = false;
			errorMessageText = "Loading...";
			errorMessageShown = true;

			// Reset current community maps on nullish index
			if (!fav && !index) loadedCommunityMaps = [];

			// Build URL parts
			const hasFilters = filterCategory || filterSearchQuery || filterUserId;
			const indexAdd = index != null && !hasFilters ? `index/${index}` : hasFilters ? `/${index}` : "";
			const parts = [
				filterCategory && `category/${filterCategory}`,
				filterSearchQuery && `search/${encodeURIComponent(filterSearchQuery)}`,
				filterUserId != null && `by-user/${filterUserId}`,
				fav && "favourites",
				indexAdd,
				sortBy && `?sort=${sortBy}`,
			].filter(Boolean);

			const response = await fetch($apiUrl + "/maps/" + parts.join(""), {
				signal: fav ? currentFavController.signal : currentController.signal,
			});

			if (!response.ok) throw new Error(response.status);
			if (response.ok) {
				const data = await response.json();
				errorMessageShown = false;
				if (index != null) currentFetchIndex = index;
				if (data.communityMaps.length == 50 && !fav) showLoadMore = true;

				// Populate UI maps arrays
				if (!fav) loadedCommunityMaps = [...loadedCommunityMaps, ...data.communityMaps.filter((map) => !map.favourite)];
				if (fav) loadedSpotlightMaps = [...loadedSpotlightMaps, ...data.communityMaps];

				if (loadedCommunityMaps.length == 0 && !fav) showNothingFound = true;
			}
		} catch (error) {
			if (error.name !== "AbortError") {
				console.error("Error loading community maps:", error);
				errorMessageShown = true;
				errorMessageText = "Error: " + error.message;
			} else {
				errorMessageShown = false;
			}
		} finally {
			fav ? (currentFavController = null) : (currentController = null);
		}
	}

	function selectMap(name, community = false) {
		playSound("button_juicy");
		changeMap((community ? "community_" : "") + name, true, returnAfterChange);
		if (!returnAfterChange) {
			navigationMenu.set(false);
			goto("/");
		}
	}

	function checkIfSelected(name, community = false) {
		if (!browser) return false;
		const selectedMap = localStorage.getItem("selectedMap");
		if (community) name = "community_" + name;
		return selectedMap == name || (name == $defaultMap && !selectedMap);
	}

	function saveCommunityMap(name) {
		try {
			if (!addedCommunityMapsArray.includes(name)) {
				addedCommunityMapsArray.push(name);
				localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMapsArray));
			}
		} catch (error) {
			console.error("Error adding community map:", error);
		}
	}

	function unsaveCommunityMap(name) {
		try {
			const index = addedCommunityMapsArray.indexOf(name);
			if (index !== -1) {
				addedCommunityMapsArray.splice(index, 1);
				localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMapsArray));
			}
		} catch (error) {
			console.error("Error removing community map:", error);
		}
	}

	function resetFilters() {
		filterUserId = null;
		filterCategory = null;
		filterSearchQuery = "";
	}

	function startSearch() {
		resetFilters();
		filterSearchQuery = searchInputValue?.toLowerCase() || "";
		selectedCategoryIndex = 0;
		loadCommunityMaps(0);
	}

	function handleCategoryButtonClick(index) {
		playSound("item_select");
		selectedCategoryIndex = index;
		resetFilters();
		const category = categoriesArray[index]?.toLowerCase();

		if (category == "all") loadCommunityMaps(0);
		else if (category == "by you") {
			filterUserId = localStorage.getItem("id");
			loadCommunityMaps(0);
		} else {
			filterCategory = category;
			loadCommunityMaps(0);
		}
	}

	// Snapshot functions for state restoration
	function captureSnapshot() {
		return {
			scrollY: window.scrollY,
			currentFetchIndex,
			filterCategory,
			filterSearchQuery,
			filterUserId,
			sortBy,
			showLoadMore,
			showNothingFound,
			searchInputValue,
			selectedCategoryIndex,
			loadedCommunityMaps,
			loadedSpotlightMaps,
		};
	}

	function restoreSnapshot(data) {
		if (!data.loadedSpotlightMaps?.length || !data.loadedCommunityMaps?.length) {
			loadCommunityMaps(0);
			loadCommunityMaps(null, true);
			return;
		}
		if (currentController) currentController.abort();
		if (currentFavController) currentFavController.abort();
		currentFetchIndex = data.currentFetchIndex;
		filterCategory = data.filterCategory;
		filterSearchQuery = data.filterSearchQuery;
		filterUserId = data.filterUserId;
		sortBy = data.sortBy;
		showLoadMore = data.showLoadMore;
		showNothingFound = data.showNothingFound;
		errorMessageShown = false;
		searchInputValue = data.searchInputValue;
		selectedCategoryIndex = data.selectedCategoryIndex;
		loadedCommunityMaps = data.loadedCommunityMaps;
		loadedSpotlightMaps = data.loadedSpotlightMaps;
		setTimeout(() => {
			window.scrollTo({ top: data.scrollY });
		}, 0);
	}
</script>

<svelte:head>
	<title>Maps</title>
	<!-- Playlight CSS -->
	<link rel="stylesheet" href="https://sdk.playlight.dev/playlight-sdk.css" />
</svelte:head>

{#snippet communityMapItem(map)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="map-item map-item-hover map-item-animate"
		role="button"
		tabindex="0"
		onclick={() => {
			playSound("basic_button");
			const nameFormattedForUrl = map.name.split(" ").join("_").toLowerCase();
			goto("/maps/community/" + nameFormattedForUrl + (returnAfterChange ? "?return-to-multiplayer=true" : ""));
		}}
	>
		<div class="map-info">
			<p class="map-name">{map.name || "Unnamed (Error)"}</p>
			<p class="map-author">by {map.author || "Error"}</p>
		</div>
		<button
			class="add-button standard-button dark"
			{@attach tooltip({ text: "Save" })}
			onclick={(e) => {
				e.stopPropagation();
				playSound("basic_button");
				if (addedCommunityMapsArray.includes(map.name)) unsaveCommunityMap(map.name);
				else saveCommunityMap(map.name);
			}}
		>
			{#if addedCommunityMapsArray.includes(map.name)}
				<BookmarkOff size={20} strokeWidth={2.25} />
			{:else}
				<Bookmark size={20} strokeWidth={2.25} />
			{/if}
		</button>
	</div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-container">
	<div class="header-container">
		<h2 class="header">Base</h2>
	</div>
	<div class="map-container">
		{#each $baseMaps as map}
			<div
				class="map-item map-item-hover map-item-slim"
				style:padding-right={map === $defaultMap ? "var(--box-margin)" : ""}
				class:selected-map-item={checkIfSelected(map)}
				role="button"
				tabindex="0"
				onclick={() => {
					selectMap(map);
				}}
			>
				<div class="map-info {map === $defaultMap ? 'map-info-flex' : ''}">
					<p class="map-name">{map}</p>
					{#if map === $defaultMap}
						<Chip
							mutedOpacity={!checkIfSelected(map)}
							onclick={(e) => {
								e.stopPropagation();
								showConfirmPopup(
									"Live-generated",
									"The world map is continuously regenerated to feature a complete list of fresh locations every couple of hours.",
								);
							}}
						>
							<Info size={17} strokeWidth={2.25} style="margin-right: var(--content-margin); margin-bottom: -2px;" />
							Live
						</Chip>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	<!-- Special game modes and OpenGuessr sites -->
	<div class="header-container">
		<h2 class="header">Special</h2>
	</div>
	<div class="map-container">
		{#each $specialMaps as map}
			<div
				class="map-item map-item-hover map-item-slim"
				class:selected-map-item={checkIfSelected(map)}
				role="button"
				tabindex="0"
				onclick={() => {
					selectMap(map);
				}}
			>
				<div class="map-info">
					<p class="map-name">{map}</p>
				</div>
			</div>
		{/each}
		<div
			class="map-item map-item-hover map-item-link"
			style:padding-right="var(--box-margin)"
			role="button"
			tabindex="0"
			onclick={() => {
				playSound("button_juicy");
				window.open("https://education.openguessr.com/quiz", "_blank").focus();
			}}
		>
			<p class="map-name">Geo Quizzes</p>
			<Chip text="Education" italic={true} red={true} mutedOpacity={false} />
		</div>
	</div>
	<!-- Expandable country section -->
	<div class="header-container">
		<h2 class="header">Countries</h2>
	</div>
	<div class="map-container map-container-expand" class:map-container-expand-fadeout={!countrySectionExpanded}>
		{#each $countryMaps as map}
			<div
				class="map-item map-item-hover map-item-slim"
				class:selected-map-item={checkIfSelected(map)}
				role="button"
				tabindex="0"
				onclick={() => {
					selectMap(map);
				}}
			>
				<div class="map-info">
					<p class="map-name">{map}</p>
				</div>
			</div>
		{/each}
	</div>
	<div class="bar-menu show-all-button-container" style:margin-top={countrySectionExpanded ? "" : "-35px"}>
		<button
			class="standard-button white expand-button large-button"
			onclick={() => {
				playSound("floating_button");
				countrySectionExpanded = !countrySectionExpanded;
			}}
			>{countrySectionExpanded ? "Show less" : "Show all"}
			<img
				class="arrow-expand"
				class:arrow-expand-rotate={countrySectionExpanded}
				alt="arrow"
				src="/img/arrow_icon.png"
			/>
		</button>
	</div>
	<!-- Continents -->
	<div class="header-container">
		<h2 class="header">Continents</h2>
	</div>
	<div class="map-container">
		{#each $continentMaps as map}
			<div
				class="map-item map-item-hover map-item-slim"
				class:selected-map-item={checkIfSelected(map)}
				role="button"
				tabindex="0"
				onclick={() => {
					selectMap(map);
				}}
			>
				<div class="map-info">
					<p class="map-name">{map}</p>
				</div>
			</div>
		{/each}
	</div>
	<!-- Saved Community Maps -->
	<div class="header-container">
		<h2 class="header">Saved</h2>
	</div>
	<div class="map-container">
		{#if addedCommunityMapsArray.length > 0}
			{#each addedCommunityMapsArray as map}
				<div
					class="map-item map-item-hover map-item-slim map-item-bookmark map-item-animate"
					class:selected-map-item={checkIfSelected(map, true)}
					role="button"
					tabindex="0"
					onclick={() => {
						selectMap(map, true);
					}}
				>
					<div class="map-info">
						<p class="map-name">{map}</p>
					</div>
					<button
						class="standard-button dark remove-button"
						onclick={(e) => {
							e.stopPropagation();
							playSound("basic_button");
							unsaveCommunityMap(map);
						}}
					>
						<X size={20} strokeWidth={2.25} style="margin-bottom: 2px;" />
					</button>
				</div>
			{/each}
		{:else}
			<p class="nothing-found no-saved-maps">No saved community maps.</p>
		{/if}
	</div>
	<!-- Playlight section -->
	{#if !$crazyGames}
		<div class="header-container no-bottom-padding">
			<h2 class="header">Featured</h2>
		</div>
		<div class="map-container playlight-widget-carousel" style:margin-bottom="0" style:height="350px"></div>
	{/if}
	<!-- Featured Maps -->
	<div class="header-container large-header-margin">
		<h2 class="header">Spotlight</h2>
	</div>
	<div class="map-container" style:margin-bottom="var(--layout-spacer)">
		{#if loadedSpotlightMaps.length}
			{#each loadedSpotlightMaps as map}
				{@render communityMapItem(map)}
			{/each}
		{:else}
			<p class="nothing-found">Loading...</p>
		{/if}
	</div>
	<!-- All Community Maps -->
	<div class="header-container">
		<h2 class="header">Community</h2>
	</div>
	<div class="categories-search-area">
		<div class="categories-bar">
			<button
				class="standard-button white"
				onclick={() => {
					playSound("basic_button");
					if ($isAuthenticated) goto("/maps/create");
					else signupPrompt(() => goto("/maps/create"));
				}}><Plus size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-right: 2px;" /> Create</button
			>
			<div class="categories-bar of-left of-right">
				{#each categoriesArray as category, index}
					{#if index !== 1 || $isAuthenticated}
						<button
							class="category-button standard-button"
							class:selected={selectedCategoryIndex == index}
							onclick={() => handleCategoryButtonClick(index)}
						>
							{category.replace("Miscellaneous", "Misc.")}
							{#if index == 1}
								<User size={20} strokeWidth={2.25} style="margin-bottom: -2px;" />
							{/if}
						</button>
					{/if}
				{/each}
			</div>
		</div>
		<search class="search-container">
			<div class="filter-button-field">
				<p style:margin-top="-2px">
					<ArrowDownWideNarrow
						strokeWidth={2.25}
						size={20}
						style="padding-left: var(--content-margin); margin-bottom: -3px;"
					/>
				</p>
				<select
					class="standard-button filter-button white"
					bind:value={sortBy}
					onchange={() => {
						playSound("basic_button");
						loadCommunityMaps(0);
					}}
				>
					<option value="likes">Likes</option>
					<option value="newest">Newest</option>
					<option value="oldest">Oldest</option>
					<option value="a-z">A-Z</option>
				</select>
			</div>
			<input
				id="map-search"
				placeholder="Search"
				bind:value={searchInputValue}
				onkeydown={(e) => {
					if (e.key === "Enter") e.preventDefault();
				}}
				onkeyup={(event) => {
					if (event.key === "Enter") startSearch();
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
	<div id="community-maps" class="map-container">
		<!-- Community maps will be injected here -->
		{#each loadedCommunityMaps as map}
			{@render communityMapItem(map)}
		{/each}
		{#if showLoadMore}
			<button
				class="map-item load-more standard-button white"
				onclick={() => {
					playSound("basic_button");
					loadCommunityMaps(currentFetchIndex + 50);
				}}
			>
				More
				<Plus strokeWidth={2.75} size={20} style="margin-bottom: -4px; margin-left: var(--content-margin);" />
			</button>
		{/if}
		{#if errorMessageShown}
			<p class="nothing-found minimum-community-loading-height">{errorMessageText}</p>
		{/if}
		{#if showNothingFound}
			<p class="nothing-found">No map matches the filter.</p>
		{/if}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 2500px; /* avoid searches changing the page size much */
		max-width: 100%;
	}

	.large-header-margin {
		margin-top: calc(var(--layout-margin) + var(--box-margin));
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.map-info {
		flex-grow: 1;
	}

	.map-info-flex {
		display: flex;
		justify-content: space-between;
	}

	.no-bottom-padding {
		padding-bottom: 0;
	}

	.map-item {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--panel-shadow);
		text-decoration: none;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		box-sizing: border-box;
		user-select: none;
		min-width: 300px;
		flex-grow: 1;
		flex-basis: 30%;
		overflow: hidden;
		cursor: pointer;
		transition:
			opacity 250ms ease,
			filter 250ms ease,
			scale 250ms ease,
			background-color 250ms ease;
	}

	.map-item-animate {
		animation: fadeIn 250ms ease-in-out;
	}

	.map-item-link {
		flex-basis: 0;
	}

	.map-item-hover:hover {
		filter: brightness(70%);
		scale: 0.99;
	}

	.map-item-slim {
		min-width: 150px;
		flex-basis: 15%;
	}

	.map-item-bookmark {
		padding-right: var(--box-margin);
	}

	.selected-map-item {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.map-name {
		font-size: 22px;
		white-space: nowrap;
		max-width: 210px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.map-item-slim .map-name {
		max-width: 140px;
	}

	.map-author {
		font-size: 20px;
		color: rgba(255, 255, 255, 0.5);
		overflow: hidden;
		max-width: 150px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.map-container {
		display: flex;
		align-items: flex-start;
		position: relative;
		gap: var(--layout-margin);
		flex-wrap: wrap;
		width: 100%;
		margin-bottom: calc(var(--layout-margin) + var(--box-margin));
		overflow: visible; /* On hover, prevent scale up from clipping elements at the borders */
	}

	.map-container-expand {
		transition: mask 650ms ease-in-out;
		overflow: hidden !important;
	}

	.map-container-expand-fadeout {
		mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0) 100%);
		mask-composite: intersect;
		max-height: 300px;
	}

	.expand-button {
		padding-inline: calc(var(--layout-margin) * 2);
	}

	.show-all-button-container {
		margin-bottom: var(--box-margin);
		margin-inline: auto;
		transition: margin 150ms ease;
		bottom: 0;
		z-index: 10;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
	}

	.arrow-expand {
		rotate: 0deg;
		transition: rotate 250ms ease;
		width: 22px;
		height: 22px;
		vertical-align: -3px;
	}

	.arrow-expand-rotate {
		rotate: 180deg;
	}

	.add-button {
		border-radius: var(--content-margin);
		padding-inline: var(--panel-margin);
		display: flex;
		align-items: center;
	}

	.remove-button {
		margin-left: var(--box-margin);
		padding: 0;
		padding-inline: var(--content-margin);
		height: 26px;
	}

	#community-maps {
		margin-bottom: var(--layout-spacer);
	}

	.nothing-found {
		margin-bottom: 20px;
		opacity: 0.5;
		width: 100%;
		text-align: center;
	}

	.minimum-community-loading-height {
		margin-bottom: 1000px;
	}

	.no-saved-maps {
		text-align: start;
		margin-left: var(--box-margin);
	}

	#map-search {
		transition: background-color 250ms ease;
		flex-grow: 1;
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		text-overflow: ellipsis;
		width: 0;
		min-width: min(200px, max(15dvw, 75px));
	}

	.search-container {
		display: flex;
		flex-grow: 1;
	}

	#start-search {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.filter-button-field {
		background: var(--box-color);
		box-shadow: var(--box-shadow);
		padding: var(--content-margin);
		border-radius: var(--content-margin);
		display: flex;
		gap: var(--panel-margin);
		align-items: center;
		text-wrap: nowrap;
	}

	.filter-button {
		height: 30px;
		padding-inline: var(--content-margin);
		margin-left: 2px;
		border-radius: 3px;
		padding-top: 0;
		line-height: 22px;
	}

	.categories-bar {
		overflow: hidden;
		overflow-x: scroll;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: var(--box-margin);
		scrollbar-width: none;
	}

	.category-button {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--bulb-shadow);
		border: none;
		color: white;
		height: 39px;
	}

	.category-button:hover {
		transform: scale(0.97);
	}

	.selected {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.categories-search-area {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--bulb-shadow);
		width: calc(100% - var(--box-margin) * 2);
		min-width: 280px;
		gap: var(--box-margin);
		align-items: center;
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		margin-bottom: var(--layout-margin);
		background-color: var(--box-color);
	}

	.load-more {
		height: auto;
		min-height: 70.5px;
		justify-content: center;
		border: none;
		border-radius: var(--layout-margin);
		transition:
			filter 250ms ease,
			box-shadow 250ms ease,
			transform 150ms ease,
			opacity 250ms ease;
	}

	@media (max-width: 1000px) {
		.categories-search-area {
			flex-wrap: wrap;
		}
	}
</style>

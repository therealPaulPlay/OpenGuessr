<script>
	import { Plus, XCircle, User, Search } from "@lucide/svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount, getContext } from "svelte";
	import { goto, beforeNavigate } from "$app/navigation";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { changeMap } from "$lib/utils/changeMap.js";
	import {
		specialModes,
		continentMaps,
		countryMaps,
		basicMaps,
		defaultMap,
	} from "$lib/stores/context-specific/officialMapsStore";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { tooltip } from "$lib/utils/tooltip.js";
	import { page } from "$app/state";

	const snapshotStore = getContext("snapshotStore");

	// State
	let currentFetchIndex = $state(0);
	let currentCategory = $state();
	let currentQuery = $state();
	let currentByUserId = $state();
	let showLoadMore = $state(false);
	let showNothingFound = $state(false);
	let errorMessageText = $state("Loading...");
	let errorMessageShown = $state(true);
	let loadedCommunityMaps = $state([]);
	let loadedSpotlightMaps = $state([]);
	let addedCommunityMapsArray = $state([]);
	let searchValue = $state("");
	let selectedCategoryIndex = $state(0);
	let countrySectionExpanded = $state(false);

	let currentController;
	let currentFavController;

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

	onMount(() => {
		addedCommunityMapsArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];

		// Check if we should restore snapshot
		const savedSnapshot = snapshotStore?.get("/maps");
		if (savedSnapshot && page.state?.restoreSnapshot) restoreSnapshot(savedSnapshot);
		else {
			loadCommunityMaps(0);
			loadCommunityMaps(undefined, undefined, undefined, undefined, true);
		}
	});

	// Save snapshot before navigating away
	beforeNavigate(() => {
		const data = captureSnapshot();
		if (data && snapshotStore) snapshotStore.set("/maps", data);
	});

	async function loadCommunityMaps(index, category, query, byUserId, fav) {
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

			[currentCategory, currentQuery, currentByUserId] = [category, query, byUserId];

			if (index == 0 || index == null) loadedCommunityMaps = [];

			// Build URL parts
			const hasFilters = category || query || byUserId;
			const indexAdd = index != null && !hasFilters ? `index/${index}` : hasFilters ? `/${index}` : "";
			const parts = [
				category && `category/${category}`,
				query && `search/${query}`,
				byUserId && `by-user/${byUserId}`,
				indexAdd,
				fav && "favourites",
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
		changeMap((community ? "community_" : "") + name, true);
		goto("/");
	}

	function checkIfSelected(name, community = false) {
		if (typeof window === "undefined") return false;
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

	function startSearch() {
		const query = searchValue?.toLowerCase() || undefined;
		selectedCategoryIndex = 0;
		loadCommunityMaps(0, undefined, query);
	}

	function handleCategoryButtonClick(index) {
		selectedCategoryIndex = index;
		const category = categoriesArray[index]?.toLowerCase();
		if (category == "all") loadCommunityMaps(0);
		else if (category == "by you") loadCommunityMaps(0, null, null, localStorage.getItem("id"));
		else loadCommunityMaps(0, category);
	}

	// Snapshot functions for state restoration
	function captureSnapshot() {
		return {
			scrollY: window.scrollY,
			currentFetchIndex,
			loadMoreCategoryParam: currentCategory,
			loadMoreQueryParam: currentQuery,
			byUserParam: currentByUserId,
			showLoadMore,
			showNothingFound,
			searchValue,
			selectedCategoryIndex,
			loadedCommunityMaps,
			loadedSpotlightMaps,
		};
	}

	function restoreSnapshot(data) {
		if (!data.loadedSpotlightMaps?.length || !data.loadedCommunityMaps?.length) {
			loadCommunityMaps(0);
			loadCommunityMaps(undefined, undefined, undefined, undefined, true);
			return;
		}
		if (currentController) currentController.abort();
		if (currentFavController) currentFavController.abort();
		currentFetchIndex = data.currentFetchIndex;
		currentCategory = data.loadMoreCategoryParam;
		currentQuery = data.loadMoreQueryParam;
		currentByUserId = data.byUserParam;
		showLoadMore = data.showLoadMore;
		showNothingFound = data.showNothingFound;
		errorMessageShown = false;
		searchValue = data.searchValue;
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
</svelte:head>

{#snippet communityMapItem(map)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="map-item map-item-hover map-item-animate"
		role="button"
		tabindex="0"
		onclick={() => {
			playSound("basic_button");
			goto("/maps/community/" + map.name.split(" ").join("_").toLowerCase());
		}}
	>
		<div class="map-info">
			<p class="map-name">{map.name || "Name not loaded"}</p>
			<p class="map-author">by {map.author || "Bugsnacker"}</p>
		</div>
		<button
			class="add-button standardButton white"
			use:tooltip={{ text: "Save map" }}
			onclick={(e) => {
				e.stopPropagation();
				playSound("basic_button");
				if (addedCommunityMapsArray.includes(map.name)) unsaveCommunityMap(map.name);
				else saveCommunityMap(map.name);
			}}
		>
			<img
				src={addedCommunityMapsArray.includes(map.name) ? "/img/disselect_icon.png" : "/img/select_icon.png"}
				alt="add / remove map"
				class="selection-icon"
			/>
		</button>
	</div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-container">
	<div class="headerContainer">
		<h2 class="header">Base</h2>
	</div>
	<div class="map-container">
		{#each $basicMaps as map}
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
	<!-- Special game modes and OpenGuessr sites -->
	<div class="headerContainer">
		<h2 class="header">Special</h2>
	</div>
	<div class="map-container">
		{#each $specialModes as map}
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
			role="button"
			tabindex="0"
			onclick={() => {
				playSound("button_juicy");
				window.open("https://education.openguessr.com/quiz", "_blank").focus();
			}}
		>
			<p class="map-name">Geo Quizzes</p>
			<p class="link-badge">Education</p>
		</div>
		<div
			class="map-item map-item-hover map-item-link"
			role="button"
			tabindex="0"
			onclick={() => {
				playSound("button_juicy");
				window.open("https://geometas.com", "_blank").focus();
			}}
		>
			<p class="map-name">Meta Quizzes</p>
			<p class="link-badge">Geometas</p>
		</div>
	</div>
	<!-- Expandable country section -->
	<div class="headerContainer">
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
	<div class="barMenu showAllButtonContainer" style:margin-top={countrySectionExpanded ? "" : "-35px"}>
		<button
			class="standardButton white expandButton largeButton"
			onclick={() => {
				playSound("floating_button");
				countrySectionExpanded = !countrySectionExpanded;
			}}
			>{countrySectionExpanded ? "Show less" : "Show all"}
			<img class="arrowExpand" class:arrowExpandRotate={countrySectionExpanded} alt="arrow" src="/img/arrow_icon.png" />
		</button>
	</div>
	<!-- Continents -->
	<div class="headerContainer">
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
	<div class="headerContainer">
		<h2 class="header">Saved</h2>
	</div>
	<div class="map-container">
		{#if addedCommunityMapsArray.length > 0}
			{#each addedCommunityMapsArray as map}
				<div
					class="map-item map-item-hover map-item-slim map-item-bookmark"
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
						class="remove-button"
						onclick={(e) => {
							e.stopPropagation();
							playSound("basic_button");
							unsaveCommunityMap(map);
						}}
					>
						<XCircle size={21} />
					</button>
				</div>
			{/each}
		{:else}
			<p class="nothingFound noSavedMaps">No saved community maps.</p>
		{/if}
	</div>
	<!-- Playlight section -->
	{#if !$crazyGames}
		<div class="headerContainer no-bottom-padding">
			<h2 class="header">Featured</h2>
		</div>
		<div class="map-container playlight-widget-carousel smaller-bottom-margin" style="height: 330px;"></div>
	{/if}
	<!-- Featured Maps -->
	<div class="headerContainer largeHeaderMargin">
		<h2 class="header">Spotlight</h2>
	</div>
	<div class="map-container">
		{#if loadedSpotlightMaps.length}
			{#each loadedSpotlightMaps as map}
				{@render communityMapItem(map)}
			{/each}
		{:else}
			<p class="nothingFound">Loading...</p>
		{/if}
	</div>
	<!-- All Community Maps -->
	<div class="headerContainer">
		<h2 class="header mediumHeaderMargin">Community</h2>
	</div>
	<div class="categoriesSearchArea">
		<div class="categoriesBar">
			<button
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					if ($isAuthenticated) {
						goto("/maps/create");
					} else {
						signupPrompt();
					}
				}}><Plus size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-right: 2px;" /> Create</button
			>
			<div class="categoriesBar of-left of-right">
				{#each categoriesArray as category, index}
					{#if index !== 1 || $isAuthenticated}
						<button
							class="categoryButton standardButton"
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
		<search class="searchContainer">
			<input
				id="mapSearch"
				placeholder="Search"
				bind:value={searchValue}
				onkeydown={(e) => {
					if (e.key === "Enter") e.preventDefault();
				}}
				onkeyup={(event) => {
					if (event.key === "Enter") startSearch();
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
	<div id="community-maps" class="map-container">
		<!-- Community maps will be injected here -->
		{#each loadedCommunityMaps as map}
			{@render communityMapItem(map)}
		{/each}
		{#if showLoadMore}
			<button
				class="map-item load-more standardButton white"
				onclick={() => {
					playSound("basic_button");
					loadCommunityMaps(currentFetchIndex + 50, currentCategory, currentQuery, currentByUserId, null);
				}}
			>
				More
				<Plus strokeWidth={2.75} size={20} style="margin-bottom: -4px; margin-left: 5px;" />
			</button>
		{/if}
		{#if errorMessageShown}
			<p class="nothingFound minimumCommunityLoadingHeight">{errorMessageText}</p>
		{/if}
		{#if showNothingFound}
			<p class="nothingFound">No map matches the filter.</p>
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

	.largeHeaderMargin {
		margin-top: calc(var(--layout-margin) + var(--box-margin));
	}

	.mediumHeaderMargin {
		margin-top: 20px;
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
		overflow: hidden;
	}

	.no-bottom-padding {
		padding-bottom: 0;
	}

	.link-badge {
		font-size: 18px;
		font-style: italic;
		border-radius: 5px;
		background-color: rgb(224, 2, 2);
		padding: 2px;
		margin-right: -1px;
		padding-inline: var(--panel-margin);
		box-shadow: var(--bulb-shadow);
		margin-left: var(--panel-margin);
	}

	.map-item {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--box-shadow);
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
		background-color: rgba(255, 255, 255, 0.2);
		scale: 1.01;
	}

	.map-item-slim {
		min-width: 150px;
		flex-basis: 15%;
	}

	.selected-map-item {
		background-image: linear-gradient(20deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35));
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

	.smaller-bottom-margin {
		margin-bottom: 10px;
	}

	.expandButton {
		padding-inline: calc(var(--layout-margin) * 2);
	}

	.showAllButtonContainer {
		margin-bottom: 10px;
		margin-inline: auto;
		transition: margin 150ms ease;
		bottom: 0;
		z-index: 10;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	.arrowExpand {
		rotate: 0deg;
		transition: rotate 250ms ease;
		width: 22px;
		height: 22px;
		vertical-align: -3px;
	}

	.arrowExpandRotate {
		rotate: 180deg;
	}

	.add-button {
		border-radius: 5px;
		padding: 5px 8px;
		display: flex;
		align-items: center;
	}

	.remove-button {
		border: none;
		cursor: pointer;
		user-select: none;
		margin-left: 10px;
		margin-right: -3px;
		font-size: 25px;
		line-height: 0.9;
		opacity: 0.75;
		color: white;
		transition: opacity 250ms ease;
	}

	.remove-button:hover {
		opacity: 0.5;
	}

	.selection-icon {
		width: 22px;
		height: 22px;
	}

	#community-maps {
		margin-bottom: 50px;
	}

	.nothingFound {
		margin-bottom: 20px;
		opacity: 0.5;
		width: 100%;
		text-align: center;
	}

	.minimumCommunityLoadingHeight {
		margin-bottom: 1000px;
	}

	.noSavedMaps {
		text-align: start;
		margin-left: var(--box-margin);
	}

	#mapSearch {
		transition: background-color 250ms ease;
		flex-grow: 1;
		padding: 5px;
		padding-inline: var(--box-margin);
		width: 225px;
		text-overflow: ellipsis;
	}

	.searchContainer {
		display: flex;
		flex-grow: 1;
	}

	#startSearch {
		max-width: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.categoriesBar {
		overflow: hidden;
		overflow-x: scroll;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: var(--box-margin);
		scrollbar-width: none;
		flex-shrink: 1;
		min-width: 0;
	}

	.categoryButton {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--bulb-shadow);
		border: none;
		color: white;
		height: 39px;
	}

	.categoryButton:hover {
		filter: none;
		background-color: rgba(255, 255, 255, 0.2);
	}

	.selected {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.categoriesSearchArea {
		display: flex;
		justify-content: space-between;
		box-shadow: var(--box-shadow);
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
		transition:
			filter 250ms ease,
			box-shadow 250ms ease,
			transform 150ms ease,
			opacity 250ms ease;
	}

	@media (max-width: 1000px) {
		.categoriesSearchArea {
			flex-wrap: wrap;
		}
	}
</style>

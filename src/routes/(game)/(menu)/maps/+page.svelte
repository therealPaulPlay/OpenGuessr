<script>
	import { Plus, XCircle, User, Search } from "@lucide/svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
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

	// State
	let currentFetchIndex = 0;
	let currentCategory, currentQuery, currentByUserId;
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
		loadCommunityMaps(0);
		loadCommunityMaps(undefined, undefined, undefined, undefined, true);
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

	// Snapshot for state restoration
	export const snapshot = {
		capture: () => ({
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
		}),
		restore: (data) => {
			if (!data.loadedSpotlightMaps?.length || !data.loadedCommunityMaps?.length) return;
			if (currentController) currentController.abort();
			if (currentFavController) currentFavController.abort();
			currentFetchIndex = data.currentFetchIndex;
			currentCategory = data.loadMoreCategoryParam;
			currentQuery = data.loadMoreQueryParam;
			currentByUserId = data.byUserParam;
			showLoadMore = data.showLoadMore;
			showNothingFound = data.showNothingFound;
			searchValue = data.searchValue;
			selectedCategoryIndex = data.selectedCategoryIndex;
			loadedCommunityMaps = data.loadedCommunityMaps;
			loadedSpotlightMaps = data.loadedSpotlightMaps;
			setTimeout(() => {
				window.scrollTo({ top: data.scrollY });
			}, 0);
		},
	};
</script>

<svelte:head>
	<title>Maps</title>
</svelte:head>

{#snippet communityMapItem(map)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="map-item map-item-animate"
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
		<h2 class="header">Base maps</h2>
	</div>
	<div class="map-container">
		{#each $basicMaps as map}
			<div
				class="map-item map-item-slim"
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
				class="map-item map-item-slim"
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
			class="map-item-link map-item"
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
			class="map-item-link map-item"
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
				class="map-item map-item-slim"
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
	<button
		class="standardButton white expandButton largeButton"
		style:margin-top={countrySectionExpanded ? "10px" : "-35px"}
		onclick={() => {
			playSound("floating_button");
			countrySectionExpanded = !countrySectionExpanded;
		}}
		>{countrySectionExpanded ? "Show less" : "Show all"}
		<img class="arrowExpand" class:arrowExpandRotate={countrySectionExpanded} alt="arrow" src="/img/arrow_icon.png" />
	</button>
	<!-- Continents -->
	<div class="headerContainer">
		<h2 class="header">Continents</h2>
	</div>
	<div class="map-container">
		{#each $continentMaps as map}
			<div
				class="map-item map-item-slim"
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
					class="map-item map-item-slim map-item-bookmark"
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
			<h2 class="header">Featured games</h2>
		</div>
		<div class="map-container playlight-widget-carousel smaller-bottom-margin" style="height: 330px;"></div>
	{/if}
	<!-- Featured Maps -->
	<div class="headerContainer largeHeaderMargin">
		<h2 class="header">Community spotlight</h2>
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
		<h2 class="header mediumHeaderMargin">Community maps</h2>
		<button
			id="createButton"
			class="standardButton white largeButton"
			onclick={() => {
				playSound("basic_button");
				if ($isAuthenticated) {
					goto("/maps/create");
				} else {
					signupPrompt();
				}
			}}>+ Create</button
		>
	</div>
	<div class="categoriesSearchArea">
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
		<search class="searchContainer">
			<input
				id="mapSearch"
				placeholder="Search maps"
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
				class="map-item map-item-animate load-more"
				onclick={() => {
					playSound("basic_button");
					loadCommunityMaps(currentFetchIndex + 50, currentCategory, currentQuery, currentByUserId, null);
				}}
				><p>More</p>
				<span class="loadMoreIconSpan"><Plus strokeWidth={2.75} size={20} /></span></button
			>
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
	}

	.loadMoreIconSpan {
		margin-top: 6px;
	}

	.largeHeaderMargin {
		margin-top: 75px;
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
		padding-inline: 15px;
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

	.map-item:hover {
		background-color: rgba(255, 255, 255, 0.2);
		scale: 1.01;
	}

	.map-item-slim {
		min-width: 150px;
		flex-basis: 15%;
	}

	.map-item-slim:hover,
	.map-item-link:hover {
		scale: 1.03;
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
		margin-bottom: 20px;
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
		margin-inline: auto;
		padding-inline: 30px;
		margin-bottom: 10px;
		transition:
			margin 150ms ease,
			scale 150ms ease,
			transform 150ms ease,
			background-color 250ms ease,
			filter 250ms ease;
		bottom: 0;
		z-index: 10;
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
		width: 100px;
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

	#createButton {
		margin-top: auto;
	}

	.categoriesBar {
		overflow: hidden;
		overflow-x: scroll;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: var(--box-margin);
		scrollbar-width: none;
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
		flex-wrap: wrap;
		width: calc(100% - var(--box-margin) * 2);
		min-width: 280px;
		gap: var(--box-margin);
		align-items: center;
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		margin-bottom: 20px;
		background-color: var(--box-color);
	}

	.load-more {
		font-size: 22px;
		min-height: 69px;
		justify-content: center;
		gap: 10px;
	}

	@media (max-width: 800px) {
		.categoryButton {
			font-size: 20px;
		}
	}
</style>

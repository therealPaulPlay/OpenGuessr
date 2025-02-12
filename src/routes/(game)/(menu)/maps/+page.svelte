<script>
	import { Plus, XCircle, ExternalLinkIcon } from "lucide-svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { disableExternalLinks } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { changeCategory } from "$lib/utils/changeCategory";
	import { specialModes, continentMaps, countryMaps, basicMaps } from "$lib/stores/context-specific/officialMapsStore";

	// Load community maps  ---------------------------------------------------------------------------------------------------------

	// Fetch
	let currentFetchIndex = 0;
	let loadMoreCategoryParam = undefined;
	let loadMoreQueryParam = undefined;

	// UI
	let showLoadMore = $state(false);
	let showNothingFound = $state(false);
	let errorMessageText = $state("Loading...");
	let errorMessageShown = $state(true);

	// Data
	let loadedCommunityMaps = $state([]);
	let loadedSpotlightMaps = $state([]);

	let addedCommunityMapsArray = $state([]); // Array of community maps that have been added "+" to the users quick access

	onMount(() => {
		addedCommunityMapsArray = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
	});

	async function loadCommunityMaps(index, category, query, fav) {
		try {
			showLoadMore = false;
			showNothingFound = false;
			errorMessageText = "Loading...";
			errorMessageShown = true;

			loadMoreCategoryParam = category;
			loadMoreQueryParam = query;

			// If a new loading method is being used, reset the current input
			if (index == 0 || index == undefined) {
				loadedCommunityMaps = [];
			}

			let indexAdd = index != undefined ? "index/" + index : "";
			const categoryAdd = category ? "category/" + category : "";
			const queryAdd = query ? "search/" + query : "";
			const favAdd = fav ? "favourites" : "";

			if (category || query) {
				indexAdd = "/" + index;
			}

			const response = await fetch("https://maps.openguessr.com/maps/" + categoryAdd + queryAdd + indexAdd + favAdd);
			const data = await response.json();

			if (response.ok) {
				errorMessageShown = false;

				if (index) currentFetchIndex = index;
				if (data.communityMaps.length == 50 && !fav) showLoadMore = true;

				let nothingFound = true;

				if (!fav) loadedCommunityMaps = [...loadedCommunityMaps, ...data.communityMaps.filter((map) => !map.favourite)];
				if (fav) loadedSpotlightMaps = [...loadedSpotlightMaps, ...data.communityMaps];

				if (loadedCommunityMaps.length > 0) nothingFound = false;

				// If no results were found (and these are not the spotlight (fav, favourite) maps, show the "nothing found" text)
				if (nothingFound && !fav) showNothingFound = true;
			} else {
				console.error("Error loading community maps: " + response.status);
				errorMessageShown = true;
				errorMessageText = "Error: " + response.status;
			}
		} catch (error) {
			console.error("Error loading community maps: " + error);
			errorMessageShown = true;
			errorMessageText = "Error: " + error;
		}
	}

	// Play Map --------------------------------------------------------------------------------------------------------------

	function selectCategory(name, community) {
		playSound("button_juicy");
		const communityAppendix = community ? "community_" : "";
		changeCategory(communityAppendix + name.toLowerCase(), true);
		goto("/");
	}

	function checkIfSelected(name, community) {
		if (typeof window === "undefined") return;

		const selectedMap = localStorage.getItem("selectedCategory");
		if (community) name = "community_" + name;
		if (selectedMap == name.toLowerCase()) return true;
		if (name.toLowerCase() == "standard" && !selectedMap) return true; // Select Standard as the default, if no selection was saved in storage
		return false;
	}

	// Manage added community maps -------------------------------------------------------------------------------------------

	// Add / Remove from user section
	function addSelectedMap(name) {
		try {
			if (!addedCommunityMapsArray.includes(name)) {
				addedCommunityMapsArray.push(name);
				localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMapsArray));
			}
		} catch (error) {
			console.error("Error adding community map: " + error);
		}
	}

	function removeSelectedMap(name) {
		try {
			const index = addedCommunityMapsArray.indexOf(name);
			if (index !== -1) {
				addedCommunityMapsArray.splice(index, 1);
				localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMapsArray));
			}
		} catch (error) {
			console.error("Error removing community map: " + error);
		}
	}

	function idToMapName(str) {
		try {
			return str
				.replace("community_", "")
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");
		} catch (error) {
			console.error("Error converting ID to map name:", error);
			return "Error (?)";
		}
	}

	// Search and categories ------------------------------------------------------------------------

	function startSearch() {
		let query = document.getElementById("mapSearch").value.toLowerCase();
		if (query == "") {
			query = undefined; // so the undefined check works in the load function
		}
		currentSelection = document.getElementById("categoryAll");
		categoryButtons.forEach((button) => {
			button.classList.remove("selected");
		});
		document.getElementById("categoryAll").classList.add("selected");

		loadCommunityMaps(0, undefined, query);
	}

	// Add event listeners to all category buttons
	let currentSelection;
	let categoryButtons;

	onMount(() => {
		currentSelection = document.getElementById("categoryAll");

		categoryButtons = document.querySelectorAll(".categoryButton");
		categoryButtons.forEach((button) => {
			button.addEventListener("click", handleCategoryButtonClick);
		});
	});

	function handleCategoryButtonClick(event) {
		if (currentSelection) {
			currentSelection.classList.remove("selected");
		}

		event.target.classList.add("selected");
		currentSelection = event.target;
		const selectedCategory = currentSelection.textContent.toLowerCase();

		if (selectedCategory != "all") {
			loadCommunityMaps(0, selectedCategory);
		} else {
			loadCommunityMaps(0);
		}
	}

	onMount(() => {
		// Call the function to load community maps
		loadCommunityMaps(0);
		loadCommunityMaps(undefined, undefined, undefined, true); // load favourite maps / load spotlight section
	});

	// Toggle Enlarge Country section ---------------------------------------------------------------------------------
	let countrySectionExpanded = $state(false);
</script>

<svelte:head>
	<title>Maps</title>
</svelte:head>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-container">
	<div class="headerContainer">
		<h2 class="header">Base Maps</h2>
	</div>
	<div class="map-container">
		{#each $basicMaps as map}
			<div
				class="map-item map-item-slim"
				class:selected-map-item={checkIfSelected(map)}
				role="button"
				tabindex="0"
				onclick={() => {
					selectCategory(map);
				}}
			>
				<div class="mapInfo">
					<div class="map-name">{idToMapName(map) || "Name not loaded"}</div>
				</div>
			</div>
		{/each}
	</div>
	<div class="headerContainer">
		<h2 class="header">Special Games</h2>
	</div>
	<div class="map-container">
		{#each $specialModes as map}
			<div
				class="map-item map-item-slim"
				class:selected-map-item={checkIfSelected(map)}
				role="button"
				tabindex="0"
				onclick={() => {
					selectCategory(map);
				}}
			>
				<div class="mapInfo">
					<div class="map-name">{idToMapName(map) || "Name not loaded"}</div>
				</div>
			</div>
		{/each}
		<div
			class="map-item map-item-slim"
			role="button"
			tabindex="0"
			onclick={() => {
				playSound("button_juicy");
				goto("/competitions");
			}}
		>
			<div class="mapInfo">
				<div class="map-name">
					Competitions <span class="linkSpan"><ExternalLinkIcon size={16} strokeWidth={2} /></span>
				</div>
			</div>
		</div>
		{#if !$disableExternalLinks}
			<div
				class="map-item map-item-slim"
				role="button"
				tabindex="0"
				onclick={() => {
					playSound("button_juicy");
					window.open("https://education.openguessr.com/quiz", "_blank").focus();
				}}
			>
				<div class="mapInfo">
					<div class="map-name">
						Quizzes <span class="linkBadge">Edu</span>
						<span class="linkSpan"><ExternalLinkIcon size={16} strokeWidth={2} /></span>
					</div>
				</div>
			</div>
			<div
				class="map-item map-item-slim map-item-long-link"
				role="button"
				tabindex="0"
				onclick={() => {
					playSound("button_juicy");
					window.open("https://autoguessr.com", "_blank").focus();
				}}
			>
				<div class="mapInfo">
					<div class="map-name">
						Auto Guessr <span class="linkBadge orangeBadge">Auto</span>
						<span class="linkSpan"><ExternalLinkIcon size={16} strokeWidth={2} /></span>
					</div>
				</div>
			</div>
		{/if}
	</div>
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
					selectCategory(map);
				}}
			>
				<div class="mapInfo">
					<div class="map-name">{idToMapName(map) || "Name not loaded"}</div>
				</div>
			</div>
		{/each}
	</div>
	<button
		class="standardButton white expandButton"
		style:margin-top={countrySectionExpanded ? "10px" : "-35px"}
		onclick={() => {
			playSound("floating_button");
			countrySectionExpanded = !countrySectionExpanded;
		}}
		>{countrySectionExpanded ? "Show less" : "Show all"}
		<img class="arrowExpand" class:arrowExpandRotate={countrySectionExpanded} alt="arrow" src="/img/arrow_icon.png" />
	</button>
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
					selectCategory(map);
				}}
			>
				<div class="mapInfo">
					<div class="map-name">{idToMapName(map) || "Name not loaded"}</div>
				</div>
			</div>
		{/each}
	</div>
	<!-- Saved Community Maps -->
	<div class="headerContainer">
		<h2 class="header">Bookmarked Maps</h2>
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
						selectCategory(map, true);
					}}
				>
					<div class="mapInfo">
						<div class="map-name">{map || "Name not loaded"}</div>
					</div>
					<button
						class="remove-button"
						onclick={(e) => {
							e.stopPropagation();
							playSound("basic_button");
							removeSelectedMap(map);
						}}
					>
						<XCircle size={21} />
					</button>
				</div>
			{/each}
		{:else}
			<p class="nothingFound noSavedMaps">No saved maps.</p>
		{/if}
	</div>
	<!-- Featured Maps -->
	<div class="headerContainer largeHeaderMargin">
		<h2 class="header">Community Spotlight</h2>
	</div>
	<div class="map-container">
		{#each loadedSpotlightMaps as map}
			<div
				class="map-item"
				role="button"
				tabindex="0"
				onclick={() => {
					goto("/maps/community/" + map.name.split(" ").join("_").toLowerCase());
				}}
			>
				<div class="mapInfo">
					<div class="map-name">{map.name || "Name not loaded"}</div>
					<div class="map-author">by {map.author || "Bugsnacker"}</div>
				</div>
				<button
					class="add-button"
					onclick={(e) => {
						e.stopPropagation();
						playSound("basic_button");
						if (addedCommunityMapsArray.includes(map.name)) {
							removeSelectedMap(map.name);
						} else {
							addSelectedMap(map.name);
						}
					}}
				>
					<img
						src={addedCommunityMapsArray.includes(map.name) ? "/img/disselect_icon.png" : "/img/select_icon.png"}
						alt="add / remove map"
						class="selection-icon"
					/>
				</button>
			</div>
		{/each}
	</div>
	<!-- All Community Maps -->
	<div class="headerContainer">
		<h2 class="header mediumHeaderMargin">Community Maps</h2>
		<button
			id="uploadButton"
			class="standardButton white"
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
		<div class="categoriesBar">
			<button id="categoryAll" class="selected categoryButton standardButton">All</button>
			<button class="categoryButton standardButton">Nature</button>
			<button class="categoryButton standardButton">Architecture</button>
			<button class="categoryButton standardButton">Urban</button>
			<button class="categoryButton standardButton">Regions</button>
			<button class="categoryButton standardButton">Sports</button>
			<button class="categoryButton standardButton">Transport</button>
			<button class="categoryButton standardButton">Miscellaneous</button>
		</div>
		<search class="searchContainer">
			<input
				id="mapSearch"
				placeholder="Search Maps..."
				onkeydown={(e) => {
					if (e.key === "Enter") e.preventDefault();
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
				<img src="/img/find_icon.png" alt="start search" id="searchIcon" />
			</button>
		</search>
	</div>
	<div id="community-maps" class="map-container">
		<!-- Community maps will be injected here -->
		{#each loadedCommunityMaps as map}
			<div
				class="map-item"
				role="button"
				tabindex="0"
				onclick={() => {
					goto("/maps/community/" + map.name.split(" ").join("_").toLowerCase());
				}}
			>
				<div class="mapInfo">
					<div class="map-name">{map.name || "Name not loaded"}</div>
					<div class="map-author">by {map.author || "Bugsnacker"}</div>
				</div>
				<button
					class="add-button"
					onclick={(e) => {
						e.stopPropagation();
						playSound("basic_button");
						if (addedCommunityMapsArray.includes(map.name)) {
							removeSelectedMap(map.name);
						} else {
							addSelectedMap(map.name);
						}
					}}
				>
					<img
						src={addedCommunityMapsArray.includes(map.name) ? "/img/disselect_icon.png" : "/img/select_icon.png"}
						alt="add / remove map"
						class="selection-icon"
					/>
				</button>
			</div>
		{/each}
		{#if showLoadMore}
			<button
				id="loadMore"
				class="map-item"
				onclick={() => {
					playSound("basic_button");
					loadCommunityMaps(currentFetchIndex + 50, loadMoreCategoryParam, loadMoreQueryParam);
				}}>More <span class="loadMoreIconSpan"><Plus strokeWidth={2.75} size={20} /></span></button
			>
		{/if}
		{#if errorMessageShown}
			<p class="nothingFound">{errorMessageText}</p>
		{/if}
		{#if showNothingFound}
			<p class="nothingFound">No map matches the search query.</p>
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
		margin-top: 80px;
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

	.linkSpan {
		margin-left: 5px;
	}

	.map-item {
		display: flex;
		justify-content: space-between;
		text-decoration: none;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border-radius: 10px;
		padding: 10px;
		padding-inline: 15px;
		box-sizing: border-box;
		animation: fadeIn 150ms ease-in-out;
		user-select: none;
		flex-grow: 1;
		flex-basis: 30%;
		min-width: 300px;
		text-overflow: ellipsis;
		overflow: hidden;
		cursor: pointer;
		transition:
			opacity 250ms ease,
			scale 250ms ease,
			background-color 250ms ease;
	}

	.map-item:hover {
		background-color: rgba(255, 255, 255, 0.2);
		scale: 1.01;
	}

	.map-item-slim {
		min-width: 150px;
		flex-basis: 15%;
	}

	.map-item-slim:hover {
		scale: 1.03;
	}

	.selected-map-item {
		background-image: linear-gradient(20deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35));
	}

	.map-name {
		font-size: 22px;
		white-space: nowrap;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.map-item-slim .map-name {
		max-width: 140px;
	}

	.map-item-long-link .map-name {
		max-width: 180px;
		min-width: 160px;
	}

	.map-item-long-link {
		min-width: 180px;
	}

	.map-item-bookmark .map-name {
		max-width: 110px;
	}

	.map-author {
		font-size: 18px;
		color: rgba(255, 255, 255, 0.5);
		overflow: hidden;
		max-width: 110px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.map-container {
		display: flex;
		align-items: flex-start;
		position: relative;
		gap: 15px;
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

	.expandButton {
		margin-inline: auto;
		border-radius: 10px;
		padding-inline: 30px;
		margin-bottom: 10px;
		transition:
			margin 150ms ease,
			scale 150ms ease,
			transform 150ms ease,
			background-color 250ms ease,
			filter 250ms ease;
		height: 50px;
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
		background-color: rgba(255, 255, 255, 0.15);
		border: none;
		border-radius: 5px;
		padding: 5px 7px;
		cursor: pointer;
		user-select: none;
		margin-left: 10px;
		margin-right: 5px;
		font-size: 25px;
		width: 35px;
		line-height: 0.9;
		outline: 3px solid rgba(255, 255, 255, 0.25);
		transition: background-color 250ms ease;
	}

	.add-button:hover {
		background-color: rgba(255, 255, 255, 0.25);
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
		transition: opacity 250ms ease;
	}

	.remove-button:hover {
		opacity: 0.5;
	}

	.selection-icon {
		width: 22px;
		height: auto;
		vertical-align: -1px;
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

	.noSavedMaps {
		text-align: start;
		margin-left: 10px;
	}

	.linkBadge {
		border-radius: 3px;
		background-color: rgb(224, 2, 2);
		padding-inline: 2px;
		font-style: italic;
		font-size: 16px;
		padding-right: 5px;
		vertical-align: 1px;
		margin-left: 1px;
	}

	.orangeBadge {
		background-color: rgb(225, 98, 3);
	}

	#mapSearch {
		transition: background-color 250ms ease;
		font-size: 22px;
		flex-grow: 1;
		padding: 5px;
		padding-inline: 10px;
		text-overflow: ellipsis;
	}

	.searchContainer {
		display: flex;
		flex-grow: 1;
	}

	#startSearch {
		max-width: 50px;
		margin: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	#uploadButton {
		border-radius: 10px;
		text-decoration: none;
		margin-top: auto;
		min-height: 50px;
	}

	.categoriesBar {
		overflow: hidden;
		overflow-x: scroll;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 10px;
		scrollbar-width: none;
	}

	.categoryButton {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: none;
		border: none;
		color: white;
		max-height: 30px;
		padding-top: 0;
		padding-bottom: 0;
		margin: 0;
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
		flex-wrap: wrap;
		width: calc(100% - 16px);
		min-width: 280px;
		gap: 10px;
		align-items: center;
		border-radius: 10px;
		padding: 8px;
		margin-bottom: 20px;
		background-color: var(--box-color);
	}

	#loadMore {
		font-size: 22px;
		min-height: 69px;
		justify-content: center;
		gap: 10px;
	}

	#searchIcon {
		width: 20px;
		height: 20px;
	}

	@media (max-width: 800px) {
		p {
			font-size: 20px;
		}

		.categoryButton {
			font-size: 18px;
			min-height: 30px;
		}
	}
</style>

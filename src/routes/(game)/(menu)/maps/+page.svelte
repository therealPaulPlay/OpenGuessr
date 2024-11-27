<script>
  import { Plus } from "lucide-svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { onMount } from "svelte";

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
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-container">
  <div class="map-container">
    <div class="headerContainer">
      <h2 class="header">Community Spotlight:</h2>
    </div>
    <div id="spotlight-maps" class="map-container">
      <!-- Featured maps will be injected here -->
      {#each loadedSpotlightMaps as map}
        <a class="map-item" role="button" tabindex="0" href={"/maps/community/" + map.name.split(" ").join("_").toLowerCase()}>
          <div class="mapInfo">
            <div class="map-name">{map.name || "Name not loaded"}</div>
            <div class="map-author">by {map.author || "Bugsnacker"}</div>
          </div>
          <button
            class="add-button"
            onclick={() => {
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
        </a>
      {/each}
    </div>
  </div>
  <div class="headerContainer">
    <h2 class="header">Community Maps:</h2>
    <a
      id="uploadButton"
      class="standardButton primaryButtonHighlight"
      href="/maps/upload"
      onclick={() => {
        playSound("basic_button");
      }}>+ Upload</a
    >
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
  </div>
  <div id="community-maps" class="map-container">
    <!-- Community maps will be injected here -->
    {#each loadedCommunityMaps as map}
      <a class="map-item" role="button" tabindex="0" href={"/maps/community/" + map.name}>
        <div class="mapInfo">
          <div class="map-name">{map.name || "Name not loaded"}</div>
          <div class="map-author">by {map.author || "Bugsnacker"}</div>
        </div>
        <button
          class="add-button"
          onclick={() => {
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
      </a>
    {/each}
  </div>
  {#if errorMessageShown}
    <p id="errorMessage">{errorMessageText}</p>
  {/if}
  {#if showNothingFound}
    <p id="nothingFound" style="opacity: 0.5;">No map matches the search query.</p>
  {/if}
  {#if showLoadMore}
    <button
      id="loadMore"
      class="standardButton"
      onclick={() => {
        playSound("basic_button");
        loadCommunityMaps(currentFetchIndex + 50, loadMoreCategoryParam, loadMoreQueryParam);
      }}>Show more <span class="loadMoreIconSpan"><Plus strokeWidth={2} /></span></button
    >
  {/if}
</div>

<style>
  .main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .headerContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    width: 100%;
    padding: 10px;
    padding-inline: 0;
    gap: 12px;
  }

  .loadMoreIconSpan {
    vertical-align: -4px;
  }

  .header {
    text-align: center;
    font-size: 45px;
    color: white;
  }

  .map-item {
    display: flex;
    justify-content: space-between;
    text-decoration: none;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 12px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
    user-select: none;
    flex-grow: 1;
    flex-basis: 30%;
    min-width: 300px;
    cursor: pointer;
    transition:
      opacity 250ms ease,
      background-color 250ms ease;
  }

  .map-item:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .map-name {
    font-size: 22px;
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
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
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
    margin-bottom: 20px;
  }

  .add-button {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 5px;
    padding: 5px 7px;
    cursor: pointer;
    user-select: none;
    margin-left: 10px;
    margin-right: 10px;
    font-size: 25px;
    width: 35px;
    line-height: 0.9;
    transition: background-color 250ms ease;
  }

  .selection-icon {
    width: 22px;
    height: auto;
    vertical-align: -1px;
  }

  .add-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .primaryButtonHighlight {
    background-color: rgb(153, 82, 193);
    color: white;
  }

  #community-maps {
    margin-bottom: 50px;
    margin-top: 10px;
  }

  #nothingFound {
    margin-top: -30px;
    margin-bottom: 20px;
  }

  #mapSearch {
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    transition: background-color 250ms ease;
    font-size: 22px;
    flex-grow: 1;
    border: none;
    font-family: Barlow;
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
    margin-right: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #uploadButton {
    border-radius: 10px;
    text-decoration: none;
    line-height: 36px;
  }

  .categoriesBar {
    overflow: hidden;
    overflow-x: scroll;
    border-radius: 10px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 5px;
    padding: 5px;
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
  }

  .categoryButton:hover {
    filter: none;
    background-color: rgba(255, 255, 255, 0.3);
  }

  .selected {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .categoriesSearchArea {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 100%;
    min-width: 280px;
    gap: 10px;
    align-items: center;
    border-radius: 13px;
    padding: 5px;
    background-color: rgba(255, 255, 255, 0.05);
  }

  #loadMore {
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 22px;
    min-height: 40px;
    width: 280px;
    padding: 10px;
    margin-bottom: 30px;
    margin-top: -20px;
    padding-bottom: 7px;
  }

  #errorMessage {
    margin-bottom: 50px;
    opacity: 0.5;
  }

  #searchIcon {
    width: 20px;
    height: 20px;
  }

  @media all and (orientation: portrait), all and (max-width: 800px) {
    p {
      font-size: 20px;
    }

    .header {
      font-size: 35px;
    }

    .categoryButton {
      font-size: 18px;
      min-height: 30px;
    }
  }
</style>

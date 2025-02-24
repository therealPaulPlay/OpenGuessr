<script>
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { errorPopup } from "$lib/utils/errorHandling";
  import { signupPrompt } from "$lib/utils/signupPrompt";
  import { showNotification } from "$lib/utils/notifications";
  import { changeCategory } from "$lib/utils/changeCategory";
  import { Link, MapPin, Heart, HeartOff, Trash2, Replace, Dices } from "lucide-svelte";
  import { playSound } from "$lib/utils/soundManager";
  import Popup from "$lib/components/Popup.svelte";
  import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
  import { panoramaKey } from "$lib/stores/locationStore";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";

  let { data } = $props();

  let randomLocationIndex = $state(0);
  let iframeSource = $derived(
    "https://www.google.com/maps/embed/v1/streetview?location=" +
      data.map_data.locations[randomLocationIndex][0] +
      "," +
      data.map_data.locations[randomLocationIndex][1] +
      "&key=" +
      get(panoramaKey) +
      "&fov=90",
  );
  let mapName = $state(data.name);
  let mapAuthor = $state(data.author);
  let mapAuthorId = $state(data.authorId);
  let mapDescription = $state(data.description);
  let mapLocationAmount = $state(data.map_data?.locations.length);
  let mapLocationData = $state(data.map_data);

  let playerId = $state(0);

  onMount(() => {
    playerId = localStorage.getItem("id") || -1;
  });

  // Like Functionality ------------------------------------------------------------------------------
  let isLiked = $state(false);
  let likesCount = $state("...");

  onMount(() => {
    fetchMapLikeStatus(mapName);
  });

  async function likeOrDislikeMap(mapName) {
    if (get(isAuthenticated)) {
      try {
        const response = await fetch(`https://accounts.openguessr.com/maps/like/${mapName}`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("bearer"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: localStorage.getItem("id") }),
        });

        const data = await response.json();

        if (response.ok) {
          await fetchMapLikeStatus(mapName); // fetch new information
        } else {
          console.error("Error liking or disliking map:", data.error);
        }
      } catch (error) {
        console.error("Network error during like or dislike of map:", error);
      }
    } else {
      signupPrompt();
    }
  }

  async function fetchMapLikeStatus(name) {
    try {
      const playerId = localStorage.getItem("id") || null;

      const response = await fetch(`https://accounts.openguessr.com/maps/rating/${name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: playerId }), // playerId is optional
      });

      const data = await response.json();

      if (response.ok) {
        likesCount = data.likeAmount;
        isLiked = data.liked;
      } else {
        console.error("Error loading map information and likes:", data.error);
      }
    } catch (error) {
      console.error("Network error during map information fetch:", error);
    }
  }

  // Map deletion -------------------------------------------------------------------------------------------------
  function deleteMapScreen(name) {
    showConfirmPopup("Delete " + name + " ?", "Deleting " + name + " cannot be undone.", () => {
      deleteMap(name);
    });
  }

  async function deleteMap(mapName) {
    // delete from database
    try {
      const body = {
        id: localStorage.getItem("id"), // for auth
      };

      // Send POST request to the server
      const response = await fetch("https://accounts.openguessr.com/maps/" + mapName, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Return the success or error message. No need to parse the response
      if (response.ok) {
        showConfirmPopup("Map deleted", "The map was deleted successfully.", false, false, false, true);
        goto("/maps");
        return "Map deleted successfully.";
      } else {
        console.error("Error deleting map: " + response.status);
        errorPopup("Failed to delete map", "Failed to delete the map " + mapName + ".", response.status);
      }
    } catch (error) {
      console.error("Error deleting map:", error);
      errorPopup("Failed to delete map (Network)", "Failed to delete the map " + mapName + ".", error);
    }
  }

  // Map Update ---------------------------------------------------------------------------------------------------------
  let updatePopup = $state(false);
  let filePicker = $state();
  let fileName = $state("Pick file");
  let showStatus = $state(false);
  let statusText = $state("Default...");
  let textareaValue = $state();

  let addInsteadOfOverwrite = $state(false); // Add locations instead of overwriting the old ones

  async function updateMap(mapName) {
    let inputFromFilepicker = false;
    const mapData = filePicker.value ? filePicker.files[0] : textareaValue;
    inputFromFilepicker = filePicker.value ? true : false;

    try {
      let newLocations = inputFromFilepicker ? await getJsonStringFromFile(mapData) : extractCoordinates(mapData);
      let newMapData = newLocations;

      // If add instead of overwrite is selected, add the new locations to the old ones.
      if (addInsteadOfOverwrite) {
        newMapData = JSON.stringify({
          locations: [...mapLocationData?.locations, ...JSON.parse(newLocations)?.locations],
        });
      }

      const body = {
        id: localStorage.getItem("id"),
        name: mapName,
        mapData: newMapData,
      };

      // Send POST request to the server
      const response = await fetch("https://accounts.openguessr.com/maps", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Return the success or error message. No need to parse the response
      if (response.ok) {
        return `Map updated successfully.`;
      } else {
        console.error("Error updating map: " + response.status);
        return "Failed to update map: " + response.status;
      }
    } catch (error) {
      console.error("Error updating map:", error);
      return "A network error occurred while updating the map: " + error;
    }
  }
</script>

<svelte:head>
  <title>{mapName}</title>
</svelte:head>

<div class="mainContainer">
  <!-- Main View (Panorama Preview) -->
  <div class="mapViewIframe">
    <button
      class="standardButton white randomizeLocationButton"
      onclick={() => {
        playSound("basic_button");
        randomLocationIndex = Number(Math.floor(Math.random() * mapLocationAmount));
      }}
    >
      <Dices size={18}></Dices>
    </button>
    <!-- svelte-ignore a11y_missing_attribute -->
    <iframe class="mapIframe" referrerpolicy="no-referrer-when-downgrade" frameborder="0" src={iframeSource}></iframe>
  </div>
  <!-- Author name and Like -->
  <div class="titleContainer">
    <div class="nameContainer">
      <h1 class="header">{mapName}</h1>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <p
        class="authorText"
        onclick={() => {
          loadProfileFromId(mapAuthorId, true);
        }}
      >
        by {mapAuthor}
      </p>
    </div>
    <button
      id="likeMap"
      class="standardButton white"
      onclick={() => {
        playSound("basic_button");
        likeOrDislikeMap(mapName);
      }}
    >
      {#if isLiked}
        <HeartOff />
      {:else}
        <Heart />
      {/if}
      <p id="likesText">{likesCount}</p>
    </button>
  </div>
  <!-- Button Toolbar -->
  <div class="buttonToolbar">
    <div class="toolbarLeft">
      <button
        id="mapLink"
        class="standardButton white"
        onclick={() => {
          playSound("basic_button");
          navigator.clipboard
            .writeText(window.location)
            .then(function () {
              showNotification("Copied!");
            })
            .catch(function (error) {
              showNotification("Error: " + error);
              console.error("Copy error: " + error);
            });
        }}
      >
        <Link strokeWidth={2} size={18} />
      </button>
      {#if mapAuthorId == playerId && playerId}
        <button
          id="manageDelete"
          class="standardButton white"
          onclick={() => {
            playSound("basic_button");
            deleteMapScreen(mapName);
          }}><Trash2 size={18} /></button
        >
        <button
          id="manageUpdate"
          class="standardButton white"
          onclick={() => {
            playSound("basic_button");
            updatePopup = true;
            showStatus = false;
          }}><Replace size={18} /></button
        >
      {/if}
    </div>
    <a
      class="standardButton playButton"
      href="/"
      onclick={() => {
        playSound("basic_button");
        let addedCommunityMaps = JSON.parse(localStorage.getItem("addedCommunityMaps")) || [];
        addedCommunityMaps.push(mapName);
        localStorage.setItem("addedCommunityMaps", JSON.stringify(addedCommunityMaps));
        changeCategory("community_" + mapName.toLowerCase(), true);
      }}
    >
      Play {mapName}
    </a>
  </div>
  <div class="information">
    <div class="locationAmountInfo infoElement">
      <div class="pinIconContainer">
        <MapPin size={100} strokeWidth={1} />
      </div>
      <h2 class="locationAmountText">{mapLocationAmount.toLocaleString()} Locations</h2>
    </div>
    <div class="descriptionInfo infoElement">
      <div class="descriptionScroll">
        <h2 class="descHeader">About "{mapName}"</h2>
        <p>
          {mapDescription}
        </p>
      </div>
    </div>
  </div>
</div>

{#if updatePopup}
  <Popup>
    <h1 id="mapUpdateHeader">Update locations</h1>
    <p class="selectionText">I want to...</p>
    <div class="flexChoiceBox">
      <button
        class="standardButton white"
        class:buttonUnselected={addInsteadOfOverwrite}
        onclick={() => {
          addInsteadOfOverwrite = false;
          playSound("basic_button");
        }}>Overwrite all locations</button
      >
      <button
        class="standardButton white"
        class:buttonUnselected={!addInsteadOfOverwrite}
        onclick={() => {
          addInsteadOfOverwrite = true;
          playSound("basic_button");
        }}>Add locations</button
      >
    </div>
    <p class="marginTop">New locations:</p>
    <textarea
      id="updateMapData"
      class="uploadInfo"
      type="text"
      rows="20"
      bind:value={textareaValue}
      placeholder="https://www.google.com/maps..."
      maxlength="5000000"
    ></textarea>
    <p>...or upload a JSON in the OpenGuessr format:</p>
    <button
      id="jsonUpdateButton"
      class="standardButton white"
      onclick={() => {
        filePicker.click(); // Simulate click on filePicker to make the file picker UI nicer (default picker is hidden)
      }}
    >
      <input
        type="file"
        id="jsonUpdate"
        accept="application/json"
        bind:this={filePicker}
        onchange={(e) => {
          fileName = e.target.files.length > 0 ? e.target.files[0].name : "Pick file";
        }}
      />
      <p id="fileNameUpdate">{fileName}</p>
    </button>
    {#if showStatus}
      <p class="marginTop" id="updateMapStatus">{statusText}</p>
    {/if}
    <div class="buttonBoxRight">
      <button
        id="updateClose"
        class="standardButton closeButton white"
        onclick={() => {
          playSound("basic_button");
          fileName = "Pick file"; // Reset file name input
          updatePopup = false;
        }}>Close</button
      >
      <button
        id="updateProceed"
        class="standardButton closeButton"
        onclick={async () => {
          showStatus = true;
          statusText = "Updating...";
          statusText = "Status: " + (await updateMap(mapName));
        }}>Update</button
      >
    </div>
  </Popup>
{/if}

<style>
  .mainContainer {
    width: calc(100% - 20px);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    padding-inline: 10px;
  }

  .selectionText {
    margin-top: 20px;
    margin-bottom: 5px;
  }

  .descriptionScroll {
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 5px;
    padding-inline: 10px;
    opacity: 0.75;
  }

  .descHeader {
    font-size: 25px;
    margin-bottom: 10px;
  }

  .marginTop {
    margin-top: 20px;
  }

  #updateMapStatus {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 5px;
    border-radius: 10px;
    padding-inline: 15px;
    width: 90%;
  }

  .randomizeLocationButton {
    position: absolute;
    top: 15px;
    right: 15px;
    background-color: rgba(32, 32, 32, 0.75);
    backdrop-filter: blur(5px);
  }

  .buttonUnselected {
    opacity: 0.5;
  }

  .flexChoiceBox {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .infoElement {
    background-color: var(--box-color);
    border-radius: 10px;
    display: flex;
    padding: 10px;
    flex-grow: 1;
    height: 200px;
    min-width: 300px;
    color: white;
  }

  .pinIconContainer {
    opacity: 0.75;
  }

  .locationAmountText {
    opacity: 0.75;
  }

  .uploadInfo {
    border-radius: 10px;
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    width: 75%;
    font-size: 16px;
    min-height: 30px;
    font-family: Barlow;
    border: none;
    padding: 10px;
    padding-inline: 20px;
    margin-bottom: 20px;
    margin-top: 10px;
    transition: background-color 250ms ease;
  }

  .uploadInfo:focus {
    background-color: rgba(255, 255, 255, 0.2);
  }

  #jsonUpdateButton {
    margin-top: 10px;
  }

  .locationAmountInfo {
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 15px;
  }

  .descriptionInfo {
    flex-grow: 4;
  }

  #jsonUpdate {
    display: none;
  }

  .information {
    width: 100%;
    display: flex;
    gap: 20px;
  }

  .nameContainer {
    display: flex;
    max-width: 50%;
    align-items: center;
    flex-wrap: wrap;
  }

  .titleContainer {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .buttonToolbar {
    margin-top: 50px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    width: 100%;
    border-radius: 10px;
    padding: 10px;
    gap: 10px;
    background-color: var(--box-color);
    position: relative;
  }

  .toolbarLeft {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .authorText {
    text-align: left;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
    opacity: 0.5;
    width: fit-content;
    width: 100%;
    cursor: pointer;
    transition: opacity 250ms ease;
  }

  .authorText:hover {
    opacity: 0.25;
  }

  .mapViewIframe {
    width: 100%;
    height: 35dvh;
    max-height: 650px;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 20px;
    opacity: 0.8;
    position: relative;
    background-color: rgb(27, 27, 37);
  }

  .mapIframe {
    width: 100%;
    height: 100%;
  }

  #likesText {
    opacity: 0.5;
    margin-top: 5px;
    margin-bottom: 3px;
    margin-left: 12px;
    font-size: 22px;
  }

  #likeMap {
    margin-left: auto;
    padding-inline: 12px;
    display: flex;
    align-items: center;
    padding-bottom: 5px;
    padding-top: 5px;
    margin-top: auto;
    margin-bottom: auto;
    background-color: var(--box-color);
    border: none;
  }

  .playButton {
    text-decoration: none;
  }

  @media (max-width: 800px) {
    .information {
      flex-wrap: wrap;
    }
  }
</style>

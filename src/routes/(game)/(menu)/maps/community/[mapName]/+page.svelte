<script>
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { errorPopup } from "$lib/utils/errorHandling";
  import { signupPopup } from "$lib/stores/uiStore";
  import { showNotification } from "$lib/utils/notifications";
  import { Link, MapPin, Heart, HeartOff } from "lucide-svelte";
  import { playSound } from "$lib/utils/soundManager";
  import Popup from "$lib/components/Popup.svelte";
  import { onMount } from "svelte";

  let iframeSource = $state("/loader");
  let mapName = $state("Default Name");
  let mapAuthor = $state("Default Author");
  let mapAuthorId = $state(0);
  let mapLocationAmount = $state(999);

  let playerId = $state(0);

  onMount(() => {
    playerId = localStorage.getItem("id") || -1;
  });

  // Panorama -------------------------------------------------------------------------------------

  function handleLoad() {}

  // Like Functionality ------------------------------------------------------------------------------
  let isLiked = $state(false);
  let likesCount = $state("...");

  onMount(() => {
    fetchMapLikeStatus(mapName);
  });

  async function likeOrDislikeMap(mapName) {
    if (localStorage.getItem("bearer") && localStorage.getItem("id")) {
      try {
        const response = await fetch(`https://maps.openguessr.com/maps/like/${mapName}`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("bearer"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: localStorage.getItem("id") }),
        });

        const data = await response.json();

        if (response.ok) {
          await fetchMapInformation(mapName); // fetch new information
        } else {
          console.error("Error liking or disliking map:", data.error);
        }
      } catch (error) {
        console.error("Network error during like or dislike of map:", error);
      }
    } else {
      signupPopup.set(true);
    }
  }

  async function fetchMapLikeStatus(name) {
    try {
      const playerId = localStorage.getItem("id") || null;

      const response = await fetch(`https://maps.openguessr.com/maps/rating/${name}`, {
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
      const response = await fetch("https://maps.openguessr.com/maps/" + mapName, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Return the success or error message. No need to parse the response
      if (response.ok) {
        loadedCommunityMaps = loadedCommunityMaps.filter((map) => map.name !== mapName); // Remove deleted map from map array
        return `Map deleted successfully.`;
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
</script>

<div class="mainContainer">
  <!-- Main View (Panorama Preview) -->
  <div class="mapViewIframe">
    <!-- svelte-ignore a11y_missing_attribute -->
    <iframe
      class="mapIframe"
      referrerpolicy="no-referrer-when-downgrade"
      frameborder="0"
      onload={handleLoad}
      src={iframeSource}
    ></iframe>
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
              showNotification("Copied!", false, false, false);
            })
            .catch(function (error) {
              showNotification("Error: " + error, false, false, false);
              console.error("Copy error: " + error);
            });
        }}
      >
        <Link strokeWidth={2} size={18} />
      </button>
    </div>
    <a
      class="standardButton playButton"
      href="/"
      onclick={() => {
        playSound("basic_button");
        localStorage.setItem("selectedCategory", "community_" + mapName.toLowerCase()); // Set the category
        checkGenerationTypeAndGenerate(); // Generate with this map (this is a link <a>, so it will return to the game page)
      }}
    >
      Play  "{mapName}"
    </a>
    {#if mapAuthorId == playerId && playerId}
      <button
        id="manageDelete"
        class="standardButton white"
        onclick={() => {
          playSound("basic_button");
          deleteMapScreen(mapName);
        }}>Delete</button
      >
      <button
        id="manageUpdate"
        class="standardButton white"
        onclick={() => {
          playSound("basic_button");
          updateMapScreen(mapName);
        }}>Update</button
      >
    {/if}
  </div>
  <div class="information">
    <div class="locationAmountInfo infoElement">
      <div class="pinIconContainer">
        <MapPin size={120} strokeWidth={1} />
      </div>
      <h2 class="locationAmountText">{mapLocationAmount} Locations</h2>
    </div>
    <div class="descriptionInfo infoElement">
      <div class="descriptionScroll">
        <h2 class="descHeader">About "{mapName}"</h2>
      </div>
    </div>
  </div>
</div>

{#if updatePopup}
  <Popup>
    <h1 id="mapUpdateHeader">Update {mapName}</h1>
    <p class="marginTop" id="updateMapStatus">Default</p>
    <p class="marginTop">Locations:</p>
    <textarea
      id="updateMapData"
      class="uploadInfo locationTextbox"
      type="text"
      rows="20"
      placeholder="https://www.google.com/maps..."
      maxlength="5000000"
    ></textarea>
    <p>You can upload a JSON file with <span id="jsonFormatInfoSpanUpdate">this formatting</span>:</p>
    <button id="jsonUpdateButton" class="standardButton">
      <input type="file" id="jsonUpdate" accept="application/json" />
      <p id="fileNameUpdate">Pick file</p>
    </button>
    <div class="buttonBoxRight">
      <button id="updateClose" class="standardButton closeButton">Close</button>
      <button id="updateProceed" class="standardButton playButton">Update</button>
    </div>
  </Popup>
{/if}

<style>
  .mainContainer {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
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
    margin-bottom: 5px;
  }

  #updateMapStatus {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 5px;
    border-radius: 10px;
    padding-inline: 15px;
    width: 90%;
  }

  .infoElement {
    background-color: var(--box-color);
    border-radius: 10px;
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
    flex-grow: 1;
    height: 250px;
    min-width: 300px;
    color: white;
  }

  .pinIconContainer {
    opacity: 0.75;
  }

  .locationAmountText {
    opacity: 0.75;
  }

  .locationAmountInfo {
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 20px;
  }

  .descriptionInfo {
    flex-grow: 4;
  }

  .information {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
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
    width: 100%;
    border-radius: 10px;
    padding: 10px;
    background-color: var(--box-color);
    position: relative;
  }

  .toolbarLeft {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header {
    text-align: left;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
    color: white;
    font-size: 40px;
    width: 100%;
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
    height: 500px;
    border-radius: 10px;
    overflow: hidden;
    pointer-events: none;
    margin-bottom: 20px;
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
  }

  .playButton {
    text-decoration: none;
  }
</style>

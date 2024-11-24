<!-- A popup where you can search for other players and send out friend requests -->
<script>
  import Popup from "$lib/components/Popup.svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { friendBrowsePopup } from "$lib/stores/uiStore";
  import { errorPopup } from "$lib/utils/errorHandling";
  import { sendFriendRequest } from "$lib/utils/sendFriendRequest";

  let userSearchResults = $state();
  let searchQuery = $state("");

  async function startSearch() {
    userSearchResults = undefined;

    try {
      const query = searchQuery;

      if (!query) {
        errorPopup("Empty search", "The search input cannot be empty.", "Missing query");
        return;
      }

      const response = await fetch("https://friends.openguessr.com/friends/search/" + query, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        userSearchResults = data;
        
      } else {
        console.error("Error loading the user browser: " + response.status);
        errorPopup("Error loading users", "An error occured loading users in the user browser.", response.status);
      }
    } catch (error) {
      console.error("Fetch/Network error occurred while loading user browser results: ", error);
      errorPopup("Error loading users (Network)", "A network error occured loading users in the user browser.", error);
    }
  }
</script>

{#if $friendBrowsePopup}
  <Popup z="960" slim="true">
    <div class="popup-title">
      <h1 id="friendBrowserHeader">Search players</h1>
    </div>
    <search id="playerSearch">
      <input
        maxlength="255"
        type="text"
        id="friendBrowserInput"
        bind:value={searchQuery}
        placeholder="Search for a name..."
        onkeydown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
          }
        }}
        onkeyup={(event) => {
          if (event.key === "Enter") {
            startSearch();
          }
        }}
      />
      <button
        id="startFriendSearch"
        class="standardButton"
        onclick={() => {
          playSound("basic_button");
          startSearch();
        }}
      >
        <img src="/img/find_icon.png" alt="start search" id="playerSearchIcon" />
      </button>
    </search>
    <div id="playerSearchBox" class="playerSearchBox">
      {#if userSearchResults}
        {#each userSearchResults as entry}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="friendSearchItem"
            onclick={() => {
              loadProfileFromId(entry.id, true);
            }}
            role="menu"
            tabindex="0"
          >
            <p>${entry.user_name}</p>
            <button
              id="sendFriendRequest"
              class="sendFriendRequestBrowser standardButton"
              onclick={(e) => {
                e.stopPropagation();
                playSound("basic_button");
                sendFriendRequest(entry.id, e.target);
              }}
            >
              Send request +
            </button>
          </div>
        {/each}
      {:else}
        <p class="playerSearchError">Search returned no results.</p>
      {/if}
    </div>
    <button
      id="friendBrowserClose"
      class="standardButton white closeButton"
      onclick={() => {
        playSound("basic_button");
        friendBrowsePopup.set(false);
      }}>Close</button
    >
  </Popup>
{/if}

<style>
  .playerSearchError {
    opacity: 0.5;
    font-size: 22px;
    text-align: center;
    width: 100%;
  }

  #friendBrowserInput {
    border-radius: 10px;
    padding-inline: 10px;
    font-size: 22px;
    flex-grow: 1;
  }
</style>
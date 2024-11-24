<!-- A popup where you can search for other players and send out friend requests -->
<script>
  import Popup from "$lib/components/Popup.svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { friendBrowserPopup } from "$lib/stores/uiStore";
  import { errorPopup } from "$lib/utils/errorHandling";
  import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
  import { loadProfileFromId } from "$lib/utils/loadProfile";

  let userSearchResults = $state();
  let searchQuery = $state("");
  let yourId = $state();

  async function startSearch() {
    userSearchResults = undefined;
    yourId = localStorage.getItem("id") || -1;

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
        userSearchResults = data.users;
        if (userSearchResults.length == 0) userSearchResults = undefined;
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

{#if $friendBrowserPopup}
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
            <p class="entryName">{entry.user_name}</p>
            <button
              id="sendFriendRequest"
              class="sendFriendRequestBrowser standardButton white"
              class:friendSearchYou={entry.id == yourId}
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
        friendBrowserPopup.set(false);
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
    margin-top: auto;
    margin-bottom: auto;
  }

  .playerSearchBox {
    display: flex;
    justify-content: safe center;
    align-items: flex-start;
    flex-wrap: wrap;
    width: calc(100% - 13px);
    border-radius: 5px;
    max-height: 50vh;
    min-height: 20vh;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 2px;
    background-color: var(--box-color);
    gap: 10px;
    margin-top: 10px;
    margin-inline: 5px;
    outline: 5px solid var(--box-color);
    scrollbar-width: none;
}

  #playerSearchIcon {
    width: 20px;
    height: 20px;
    vertical-align: -1px;
  }

  .friendSearchItem {
    display: flex;
    gap: 5px;
    justify-content: space-between;
    align-items: center;
    border-radius: 5px;
    padding: 5px;
    padding-inline: 15px;
    width: calc(100% - 30px);
    transition: background-color 250ms ease;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .friendSearchItem:hover {
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.2);
  }

  .entryName {
    max-width: 50%;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .friendSearchYou {
    pointer-events: none;
    opacity: 0.5;
  }

  #friendBrowserInput {
    border-radius: 10px;
    padding-inline: 10px;
    font-size: 22px;
    flex-grow: 1;
  }

  #playerSearch {
    margin-bottom: 20px;
    margin-top: 20px;
    height: 45px;
  }

  #startFriendSearch {
    background-color: rgba(255, 255, 255, 0.1);
    width: fit-content;
    margin: 0;
    border-radius: 10px;
  }

  .sendFriendRequestBrowser {
    margin-right: -8px;
  }
</style>

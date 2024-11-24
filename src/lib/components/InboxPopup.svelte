<script>
  import Popup from "$lib/components/Popup.svelte";
  import { inboxPopup } from "$lib/stores/uiStore";
  import { onDestroy, onMount } from "svelte";
  import { inboxIconNew, inboxContent } from "$lib/stores/context-specific/inboxStore";
  import { loadInbox } from "$lib/logic/friendAPI";
  import { playSound } from "$lib/utils/soundManager";
  import { acceptFriendRequest, declineFriendRequest } from "$lib/logic/friendAPI";
  import { loadProfileFromId } from "$lib/utils/loadProfile";

  let inboxRefreshInterval;

  onMount(() => {
    inboxIconNew.set(false);
    loadInbox();

    // Re-fetch the inbox every X seconds
    clearInterval(inboxRefreshInterval);
    inboxRefreshInterval = setInterval(() => {
      if ($inboxPopup) {
        loadInbox();
      }
    }, 5000);
  });

  onDestroy(() => {
    clearInterval(inboxRefreshInterval);
  });
</script>

ƒ
{#if $inboxPopup}
  <Popup z="960" slim="true">
    <div class="popup-title">
      <h1 id="inboxPopupHeader">Inbox</h1>
    </div>
    <div id="friendInbox" class="playerSearchBox">
      {#if $inboxContent}
        {#each $inboxContent as entry}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="friendSearchItem"
            role="menu"
            tabindex="0"
            onclick={() => {
              loadProfileFromId(entry.id, true);
            }}
          >
            <p>${entry.user_name}</p>
            <div class="inboxItemButtons">
              <button
                class="standardButton"
                onclick={(e) => {
                  e.stopPropagation();
                  playSound("basic_button");
                  acceptFriendRequest(entry.id);
                }}
              >
                Accept
              </button>
              <button
                class="standardButton"
                onclick={(e) => {
                  e.stopPropagation();
                  playSound("basic_button");
                  declineFriendRequest(entry.id);
                }}
              >
                Decline
              </button>
            </div>
          </div>
        {/each}
      {:else}
        <p>Your inbox is empty.</p>
      {/if}
    </div>
    <button
      id="friendInboxClose"
      class="standardButton white closeButton"
      onclick={() => {
        playSound("basic_button");
        inboxPopup.set(false);
      }}>Close</button
    >
  </Popup>
{/if}

<style>
  .friendSearchItem {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    width: calc(100% - 30px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    padding-inline: 15px;
    transition: background-color 250ms ease;
    gap: 10px;
  }

  .friendSearchItem p {
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 20vw;
  }

  .inboxItemButtons {
    display: flex;
    width: fit-content;
    overflow: hidden;
    gap: 5px;
    margin-right: -7px;
    flex-grow: 5;
    max-width: fit-content;
  }
</style>

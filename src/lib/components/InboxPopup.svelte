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
                class="manageFriendRequest standardButton"
                onclick={(e) => {
                  e.stopPropagation();
                  playSound("basic_button");
                  acceptFriendRequest(entry.id);
                }}
              >
                Accept
              </button>
              <button
                class="manageFriendRequest standardButton"
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
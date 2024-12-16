<script>
  import { PlusCircle, Unplug, Swords, ContactRound } from "lucide-svelte";
  import { friendBrowserPopup, inboxPopup, troubleshootPopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { loadedFriendsData, multiplayerCategory } from "$lib/stores/context-specific/multiplayerStore";
  import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
  import { loadFriends, removeFriend, sendMatchInvite } from "$lib/logic/friendAPI";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { findDuel } from "$lib/logic/multiplayerLogic";
  import { signupPrompt } from "$lib/utils/signupPrompt";
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { scale } from "svelte/transition";
  import { bounceInOut } from "svelte/easing";

  let friendsRefreshInterval;

  onMount(async () => {
    // On Popup opened
    multiplayerCategory.set(localStorage.getItem("selectedCategory") || "standard");

    await loadFriends();
    clearInterval(friendsRefreshInterval);

    // Re-fetch friends every X seconds
    friendsRefreshInterval = setInterval(() => {
      loadFriends();
    }, 15000);
  });

  onDestroy(() => {
    clearInterval(friendsRefreshInterval);
  });
</script>

<svelte:head>
  <title>Multiplayer</title>
</svelte:head>

<div class="main-container">
  <div class="headerContainer">
    <h1 class="header">Multiplayer</h1>
  </div>
  <div class="playBox">
    <div class="groupPartyButtons">
      <h3 class="playButtonsHeader">Custom</h3>
      <div class="groupPartyContent">
        <button
          in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
          id="multiplayerSelectJoin"
          class="standardButton multiplayerSelect white"
          href="/multiplayer/join"
          onclick={() => {
            playSound("basic_button");
            goto("/multiplayer/join");
          }}>Join <span class="groupIcons"><Unplug size="19" /></span></button
        >
        <button
          in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
          id="multiplayerSelectHost"
          class="standardButton multiplayerSelect white"
          href="/multiplayer/host"
          onclick={() => {
            playSound("basic_button");
            goto("/multiplayer/host");
          }}>Host <span class="groupIcons"><PlusCircle size="19" /></span></button
        >
      </div>
    </div>
    <div class="groupPartyButtons">
      <h3 class="playButtonsHeader">Matchmaking</h3>
      <div class="groupPartyContent">
        <button
          in:scale={{ duration: 250, start: 0.95, easing: bounceInOut }}
          id="multiplayerSelectDuels"
          class="standardButton multiplayerSelect"
          href="/multiplayer/duel"
          onclick={() => {
            playSound("basic_button");
            if ($isAuthenticated) {
              goto("/multiplayer/duel");
              findDuel();
            } else {
              signupPrompt();
            }
          }}
        >
          Find Duel
          <img
            id="findIcon"
            class="multiplayerMenuIcon"
            style="margin-left: 5px;"
            src="/img/find_icon.png"
            alt="Lightning error symbol"
          />
        </button>
      </div>
    </div>
  </div>
  <div class="headerContainer headerMarginTop">
    <h2 class="header">Friends</h2>
    <!-- Inbox and Friend request buttons-->
    <div class="friendButtonBox">
      <button
        class="standardButton white friendActionButton"
        onclick={() => {
          playSound("basic_button");
          if ($isAuthenticated) {
            friendBrowserPopup.set(true);
          } else {
            signupPrompt();
          }
        }}><p class="addFriendText">Add friend <ContactRound strokeWidth={2.5} size={20} /></p></button
      >
      <button
        class="standardButton white friendActionButton"
        onclick={() => {
          playSound("basic_button");
          if ($isAuthenticated) {
            inboxPopup.set(true);
          } else {
            signupPrompt();
          }
        }}
      >
        Inbox
        <img alt="inbox icon" src={$inboxIconNew ? "/img/inbox_icon_new.png" : "/img/inbox_icon.png"} id="inboxIcon" />
      </button>
    </div>
  </div>
  <div class="friendBox" style:min-height={$loadedFriendsData ? "50px" : "80px"}>
    {#if $loadedFriendsData && $isAuthenticated}
      {#each $loadedFriendsData as entry}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="standardButton white friendItem"
          role="menu"
          tabindex="0"
          onclick={() => {
            loadProfileFromId(entry.id, true);
          }}
        >
          {#if entry.online}
            <div class="friendOnlineBar"></div>
          {/if}
          <p>{entry.user_name}</p>
          <button
            id="duelFriend"
            class="standardButton friendItemButtons white"
            onclick={(e) => {
              e.stopPropagation();
              playSound("basic_button");
              sendMatchInvite(entry.id, true);
            }}
          >
            <Swords strokeWidth={3} size={17} />
          </button>
          <button
            id="removeFriend"
            class="standardButton friendItemButtons white"
            onclick={(e) => {
              e.stopPropagation();
              playSound("basic_button");
              showConfirmPopup(
                "Remove friend?",
                "You are about to remove your friend from your list. Your friend will see this and might not like it. Use this at our own risk.",
                () => {
                  removeFriend(entry.id);
                },
              );
            }}
          >
            <img alt="remove friend" class="friendRemoveIcon" src="/img/delete_icon.png" />
          </button>
        </div>
      {/each}
    {:else}
      <p class="noFriendsText">Added friends show up here.</p>
    {/if}
  </div>
  <div class="headerContainer headerMarginTop">
    <h2 class="header">More</h2>
  </div>
  <div class="moreContainer">
    <button
      class="white standardButton"
      id="troubleshootGuideButton"
      onclick={() => {
        playSound("basic_button");
        troubleshootPopup.set(true);
      }}
      >Troubleshooting Guide
      <img
        class="multiplayerMenuIcon"
        src="/img/error_icon.png"
        alt="Lightning error symbol"
        style="opacity: 60%;"
      /></button
    >
  </div>
</div>

<style>
  .main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .addFriendText {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  .playBox {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    margin-top: 5px;
    gap: 15px;
    flex-wrap: wrap;
  }

  .friendActionButton {
    justify-content: center !important;
    min-height: 50px;
    padding-inline: 15px;
    border-radius: 10px;
  }

  .playButtonsHeader {
    width: calc(100% - 20px);
    font-size: 25px;
    opacity: 0.5;
    padding-inline: 10px;
  }

  .moreContainer {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }

  .headerMarginTop {
    margin-top: 50px;
  }

  #duelFriend {
    margin-left: auto;
  }

  .friendButtonBox {
    display: flex;
    gap: 10px;
  }

  .friendItem {
    border-radius: 10px;
    display: flex;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 10px;
    height: 50px;
    padding-inline: 5px;
    align-items: center;
    justify-content: space-between;
    padding-left: 12px;
    border: none;
    box-shadow: none;
    gap: 3px;
    flex-grow: 1;
    max-width: 400px;
    overflow: hidden;
    animation: fadeIn 100ms ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .friendItem p {
    padding-inline: 5px;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 50%;
  }

  .friendItemButtons {
    padding-inline: 5px;
  }

  .friendRemoveIcon {
    width: 25px;
    height: 25px;
    vertical-align: -4px;
  }

  .groupIcons {
    margin-inline: 3px;
    vertical-align: -2px;
  }

  .groupPartyButtons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    align-items: center;
    flex-grow: 1.5;
    background-color: var(--box-color);
    padding: 10px;
    padding: 10px;
    border-radius: 15px;
  }

  .groupPartyContent {
    width: 100%;
    display: flex;
    gap: 10px;
  }

  .multiplayerSelect {
    height: 50px;
    width: auto;
    flex-grow: 1;
    border-radius: 10px;
  }

  #multiplayerSelectDuels {
    background-color: var(--brand-color);
    color: white;
    position: relative;
    overflow: hidden;
  }

  #multiplayerSelectDuels::before {
    animation: duelButtonGlint 4s 0.5s infinite;
    background: white;
    content: "";
    opacity: 0;
    position: absolute;
    width: 40px;
    z-index: 1;
    height: 200%;
    top: -20px;
    left: 0;
    transform: rotate(30deg);
    pointer-events: none;
  }

  #findIcon {
    margin-right: 0;
  }

  .multiplayerMenuIcon {
    width: 20px;
    height: auto;
    margin-inline: 2px;
    margin-bottom: -2px;
  }

  .noFriendsText {
    opacity: 0.5;
    text-align: center;
    margin-left: 20px;
    margin-right: auto;
  }

  .friendOnlineBar {
    width: 6px;
    border-radius: 5px;
    height: 30%;
    background-color: #00cc00;
    margin-top: 4px;
    margin-right: 3px;
  }

  .friendBox {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    width: calc(100% - 20px);
    transition: max-height 150ms ease;
    background-color: var(--box-color);
    border-radius: 15px;
    padding: 10px;
    overflow: hidden;
  }

  #inboxIcon {
    width: 20px;
    height: 20px;
    vertical-align: -3px;
    margin-left: 5px;
  }

  #troubleshootGuideButton {
    min-height: 50px;
    border-radius: 10px;
  }

  @keyframes duelButtonGlint {
    0% {
      opacity: 0.5;
      margin-left: -60px;
      visibility: visible;
    }

    20% {
      opacity: 0.3;
      margin-left: calc(100% + 60px);
    }

    100% {
      opacity: 0.3;
      margin-left: calc(100% + 60px);
    }
  }
</style>

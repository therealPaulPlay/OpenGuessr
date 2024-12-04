<script>
  import Popup from "$lib/components/Popup.svelte";
  import { PlusCircle, Unplug, ArrowRightLeft } from "lucide-svelte";
  import {
    multiplayerPopup,
    friendBrowserPopup,
    inboxPopup,
    troubleshootPopup,
  } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
  import {
    loadedFriendsData,
    currentScreen,
    hostStage,
    teamAmount,
    roundAmount,
    roundLength,
    peerId,
    screenEscapeDisabled,
    multiplayerCategory,
    duelRetryEnabled,
    connectedClientsCount,
    multiplayerStatus,
    restrictionButtonText,
    teamsDisplayText,
  } from "$lib/stores/context-specific/multiplayerStore";
  import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
  import { showNotification } from "$lib/utils/notifications";
  import { loadFriends, removeFriend, sendMatchInvite } from "$lib/logic/friendAPI";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { Link } from "lucide-svelte";
  import {
    findDuel,
    leaveMultiplayerRound,
    joinRoom,
    createRoom,
    toggleMultiplayerRestriction,
  } from "$lib/logic/multiplayerLogic";
  import Ticker from "./Ticker.svelte";
  import { get } from "svelte/store";
  import { goto } from "$app/navigation";
  import { signupPrompt } from "$lib/utils/signupPrompt";

  let friendSectionLoaded = $state(false);
  let friendsRefreshInterval;

  let roomCodeInput = $state("");

  multiplayerPopup.subscribe(async (value) => {
    if (value) {
      // On Popup opened
      multiplayerCategory.set(localStorage.getItem("selectedCategory") || "standard");

      // UI Resets - important, as when starting a multiplayer round, these values are not being reset
      roomCodeInput = "";
      currentScreen.set("main");
      hostStage.set(1);

      await loadFriends();
      clearInterval(friendsRefreshInterval);

      // Re-fetch friends every X seconds
      friendsRefreshInterval = setInterval(() => {
        loadFriends();
      }, 15000);

      setTimeout(() => {
        friendSectionLoaded = true;
      }, 50);
    } else {
      clearInterval(friendsRefreshInterval);
    }
  });
</script>

{#if $multiplayerPopup}
  <Popup slim="true">
    <div class="popup-title">
      <h1>Multiplayer</h1>
    </div>
    {#if $currentScreen == "main"}
      <div id="multiplayerWindowMain">
        <div class="multiplayerHorizontalAlign">
          <div class="groupPartyButtons">
            <button
              id="multiplayerSelectJoin"
              class="standardButton multiplayerSelect white"
              onclick={() => {
                playSound("basic_button");
                currentScreen.set("join");
              }}>Join <span class="groupIcons"><Unplug size="19" /></span></button
            >
            <button
              id="multiplayerSelectHost"
              class="standardButton multiplayerSelect white"
              onclick={() => {
                playSound("basic_button");
                currentScreen.set("host");
              }}>Host <span class="groupIcons"><PlusCircle size="19" /></span></button
            >
          </div>
          <div class="groupPartyButtons">
            <button
              id="multiplayerSelectDuels"
              class="standardButton multiplayerSelect"
              onclick={() => {
                playSound("basic_button");
                if ($isAuthenticated) {
                  currentScreen.set("duel");
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
        <div class="multiplayerFriendArea">
          {#if !$isAuthenticated}
            <p class="noFriendsText">Sign up to add friends!</p>
          {/if}
          {#if $isAuthenticated}
            {#if $loadedFriendsData}
              <div id="friendBox" class="friendBox" style:max-height={friendSectionLoaded ? "145px" : "0px"}>
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
                      class="standardButton friendItemButtons"
                      onclick={(e) => {
                        e.stopPropagation();
                        playSound("basic_button");
                        sendMatchInvite(entry.id, true);
                      }}
                    >
                      1v1
                    </button>
                    <button
                      id="removeFriend"
                      class="standardButton friendItemButtons"
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
              </div>
            {:else}
              <p class="noFriendsText">Added friends appear here.</p>
            {/if}
          {/if}
          <div class="friendButtonArea">
            <button
              class="standardButton white friendsAreaButton"
              id="browseUsersFriends"
              onclick={() => {
                playSound("basic_button");

                if ($isAuthenticated) {
                  friendBrowserPopup.set(true);
                } else {
                  signupPrompt();
                }
              }}>Add friends +</button
            >
            <button
              class="standardButton white friendsAreaButton"
              id="openFriendInbox"
              onclick={() => {
                playSound("basic_button");
                if ($isAuthenticated) {
                  inboxPopup.set(true);
                } else {
                  signupPrompt();
                }
              }}
            >
              <img
                alt="inbox icon"
                src={$inboxIconNew ? "/img/inbox_icon_new.png" : "/img/inbox_icon.png"}
                id="inboxIcon"
              />
            </button>
          </div>
        </div>
        <div class="infoNote">
          <div id="troubleshootingArea">
            <p id="issuesTroubleshootText">
              <img
                id="errorIcon"
                class="multiplayerMenuIcon"
                src="/img/error_icon.png"
                alt="Lightning error symbol"
                style="opacity: 60%;"
              />
              Having issues?
            </p>
            <button
              class="white standardButton"
              id="troubleshootGuideButton"
              onclick={() => {
                playSound("basic_button");
                troubleshootPopup.set(true);
              }}>Troubleshooting Guide</button
            >
          </div>
        </div>
      </div>
    {/if}
    {#if $currentScreen == "join"}
      <div id="multiplayerWindowJoin">
        <div class="multiplayerJoinAlign">
          <div class="multiplayerJoinField">
            <p id="multiplayerJoinInfo" class="multiplayerInputInfo">{$multiplayerStatus || "Input a room code."}</p>
            <input
              id="roomCodeInput"
              type="text"
              class="multiplayerInput"
              placeholder="Room code"
              bind:value={roomCodeInput}
            />
          </div>
          <button
            id="multiplayerJoin"
            class="standardButton"
            class:buttonDisabled={!Boolean(roomCodeInput)}
            onclick={() => {
              playSound("start_button");
              joinRoom(roomCodeInput);
            }}
            onkeypress={(e) => {
              if (e.key == "Enter") {
                e.preventDefault();
                playSound("start_button");
                joinRoom(roomCodeInput);
              }
            }}>Join</button
          >
        </div>
      </div>
    {/if}
    {#if $currentScreen == "host"}
      <div id="multiplayerWindowHost">
        <div class="multiplayerCreationArea">
          {#if $hostStage == 1}
            <div id="roomCreationSettings" class="multiplayerHostSettings">
              <div>
                <p>Rounds:</p>
                <Ticker limit={10} minimum={2} initialValue={3} bind:value={$roundAmount} />
              </div>
              <div>
                <p>Round Length:</p>
                <Ticker limit={300} step={10} minimum={10} note="sec" initialValue={60} bind:value={$roundLength} />
              </div>
            </div>
            <div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
              <p>Restriction:</p>
              <button
                id="toggleRestrictions"
                class="standardButton white"
                onclick={() => {
                  playSound("basic_button");
                  toggleMultiplayerRestriction();
                }}>{$restrictionButtonText}</button
              >
            </div>
            <div id="roomCreationTeams" class="roomCreationModule multiplayerHostSettings">
              <p>Teams:</p>
              <div class="ticker">
                <Ticker limit={5} lowerLimitText="no" note="teams" initialValue={1} bind:value={$teamAmount} />
              </div>
            </div>
            <div id="roomCreationMap" class="roomCreationModule multiplayerHostSettings">
              <p>Selected Map:</p>
              <div class="selectedMapField">
                <p id="multiplayerMapDisplay">{$multiplayerCategory.replace("community_", "")}</p>
                <button
                  class="standardButton white"
                  onclick={() => {
                    playSound("basic_button");
                    multiplayerPopup.set(false);
                    goto("/maps");
                  }}><ArrowRightLeft size={17} strokeWidth={2} /></button
                >
              </div>
            </div>
          {/if}
          {#if $hostStage == 2}
            <div id="hostCodeArea" class="multiplayerHostCodeArea">
              <div id="roomCodeDisplayArea">
                <p>Join with code:</p>
                <h1 id="roomCodeDisplay">{$peerId.replace("openguessr_", "")}</h1>
              </div>
              <div id="teamsDisplay" class="roomCreationModule multiplayerHostSettings">
                <p id="teamsDisplayText">{$teamsDisplayText}</p>
                <p id="smallJoinCounter">{$connectedClientsCount + 1}</p>
              </div>
              {#if $loadedFriendsData && $loadedFriendsData.filter((value) => value.online).length >= 1}
                <div id="friendsInviteDisplay" class="roomCreationModule multiplayerHostSettings">
                  <div id="roomCreationFriendsBox" class="roomCreationFriendsBox">
                    <!-- online players will be added here programmatically -->
                    {#each $loadedFriendsData.filter((value) => value.online) as entry}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <div
                        class="standardButton roomCreationFriendItem"
                        role="menu"
                        tabindex="0"
                        onclick={() => {
                          loadProfileFromId(entry.id, true);
                        }}
                      >
                        <p class="friendsRoomEntryText">{entry.user_name}</p>
                        <button
                          class="standardButton white sendInviteButton"
                          onclick={(e) => {
                            e.stopPropagation();
                            playSound("basic_button");
                            sendMatchInvite(entry.id, false);
                          }}
                        >
                          <img src="/img/send_icon.png" alt="send invite" class="sendIcon" />
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
          <div class="multiplayerHostSubmitArea">
            <div id="innerSubmitAreaBlock">
              {#if $hostStage == 2}
                <button
                  id="roomcodeLink"
                  class="copyLinkButton standardButton white"
                  onclick={() => {
                    playSound("basic_button");
                    const roomId = get(peerId).replace("openguessr_", "");

                    // Copy to Clipboard
                    navigator.clipboard
                      .writeText(window.location.origin + "/?join=" + roomId)
                      .then(function () {
                        showNotification("Copied!");
                      })
                      .catch(function (error) {
                        showNotification("Error: " + error);
                      });

                    // Use CrazyGames Link invite feature
                    if ($crazyGames) {
                      const link = window.CrazyGames.SDK.game.inviteLink({
                        join: roomId,
                      });
                    }
                  }}
                >
                  <Link strokeWidth="2" size="16" />
                </button>
              {/if}
              <button
                id="multiplayerHost"
                class="standardButton"
                class:buttonDisabled={$hostStage == 2 &&
                  ($connectedClientsCount + 1 < get(teamAmount) || $connectedClientsCount == 0)}
                onclick={() => {
                  playSound("basic_button");
                  createRoom(get(roundAmount), get(roundLength));

                  // Switch to stage 2 (host code area) if on stage 1 (after the create room function!!)
                  if ($hostStage == 1) {
                    hostStage.set(2);
                  }
                }}>{$hostStage == 1 ? "Create room" : "Start"}</button
              >
            </div>
          </div>
        </div>
      </div>
    {/if}
    {#if $currentScreen == "duel"}
      <div id="multiplayerWindowDuel">
        <div class="multiplayerJoinAlign">
          <p
            id="multiplayerDuelInfo"
            class="multiplayerDuelStatus"
            class:loading={$multiplayerStatus && $multiplayerStatus?.toLowerCase()?.includes("wait")}
          >
            {$multiplayerStatus || "No match found."}
          </p>
          <button
            id="multiplayerDuelRetry"
            class="standardButton"
            class:buttonDisabled={!$duelRetryEnabled}
            onclick={() => {
              playSound("basic_button");
              findDuel();
            }}>Try Again</button
          >
        </div>
      </div>
    {/if}
    <button
      id="multiplayerSelectorClose"
      class="standardButton white closeButton"
      class:buttonDisabled={$screenEscapeDisabled}
      onclick={() => {
        playSound("basic_button");
        multiplayerPopup.set(false);
        leaveMultiplayerRound();
      }}>Close</button
    >
    {#if $currentScreen != "main"}
      <button
        id="multiplayerSelectorBack"
        class="standardButton white closeButton"
        class:buttonDisabled={$screenEscapeDisabled}
        onclick={() => {
          playSound("basic_button");
          roomCodeInput = "";
          currentScreen.set("main");
          hostStage.set(1);
          leaveMultiplayerRound();
        }}>Back</button
      >
    {/if}
  </Popup>
{/if}

<style>
  .multiplayerHorizontalAlign {
    display: flex;
    gap: 10px;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .selectedMapField {
    display: flex;
    gap: 10px;
    border-radius: 10px;
    justify-content: left;
    padding: 4px;
    width: fit-content;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
    background-color: rgba(255, 255, 255, 0.1);
  }

  #multiplayerWindowMain {
    max-height: calc(100dvh - 250px);
    overflow: auto;
  }

  .infoNote {
    margin: 10px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    background-color: var(--box-color);
    border-radius: 10px;
  }

  .friendItem {
    background-color: rgba(30, 31, 44, 0.25);
    border-radius: 11px;
    height: 49px;
    padding-inline: 3px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 12px;
    gap: 2px;
  }

  .friendItem p {
    padding-inline: 3px;
  }

  .friendItemButtons {
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0;
    padding-inline: 5px;
  }

  .sendInviteButton {
    padding: 0;
    padding-inline: 5px;
  }

  .friendRemoveIcon {
    width: 25px;
    height: 25px;
    vertical-align: -4px;
  }

  .friendsAreaButton {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .infoNote p {
    padding: 5px;
    padding-left: 5px;
    padding-right: 15px;
    padding-bottom: 15px;
    opacity: 75%;
    font-size: 22px;
    max-height: 50px;
    overflow-y: auto;
  }

  .groupIcons {
    margin-inline: 3px;
    vertical-align: -2px;
  }

  #multiplayerMapDisplay {
    min-width: 120px;
    text-align: center;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 5px;
    padding-inline: 10px;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: 5px;
    font-size: 20px;
    margin-left: 4px;
  }

  .groupPartyButtons {
    display: flex;
    gap: 5px;
    justify-content: center;
    align-items: center;
    background-color: var(--box-color);
    padding: 5px;
    border-radius: 10px;
    flex-grow: 1.5;
  }

  .multiplayerCreationArea {
    background-color: rgba(30, 31, 44, 0.5);
    border-radius: 15px;
    padding: 8px;
    margin: 10px;
    overflow: auto;
    max-height: calc(100dvh - 300px);
  }

  .multiplayerInput {
    padding: 5px 15px;
    font-size: 22px;
    border-radius: 5px;
    outline: none;
    border: none;
    user-select: none;
    width: calc(100% - 60px);
  }

  .multiplayerSelect {
    height: 50px;
    width: auto;
    flex-grow: 1;
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

  .multiplayerFriendArea {
    margin: 10px;
    width: calc(100% - 20px);
    margin-left: auto;
    margin-right: auto;
    background-color: var(--box-color);
    border-radius: 10px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: 22px;
    padding: 10px;
    flex-wrap: wrap;
    gap: 5px;
  }

  .noFriendsText {
    opacity: 0.75;
    text-align: center;
    margin-left: 10px;
    margin-right: auto;
  }

  .sendIcon {
    vertical-align: -2px;
    width: 20px;
    height: 20px;
  }

  .roomCreationFriendItem {
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-inline: 5px;
    flex-grow: 1;
  }

  .friendOnlineBar {
    width: 6px;
    border-radius: 5px;
    height: 20%;
    background-color: #00cc00;
    margin-top: 4px;
    margin-right: 3px;
  }

  .friendsRoomEntryText {
    padding-inline: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  .friendBox {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
    margin-bottom: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 5px;
    overflow: auto;
    scrollbar-width: none;
    box-sizing: border-box;
    border: 5px solid rgba(77, 77, 87, 0.1);
    min-width: 100%;
    transition: max-height 150ms ease;
  }

  .friendButtonArea {
    display: flex;
    justify-content: center;
    width: fit-content;
    align-items: center;
    gap: 5px;
    margin-left: auto;
  }

  #inboxIcon {
    width: 20px;
    height: 20px;
    vertical-align: -2px;
  }

  #troubleshootingArea {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    padding: 10px;
    gap: 10px;
  }

  #issuesTroubleshootText {
    padding-bottom: 5px;
    margin-right: auto;
    flex-grow: 50;
  }

  #errorIcon {
    margin-right: 10px;
    vertical-align: -2px;
  }

  #troubleshootGuideButton {
    flex-grow: 1;
  }

  .multiplayerJoinAlign {
    display: flex;
    gap: 10px;
    padding: 10px;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 30px;
    width: fit-content;
    min-width: 65%;
    margin-left: auto;
    margin-right: auto;
    flex-wrap: wrap;
    flex-direction: column;
    background-color: rgba(30, 31, 44, 0.5);
    border-radius: 10px;
  }

  .multiplayerJoinField {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 7px;
    width: calc(100% - 20px);
    padding: 10px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    flex-wrap: wrap;
    display: flex;
    gap: 5px;
  }

  #multiplayerJoin {
    width: 35%;
  }

  .multiplayerInputInfo {
    font-size: 18px;
    padding: 0;
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    width: calc(100% - 20px);
    padding-left: 20px;
  }

  .multiplayerHostSettings {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    gap: 2px;
    background-color: var(--box-color);
    border-radius: 10px;
    padding: 5px;
    padding-top: 10px;
  }

  .roomCreationModule {
    margin-top: 8px;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  #roomCodeDisplayArea p {
    opacity: 0.5;
    font-size: 20px;
  }

  #roomCreationFriendsBox {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    border-radius: 5px;
    max-height: 130px;
    overflow: auto;
    gap: 5px;
    padding: 0;
    width: 100%;
    transition: max-height 250ms ease;
  }

  #friendsInviteDisplay {
    width: calc(100% - 10px);
    border-radius: 7px;
    padding: 5px;
    background-color: rgba(30, 31, 44, 0.5);
  }

  #toggleRestrictions {
    min-width: 170px;
  }

  #smallJoinCounter {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    height: 29px;
    width: 30px;
    border-radius: 5px;
    text-align: center;
    color: rgba(255, 255, 255, 0.75);
    font-size: 22px;
    line-height: 30px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  #teamsDisplay {
    background-color: rgba(30, 31, 44, 0.5);
    width: calc(100% - 10px);
    border-radius: 7px;
    position: relative;
  }

  #teamsDisplayText {
    padding-inline: 40px;
    opacity: 0.5;
    font-size: 22px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #innerSubmitAreaBlock {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  .copyLinkButton {
    margin: 5px;
    padding-inline: 10px;
  }

  #multiplayerHost {
    padding-inline: 20px;
  }

  .multiplayerHostSubmitArea {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    padding-bottom: 5px;
  }

  .multiplayerHostCodeArea {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    background-color: var(--box-color);
    border-radius: 10px;
    padding: 15px;
    padding-top: 10px;
    flex-direction: column;
  }

  .multiplayerDuelStatus {
    text-align: center;
    width: 100%;
    text-wrap: wrap;
    font-size: 30px;
    color: white;
    min-height: 60px;
    margin-top: 10px;
    max-width: 400px;
    transition: color 250ms ease;
  }

  .multiplayerDuelStatus.loading {
    animation: loadingText 1s infinite;
  }

  @keyframes loadingText {
    0% {
      color: white;
    }

    50% {
      color: rgb(140, 140, 140);
    }

    100% {
      color: white;
    }
  }

  #multiplayerSelectorBack {
    opacity: 0.5;
    margin-right: 8px;
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

  #roomCodeDisplay {
    font-size: 40px;
    min-width: 75%;
    text-align: center;
  }

  #roomCodeDisplayArea {
    background-color: rgba(255, 255, 255, 0.1);
    padding: 5px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin: 10px;
    margin-top: 5px;
    margin-inline: 0;
    width: calc(100% - 10px);
  }

  .buttonDisabled {
    pointer-events: none !important;
    opacity: 0.5;
  }
</style>

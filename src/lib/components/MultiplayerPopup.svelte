<script>
  import Popup from "$lib/components/Popup.svelte";
  import { PlusCircle, Unplug } from "lucide-svelte";
  import { multiplayerPopup, signupPopup, friendBrowserPopup, inboxPopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import { troubleshootPopup } from "$lib/stores/uiStore";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { loadedFriendsData } from "$lib/stores/context-specific/multiplayerStore";
  import { inboxIconNew } from "$lib/stores/context-specific/inboxStore";
  import { loadFriends, removeFriend } from "$lib/logic/friendAPI";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";

  let friendSectionLoaded = $state(false);

  let friendsRefreshInterval;

  multiplayerPopup.subscribe(async (value) => {
    if (value) {
      await loadFriends();

      // Re-fetch friends every X seconds
      clearInterval(friendsRefreshInterval);
      friendsRefreshInterval = setInterval(() => {
        loadFriends();
      }, 10000);

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
    <div id="multiplayerWindowMain">
      <div class="multiplayerHorizontalAlign">
        <div class="groupPartyButtons">
          <button id="multiplayerSelectJoin" class="standardButton multiplayerSelect white"
            >Join <span class="groupIcons"><Unplug size="19" /></span></button
          >
          <button id="multiplayerSelectHost" class="standardButton multiplayerSelect white"
            >Host <span class="groupIcons"><PlusCircle size="19" /></span></button
          >
        </div>
        <div class="groupPartyButtons">
          <button id="multiplayerSelectDuels" class="standardButton multiplayerSelect">
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
                  onclick={() => {
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
        <div class="friendButtonArea">
          <button
            class="standardButton white friendsAreaButton"
            id="browseUsersFriends"
            onclick={() => {
              if ($isAuthenticated) {
                friendBrowserPopup.set(true);
              } else {
                signupPopup.set(true);
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
                signupPopup.set(true);
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
    <div id="multiplayerWindowJoin" style="display: none;">
      <div class="multiplayerJoinAlign">
        <div class="multiplayerJoinField">
          <p id="multiplayerJoinInfo" class="multiplayerInputInfo">Enter the room code (default).</p>
          <input id="roomCodeInput" type="text" class="multiplayerInput" placeholder="Room code" />
        </div>
        <button id="multiplayerJoin" class="standardButton">Join</button>
      </div>
    </div>
    <div id="multiplayerWindowHost" style="display: none;">
      <div class="multiplayerCreationArea">
        <div id="roomCreationSettings" class="multiplayerHostSettings">
          <div>
            <p>Rounds:</p>
            <div class="ticker">
              <button id="roundMinus" class="standardButton white">-</button>
              <p id="roundAmountText" class="tickerText">3</p>
              <button id="roundPlus" class="standardButton white">+</button>
            </div>
          </div>
          <div>
            <p>Round Length:</p>
            <div class="ticker">
              <button id="lengthMinus" class="standardButton white">-</button>
              <p id="roundLengthText" class="tickerText">2</p>
              <p class="tickerNote">sec</p>
              <button id="lengthPlus" class="standardButton white">+</button>
            </div>
          </div>
        </div>
        <div id="roomCreationModes" class="roomCreationModule multiplayerHostSettings">
          <p>Restrictions:</p>
          <button id="toggleRestrictions" class="standardButton white">Standard</button>
        </div>
        <div id="roomCreationTeams" class="roomCreationModule multiplayerHostSettings">
          <p>Teams:</p>
          <div class="ticker">
            <button id="teamsMinus" class="standardButton white">-</button>
            <p id="teamAmountText" class="tickerText">no</p>
            <p class="tickerNote">teams</p>
            <button id="teamsPlus" class="standardButton white">+</button>
          </div>
        </div>
        <div id="roomCreationMap" style="opacity: 0.5;" class="roomCreationModule multiplayerHostSettings">
          <p>Selected Map:</p>
          <p id="multiplayerMapDisplay">Default</p>
        </div>
        <div id="hostCodeArea" class="multiplayerHostCodeArea">
          <div id="roomCodeDisplayArea">
            <p>Join with code:</p>
            <h1 id="roomCodeDisplay">Default</h1>
          </div>
          <div id="teamsDisplay" class="roomCreationModule multiplayerHostSettings">
            <p id="teamsDisplayText">Nothing to show</p>
            <p id="smallJoinCounter">0</p>
          </div>
          <div id="friendsInviteDisplay" class="roomCreationModule multiplayerHostSettings">
            <div id="roomCreationFriendsBox" class="roomCreationFriendsBox">
              <!-- online players will be added here programmatically -->
            </div>
          </div>
        </div>
        <div class="multiplayerHostSubmitArea">
          <div id="innerSubmitAreaBlock">
            <button id="roomcodeLink" class="copyLinkButton standardButton white">
              <img id="linkIcon" class="socialIcon" src="/img/link_icon.png" alt="copy link" />
            </button>
            <button id="multiplayerHost" class="standardButton">Create room</button>
          </div>
        </div>
      </div>
    </div>
    <div id="multiplayerWindowDuel" style="display: none;">
      <div class="multiplayerJoinAlign">
        <p id="multiplayerDuelInfo" class="multiplayerDuelStatus">Status OK</p>
        <button id="multiplayerDuelRetry" class="standardButton">Try Again</button>
      </div>
    </div>
    <button
      id="multiplayerSelectorClose"
      class="standardButton white closeButton"
      onclick={() => {
        playSound("basic_button");
        multiplayerPopup.set(false);
      }}>Close</button
    >
    <button id="multiplayerSelectorBack" class="standardButton white closeButton" stlye="display: none">Back</button>
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
    transition:
      opacity 250ms ease,
      filter 250ms ease;
  }

  .multiplayerInputInfo {
    font-size: 17px;
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
    background-color: rgba(255, 255, 255, 0.1);
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
    height: fit-content;
    padding-inline: 10px;
  }

  #linkIcon {
    vertical-align: -1px;
  }

  #multiplayerHost {
    padding: 0 20px;
    margin: 0;
    height: 36.5px;
  }

  .multiplayerHostSubmitArea {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    padding-bottom: 5px;
  }

  .multiplayerHostCodeArea {
    display: none;
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

  :global(.multiplayerDuelStatus.loading) {
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

  /* ticker */
  .tickerText {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 5px;
    padding-left: 10px;
    padding-right: 10px;
    text-align: center;
    border-radius: 10px;
    font-size: 20px;
    min-width: 50px;
  }

  .tickerNote {
    font-size: 20px;
  }

  .ticker {
    display: flex;
    gap: 10px;
    border-radius: 10px;
    justify-content: left;
    padding: 5px;
    width: fit-content;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
    background-color: rgba(255, 255, 255, 0.2);
  }
</style>

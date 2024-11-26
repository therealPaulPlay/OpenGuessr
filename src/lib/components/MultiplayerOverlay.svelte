<!-- Multiplayer Overlay which shows a table with Results, shows the players in the room etc. -->
<script>
  import {
    multiplayerOverlay,
    multiplayerOverlayTitle,
    rematchButtonEnabled,
    rematchButtonVisible,
    leaveMatchButtonVisible,
    overlayTitleElement,
    multiplayerTableArray,
    teamAmount,
    peerId,
  } from "$lib/stores/context-specific/multiplayerStore";
  import Badge from "$lib/components/Badge.svelte";
  import { leaveMultiplayerRound, multiplayerRematch } from "$lib/logic/multiplayerLogic";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { playSound } from "$lib/utils/soundManager";
  import { get } from "svelte/store";
</script>

<div
  id="multiplayerFade"
  style:opacity={$multiplayerOverlay ? "1" : "0"}
  style:pointer-events={$multiplayerOverlay ? "auto" : "none"}
>
  <h1 id="multiplayerTitle" bind:this={$overlayTitleElement}>{$multiplayerOverlayTitle}</h1>
  <div id="multiplayerTable">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    {#if $multiplayerTableArray.length > 0}
      {#if $teamAmount > 1}
        <!-- Teams version -->
        {#each $multiplayerTableArray as team}
          {#each team.players as [entryPeerId, username, level, score, teamIndex, id, badge]}
            <div
              class="multiplayerOverlayEntry"
              class:yourMultiplayerOverlay={entryPeerId && entryPeerId == get(peerId)}
              style:background={"linear-gradient(90deg, transparent 60%, " + team.color + ")"}
            >
              <div class="multiplayerEntryPlayerInfo">
                <div
                  class="multiplayerEntryPlayerName"
                  class:entryNotClickable={!id}
                  role="cell"
                  tabindex="0"
                  onclick={() => {
                    if (id) {
                      loadProfileFromId(id, true);
                    }
                  }}
                >
                  {username} (Lvl. {level})
                  <div class="multiplayerBadge">
                    <Badge interactive={false} display={true} id={badge} />
                  </div>
                </div>
                <div class="multiplayerEntryPlayerScore">Score: {score.toLocaleString()}</div>
              </div>
            </div>
          {/each}
        {/each}
      {:else}
        <!-- No teams version -->
        {#each $multiplayerTableArray as [entryPeerId, username, level, score, teamIndex, id, badge]}
          <div class="multiplayerOverlayEntry" class:yourMultiplayerOverlay={entryPeerId && entryPeerId == get(peerId)}>
            <div class="multiplayerEntryPlayerInfo">
              <div
                class="multiplayerEntryPlayerName"
                class:entryNotClickable={!id}
                role="cell"
                tabindex="0"
                onclick={() => {
                  if (id) {
                    loadProfileFromId(id, true);
                  }
                }}
              >
                {username} (Lvl. {level})
                <div class="multiplayerBadge">
                  <Badge interactive={false} display={true} id={badge} />
                </div>
              </div>
              <div class="multiplayerEntryPlayerScore">Score: {score.toLocaleString()}</div>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
  {#if $rematchButtonVisible}
    <button
      id="endMultiplayerRematchButton"
      class="standardButton"
      class:buttonDisabled={!$rematchButtonEnabled}
      onclick={() => {
        playSound("basic_button");
        multiplayerRematch();
      }}>Play again</button
    >
  {/if}
  {#if $leaveMatchButtonVisible}
    <button
      id="endMultiplayerRoundButton"
      class="standardButton"
      onclick={() => {
        playSound("basic_button");
        leaveMultiplayerRound();
      }}>Leave</button
    >
  {/if}
</div>

<style>
  #multiplayerFade {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    z-index: 4;
    transition: opacity 250ms ease;
    overflow: hidden;
    backdrop-filter: blur(50px);
    -webkit-backdrop-filter: blur(50px);
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
    pointer-events: none;
    user-select: none;
  }

  #multiplayerTitle {
    overflow: hidden;
    white-space: nowrap;
    transition:
      opacity 250ms ease,
      transform 250ms ease,
      color 250ms ease;
    color: white;
  }

  @keyframes multiplayerTitleWin {
    0% {
      transform: scale(1);
      color: white;
    }

    20% {
      transform: scale(1.1);
      color: rgb(255, 225, 133);
    }

    70% {
      color: rgb(255, 233, 165);
      transform: scale(1.1);
    }

    100% {
      transform: scale(1);
      color: white;
    }
  }

  @keyframes multiplayerTitleLose {
    0% {
      transform: scale(1);
      color: white;
    }

    20% {
      transform: scale(0.95);
      color: rgb(241, 104, 104);
    }

    70% {
      transform: scale(0.95);
      color: rgb(184, 48, 48);
    }

    100% {
      transform: scale(1);
      color: white;
    }
  }

  #multiplayerFade h1 {
    font-size: 50px;
    text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
    margin-bottom: 20px;
  }

  :global(#multiplayerFade p),
  :global(#multiplayerTable p) {
    font-size: 30px;
    text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.25);
  }

  #multiplayerTable {
    display: flex;
    justify-content: safe center;
    align-items: safe flex-start;
    width: 50%;
    min-width: 350px;
    max-width: 750px;
    font-size: 25px;
    max-height: 350px;
    overflow-x: hidden;
    overflow-y: auto;
    flex-direction: column;
    gap: 5px;
  }

  .multiplayerOverlayEntry {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    margin-bottom: 5px;
    width: 100%;
  }

  .yourMultiplayerOverlay {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .multiplayerEntryPlayerInfo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
    padding-inline: 20px;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 50px;
  }

  .multiplayerEntryPlayerName {
    flex: 1;
    transition: opacity 250ms ease;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
  }

  .multiplayerEntryPlayerName:hover {
    opacity: 0.5 !important;
  }

  .entryNotClickable {
    pointer-events: none;
  }

  .multiplayerEntryPlayerScore {
    margin-left: 10px;
  }

  .buttonDisabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>

<script>
  import { multiplayerStatus } from "$lib/stores/context-specific/multiplayerStore";
  import { playSound } from "$lib/utils/soundManager";
  import { joinRoom } from "$lib/logic/multiplayerLogic";

  let roomCodeInput = $state("");
</script>

<svelte:head>
  <title>Join</title>
</svelte:head>

<div class="main-container">
  <div class="inputCenterBox">
    <div class="multiplayerJoinField">
      <p id="multiplayerJoinInfo" class="multiplayerInputInfo">{$multiplayerStatus || "Input a room code."}</p>
      <input type="text" class="multiplayerInput" placeholder="Room code" bind:value={roomCodeInput} />
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

<style>
  .main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 50dvh;
  }

  .buttonDisabled {
    pointer-events: none !important;
    opacity: 0.5;
  }

  .inputCenterBox {
    margin-top: auto;
    display: flex;
    align-items: center;
    flex-direction: column;
    width: 100%;
    max-width: 500px;
  }

  .multiplayerInput {
    width: calc(100% - 60px);
    border-radius: 10px;
    min-height: 50px;
    padding-inline: 20px;
  }

  .multiplayerJoinField {
    width: calc(100% - 20px);
    padding: 10px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    flex-wrap: wrap;
    display: flex;
    gap: 10px;
  }

  #multiplayerJoin {
    min-height: 50px;
    border-radius: 10px;
    padding-inline: 50px;
  }

  .multiplayerInputInfo {
    padding: 0;
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    width: calc(100% - 40px);
    text-overflow: ellipsis;
    padding-inline: 20px;
    font-size: 20px;
  }
</style>

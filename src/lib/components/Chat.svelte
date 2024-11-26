<script>
  import { chatHTML, chatVisible } from "$lib/stores/context-specific/multiplayerStore";
  import { manuallySendChat } from "$lib/utils/chatFunctions";
  import { playSound } from "$lib/utils/soundManager";

  let multiplayerChatMessages = $state();
  let inputValue = $state();

  chatHTML.subscribe((value) => {
    try {
      if (multiplayerChatMessages) {
        setTimeout(() => {
          multiplayerChatMessages.scrollTop = multiplayerChatMessages.scrollHeight;
        }, 100);
      }
    } catch (error) {
      console.error("Error setting chat box scroll value:", error);
    }
  });
</script>

<div id="multiplayerChat" style:display={$chatVisible ? "" : "none"}>
  <div id="multiplayerChatMessages" bind:this={multiplayerChatMessages}>
    <p id="multiplayerMessageBox" bind:innerHTML={$chatHTML} contenteditable="false"></p>
  </div>
  <div id="bottomMultiplayerChatArea">
    <input
      maxlength="100"
      type="text"
      id="multiplayerMessageInput"
      placeholder="Type your message..."
      bind:value={inputValue}
      onkeydown={(event) => {
        if (event.key == "Enter") {
          event.preventDefault();
          manuallySendChat(inputValue);
          inputValue = "";
        }
      }}
    />
    <button
      id="multiplayerSendButton"
      class="standardButton"
      onclick={() => {
        playSound("basic_button");
        manuallySendChat(inputValue);
        inputValue = "";
      }}>Send</button
    >
  </div>
</div>

<style>
  #multiplayerChat {
    width: 300px;
    height: 20%;
    max-height: 250px;
    min-height: 150px;
    border-radius: 10px;
    overflow: hidden;
    position: fixed;
    left: 10px;
    bottom: 75px;
    flex-direction: column;
    align-items: center;
    display: flex;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
    font-size: 20px;
    z-index: 10;
  }

  #bottomMultiplayerChatArea {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
  }

  #multiplayerChatMessages {
    height: 100%;
    width: 100%;
    overflow-y: scroll;
    display: flex;
    scrollbar-width: none;
    flex-direction: column;
    margin-top: 5px;
  }

  #multiplayerMessageBox {
    color: white;
    margin: 10px;
    line-height: 1.7;
  }

  #multiplayerSendButton {
    height: 37px;
    margin: 8px;
    margin-left: 8px;
    padding-inline: 12px;
    font-size: 20px;
  }

  #multiplayerMessageBox {
    margin-top: auto;
  }

  #multiplayerMessageInput {
    padding: 10px;
    border: none;
    border-radius: 5px;
    font-size: 20px;
    height: 17px;
    overflow: scroll;
    text-wrap: wrap;
    flex-grow: 1;
    margin: 8px;
    margin-right: 0px;
  }

  @media all and (max-width: 1200px) {
    /* Chat doesn't fit on smaller screens */
    #multiplayerChat {
      display: none;
    }
  }
</style>

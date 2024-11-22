<script>
  import { discordPopup } from "$lib/stores/uiStore";
  import { setUserXP } from "$lib/utils/setUserXP";
  import Popup from "./Popup.svelte";
  import { playSound } from "$lib/utils/soundManager";

  function clickJoin() {
    playSound("basic_button");
    window.open("https://discord.gg/CSc3MbDrZ8", "_blank").focus();
    
    setTimeout(async function () {
      closePopup();
      await setUserXP(Number(localStorage.getItem("experience")) + 7500);
    }, 200);
  }

  function closePopup() {
    discordPopup.set(false);
    localStorage.setItem("discordPopup", "true");
  }
</script>

{#if $discordPopup}
  <Popup socialPopup="true">
    <div class="popup-title">
      <h1 id="socialHeader">Join the community</h1>
    </div>
    <p>
      Join now and get <span class="experienceHighlight">7,500 XP</span>
      in return!
    </p>
    <iframe
      id="discordWidget"
      title="Discord Widget"
      width="350"
      height="500"
      allowtransparency="true"
      frameborder="0"
      src="https://discord.com/widget?id=1221841177863651499&theme=dark"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
    ></iframe>
    <button
      id="socialPopupClose"
      onclick={() => {
        playSound("basic_button");
        closePopup();
      }}
      class="standardButton white closeButton">Close</button
    >
    <button id="socialPopupJoin" class="discordButton standardButton closeButton" onclick={clickJoin}>
      Join
      <img src="/img/discord.png" class="socialIcon" alt="Discord Icon" />
    </button>
  </Popup>
{/if}

<style>
  #socialPopupJoin {
    background-color: #8e44f0;
  }

  #discordWidget {
    margin-top: 30px;
    margin-bottom: 30px;
    height: 100%;
    width: 100%;
    min-height: 300px;
  }

  #socialPopupClose {
    float: left;
  }
</style>

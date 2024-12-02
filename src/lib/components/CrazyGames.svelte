<!-- This component handles the SDK stuff, and checks if the crazy-games query is being used -->
<script>
  import { onMount } from "svelte";
  import {
    isHost,
    roomLocked,
    peerId,
    roundAmount,
    roundLength,
    hostStage,
    currentScreen,
  } from "$lib/stores/context-specific/multiplayerStore";
  import { adsDisabled, crazyGames, preventExitPopup } from "$lib/stores/context-specific/platformSettingsStore";
  import { multiplayerPopup } from "$lib/stores/uiStore";
  import { createRoom } from "$lib/logic/multiplayerLogic";
  import { get } from "svelte/store";

  onMount(async () => {
    try {
      let urlParams = new URLSearchParams(window.location.search);
      let crazyGamesEnabled = urlParams.get("crazy-games");

      if (crazyGamesEnabled) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
            script.onload = () => {
              resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });

          await window.CrazyGames.SDK.init(); // Initialize SDK
          window.CrazyGames.SDK.game.gameplayStart(); // Start the gameplay
        } catch (error) {
          console.error("Error loading CrazyGames SDK:", error);
        }

        // Platform settings
        adsDisabled.set(true);
        preventExitPopup.set(true);

        // Enable platform
        crazyGames.set(true);

        if (window.CrazyGames.SDK.game.isInstantJoin) {
          multiplayerPopup.set(true);
          // Timeout, as toggling the popup causes the screen and stage to reset
          setTimeout(() => {
            currentScreen.set("host");
            hostStage.set(2); // Go to second stage of multiplayer popup
            createRoom(get(roundAmount), get(roundLength)); // Create room
          }, 150);
        }

        // Add listener to multiplayer state to display friend invite thingie
        roomLocked.subscribe((value) => {
          if (!value && $isHost) {
            const roomId = get(peerId).replace("openguessr_", "");

            const link = window.CrazyGames.SDK.game.showInviteButton({
              join: roomId,
            });
          } else {
            window.CrazyGames.SDK.game.hideInviteButton();
          }
        });
      }
    } catch {}
  });
</script>

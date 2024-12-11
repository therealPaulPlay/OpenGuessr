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
  import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
  import {
    adsDisabled,
    crazyGames,
    preventExitPopup,
    disableExternalLinks,
  } from "$lib/stores/context-specific/platformSettingsStore";
  import { multiplayerPopup } from "$lib/stores/uiStore";
  import { createRoom } from "$lib/logic/multiplayerLogic";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
  import { get } from "svelte/store";

  onMount(async () => {
    try {
      let urlParams = new URLSearchParams(window.location.search);
      let crazyGamesEnabled = urlParams.get("crazy-games");

      if (crazyGamesEnabled) {
        // Platform settings
        adsDisabled.set(true);
        preventExitPopup.set(true);
        disableExternalLinks.set(true);

        // Enable platform
        crazyGames.set(true);

        // Load and initialize SDK
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

          await window.CrazyGames.SDK.init();
          window.CrazyGames.SDK.game.loadingStart();

          setTimeout(() => {
            window.CrazyGames.SDK.game.loadingStop();
            window.CrazyGames.SDK.game.gameplayStart();

            if (window.CrazyGames.SDK.game.isInstantJoin) {
              multiplayerPopup.set(true);
              // Timeout, as toggling the popup causes the screen and stage to reset
              setTimeout(() => {
                currentScreen.set("host");
                hostStage.set(2); // Go to second stage of multiplayer popup
                createRoom(get(roundAmount), get(roundLength)); // Create room
              }, 150);
            }
          }, 150);
        } catch (error) {
          console.error("Error loading CrazyGames SDK:", error);
        }

        // Automatic signup / login (if user is not authenticated)
        authenticateWithCrazyGames();

        // Attach auth listener for if the user signs up mid play
        window.CrazyGames.SDK.user.addAuthListener(authenticateWithCrazyGames);

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

        resultScreenEnabled.subscribe((value) => {
          if (value) {
            window.CrazyGames.SDK.game.gameplayStop();
          } else {
            window.CrazyGames.SDK.game.gameplayStart();
          }
        });
      }
    } catch {}
  });

  // This will attempt registration and/or login only using a crazy games id.
  async function authenticateWithCrazyGames() {
    if ($isAuthenticated) return; // Exit if user is already authenticated (e.g. with bearer token from openguessr.com)

    let token;

    try {
      token = await window.CrazyGames.SDK.user.getUserToken();
    } catch (e) {
      console.error("Error obtaining CrazyGames Token (likely, user is not logged in):", e);
      return;
    }

    try {
      const response = await fetch("https://accounts.openguessr.com/accounts/cg-authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Set content type to JSON
        },
        body: JSON.stringify({
          crazyGamesToken: token, // Send the token in the body
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const data = await response.json();

      // Store login information
      localStorage.setItem("id", data.id);
      localStorage.setItem("bearer", data.token);

      // Now, set UI status and fetch user info
      checkAuthenticationStatus();
    } catch (error) {
      console.error("Error authenticating with CrazyGames:", error);
    }
  }
</script>

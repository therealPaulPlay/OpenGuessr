// Go from the Result screen back to the main View, the start
import { loadingScreenVisible } from "$lib/stores/uiStore";
import { toggleStreakRestoreWindow } from "$lib/stores/context-specific/toggleStreakRestoreStore";
import { socialPopupProbability } from "$lib/utils/socialPopupProbability";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { multiplayer, singleplayer } from "$lib/stores/modeStore";
import { sendMessageToAll, showMultiplayerRoundResults, clearAutoSkipTimeout } from "$lib/logic/multiplayerLogic";
import { shrinkMapIfMobile } from "$lib/utils/shrinkMinimapIfMobile";
import { isHost } from "$lib/stores/context-specific/multiplayerStore";
import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
import { get } from "svelte/store";

let alreadyTransitioning = false;

export function transitionToStart() {
  if (!alreadyTransitioning) {
    alreadyTransitioning = true;

    setTimeout(() => {
      alreadyTransitioning = false;
    }, 400);

    loadingScreenVisible.set(true);
    get(toggleStreakRestoreWindow)(0, true);
    disableResultScreen();
    checkGenerationTypeAndGenerate();

    setTimeout(socialPopupProbability, 650);

    if (get(multiplayer)) clearAutoSkipTimeout();
    // Notify peers that the next round has begun
    if (get(isHost) && get(multiplayer)) {
      sendMessageToAll("closeResultScreen");
      showMultiplayerRoundResults(); // Show Overlay for peers and host
    }

    shrinkMapIfMobile();

    if (get(crazyGames)) potentialCrazyGamesAd(); // Crazy Games Ad

  } else {
    console.warn("Already transitioning to start!");
  }
}

let adIndex = 0;

function potentialCrazyGamesAd() {
  if (!get(singleplayer)) return;
  adIndex++;

  if (adIndex % 10 == 0) {
    try {
      window.CrazyGames.SDK.ad.requestAd("midgame");
    } catch (error) {
      console.error("Error showing crazy games midgame ad:", error);
    }
  }
}
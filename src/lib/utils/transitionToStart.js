// Go from the Result screen back to the main View, the start
import { loadingScreenVisible } from "$lib/stores/uiStore";
import { socialPopupProbability } from "$lib/utils/socialPopupProbability";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { multiplayer, singleplayer } from "$lib/stores/modeStore";
import { peer } from "$lib/stores/context-specific/multiplayerStore";
import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
import { get } from "svelte/store";

export function transitionToStart() {
  loadingScreenVisible.set(true);
  disableResultScreen();

  setTimeout(socialPopupProbability, 650);

  if (!get(multiplayer) || get(peer)?.isHost) checkGenerationTypeAndGenerate(); // Generate new location

  if (get(multiplayer)) {
    // Show Overlay for peers and host
    get(peer)?.updateStorage("showResult", false);
    get(peer)?.updateStorage("overlay", true);
    get(peer)?.updateStorage("overlayTitle", "Results from round " + get(peer)?.getStorage?.currentRound);
  }

  if (get(crazyGames)) potentialCrazyGamesAd(); // Crazy Games Ad
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
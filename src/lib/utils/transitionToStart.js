// Go from the Result screen back to the main View, the start
import { socialPopupProbability } from "$lib/utils/socialPopupProbability";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { multiplayer, singleplayer } from "$lib/stores/modeStore";
import { peer } from "$lib/stores/context-specific/multiplayerStore";
import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
import { get } from "svelte/store";

export function transitionToStart() {
  if (!get(multiplayer)) {
    checkGenerationTypeAndGenerate(); // Generate new location
    disableResultScreen();
  }

  if (get(multiplayer)) {
    get(peer)?.updateStorage("showResult", false);
  }

  if (get(crazyGames)) potentialCrazyGamesAd(); // Crazy Games Ad
  setTimeout(socialPopupProbability, 650); // Social Media CTA
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
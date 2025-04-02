// Go from the Result screen back to the main View, the start
import { socialPopupProbability } from "$lib/utils/socialPopupProbability";
import { checkGenerationTypeAndGenerate } from "$lib/logic/newLocation";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { multiplayer, singleplayer } from "$lib/stores/modeStore";
import { peer, roundAmount } from "$lib/stores/context-specific/multiplayerStore";
import { get } from "svelte/store";

export function transitionToStart() {
  if (!get(multiplayer)) {
    checkGenerationTypeAndGenerate(); // Generate new location
    disableResultScreen();
  }

  if (get(multiplayer)) {
    get(peer)?.updateStorage("showResult", false); // Disable result screen
    if (get(peer)?.getStorage?.currentRound < get(roundAmount)) get(peer).updateStorage("startRound", true); // Start new round
  }

  if (!get(multiplayer)) setTimeout(socialPopupProbability, 650); // Social Media CTA (too stressful in multiplayer)
}
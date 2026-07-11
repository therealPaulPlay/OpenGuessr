// Go from the result screen back to the main view, the start
import { checkGenerationTypeAndGenerate } from "$lib/utils/checkGenerationTypeAndGenerate";
import { disableResultScreen } from "$lib/utils/setResultScreen";
import { multiplayer } from "$lib/stores/modeStore";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { get } from "svelte/store";

export function transitionToStart() {
  if (!get(multiplayer)) {
    checkGenerationTypeAndGenerate(); // Generate new location
    disableResultScreen();
  }
  if (get(multiplayer)) get(socket)?.updateStorage("showResult", "set", false); // Disable result screen in multiplayer
}
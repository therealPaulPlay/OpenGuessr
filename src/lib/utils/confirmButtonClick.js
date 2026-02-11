// This executes when the user presses "Space" or the "Confirm" / "Guess" button
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore";
import { multiplayer } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { mapInteractive, mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore"
import { enableResultScreen } from "$lib/utils/setResultScreen";
import { get } from "svelte/store";
import { socket } from "$lib/stores/context-specific/multiplayerStore";

export function confirmButtonClicks() {
    continueText.set("Continue");

    if (!get(multiplayer)) enableResultScreen(get(mapPinLat), get(mapPinLng));
    else {
        playSound("lock_guess_in");
        mapInteractive.set(false);
        get(socket)?.sendRequest("confirmGuess");
    }

    confirmButtonActive.set(false); // Disable confirm button (make it greyed out) – will be re-enabled when placing pin
}
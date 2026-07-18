// This executes when the user presses "Space" or the "Confirm" / "Guess" button
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore";
import { multiplayer } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { mapInteractive } from "$lib/stores/context-specific/mapStore"
import { enableResultScreen } from "$lib/utils/setResultScreen";
import { get } from "svelte/store";
import { socket } from "$lib/stores/context-specific/multiplayerStore";
import { errorPopup } from "./errorHandling";

export function confirmButtonClicks() {
    continueText.set("Continue");

    if (!get(multiplayer)) enableResultScreen();
    else {
        playSound("lock_guess_in");
        mapInteractive.set(false);
        get(socket)?.sendRequest("confirmGuess").catch((error) => {
            errorPopup("Failed to confirm guess", "An error occured confirming the guess for multiplayer.", error.message);
            console.error("Error confirming guess for multiplayer:", error);
        });
    }

    confirmButtonActive.set(false); // Disable confirm button (make it greyed out) – will be re-enabled when placing pin
}
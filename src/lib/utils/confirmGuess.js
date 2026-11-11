import { multiplayer } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { enableResultScreen } from "$lib/utils/setResultScreen";
import { get } from "svelte/store";
import { socket } from "$lib/stores/context-specific/multiplayerStore";

export function confirmGuess() {
    if (!get(multiplayer)) enableResultScreen();
    else {
        playSound("lock_guess_in");
        get(socket)?.updateStorage("confirmedGuessClients", "array-add-unique", get(socket)?.id);
    }
}
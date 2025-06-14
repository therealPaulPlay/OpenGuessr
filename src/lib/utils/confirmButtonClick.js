// This executes when the user presses "Space" or the "Confirm" / "Guess" button
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore";
import { multiplayer, competition } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { mapVisible, mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore"
import { enableResultScreen } from "$lib/utils/setResultScreen";
import { stopCompetitionTimer } from "$lib/logic/competitionLogic";
import { get } from "svelte/store";
import { multiplayerStyle, socket } from "$lib/stores/context-specific/multiplayerStore";

export function confirmButtonClicks() {
    continueText.set("Continue");

    if (get(competition)) stopCompetitionTimer(); // If in competition, end round timer

    if (!get(multiplayer)) {
        enableResultScreen(get(mapPinLat), get(mapPinLng));
    } else {
        mapVisible.set(false);
        get(socket)?.updateStorageArray("confirmedArray", "add-unique", get(socket)?.id);
        if (get(multiplayerStyle) == "duel") get(socket)?.updateStorage("timeReducedOverlay", true); // Reduce time in duels
    }

    confirmButtonActive.set(false); // Disable confirm button (make it greyed out) – will be re-enabled when placing pin
}
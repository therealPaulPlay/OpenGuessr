// This executes when the user presses "Space" or the "Confirm" / "Guess" button
import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore";
import { multiplayer, competition } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { mapVisible, mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore"
import { enableResultScreen } from "$lib/utils/setResultScreen";
import { stopCompetitionTimer } from "$lib/logic/competitionLogic";
import { multiplayerStateToGuessed } from "$lib/logic/multiplayerLogic";
import { get } from "svelte/store";

export function confirmButtonClicks() {
    playSound("basic_button");
    continueText.set("Continue");

    if (get(competition)) stopCompetitionTimer(); // If in competition, end round timer

    if (!get(multiplayer)) {
        enableResultScreen(get(mapPinLat), get(mapPinLng));
    } else {
        mapVisible.set(false);
        if (get(confirmButtonActive)) multiplayerStateToGuessed();
    }

    confirmButtonActive.set(false); // Disable confirm button (make it greyed out) – will be re-enabled when placing pin
}
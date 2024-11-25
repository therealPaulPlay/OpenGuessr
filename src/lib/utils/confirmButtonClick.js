// This executes when the user presses "Space" or the "Confirm" / "Guess" button
import { confirmButtonActive, confirmButtonText } from "$lib/stores/context-specific/confirmButtonStore.js";
import { continueText } from "$lib/stores/context-specific/resultScreenStore";
import { multiplayer, competition } from "$lib/stores/modeStore";
import { playSound } from "$lib/utils/soundManager";
import { mapVisible, mapPinLat, mapPinLng } from "$lib/stores/context-specific/mapStore"
import { enableResultScreen } from "$lib/utils/setResultScreen";
// import { stopCompetitionTimer } from "../../../JS/competitionLogic"; // !TODO !CHANGE correct import
import { get } from "svelte/store";
// !TODO !CHANGE import multiplayerStateToGuessed();


export function confirmButtonClicks() {
    confirmButtonActive.set(false); // Disable confirm button – will be re-enabled when placing pin
    playSound("basic_button");
    continueText.set("Continue");

    if (get(competition)) {
        stopCompetitionTimer();
    }

    if (!get(multiplayer)) {
        enableResultScreen(get(mapPinLat), get(mapPinLng));
    } else {
        confirmButtonText.set("Wait...");
        mapVisible.set(false);

        multiplayerStateToGuessed();
    }
}
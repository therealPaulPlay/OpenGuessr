import { competitionResultId, competitionResultRating } from "$lib/stores/context-specific/competitionStore";
import { competitionResultPopup } from "$lib/stores/uiStore";

export function openCompetitionLeaderboard(id, displayRatingBox = false) {
    competitionResultId.set(id);
    competitionResultRating.set(displayRatingBox);
    competitionResultPopup.set(true);
}
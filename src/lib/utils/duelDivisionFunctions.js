// Ranked Duels logic and API
import { errorPopup } from "$lib/utils/errorHandling";
import { duelResultTitle } from "$lib/stores/context-specific/duelResultStore";
import { get } from "svelte/store";
import { duelResultPopup } from "$lib/stores/uiStore";
import { elo } from "$lib/stores/accountStore";
import { eloChange } from "$lib/stores/context-specific/duelResultStore";

export function calculateDivision(elo) {
    if (elo < 1200) return 4;      // V   (index 0 in the UI)
    if (elo < 1400) return 3;      // IV  (index 1 in the UI)
    if (elo < 1600) return 2;      // III (index 2 in the UI)
    if (elo < 2000) return 1;      // II  (index 3 in the UI)
    return 0;                       // I   (index 4 in the UI)
}

export const generateDuelUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Won = true means the player won, won = false means they lost
export async function sendDuelDivisionResult(won, uuid) {
    duelResultTitle.set(won ? "Victory!" : "Defeat!"); // Save the win state for later (the popup which triggers on websocket server response)

    try {
        const response = await fetch(`https://friends.openguessr.com/multiplayer/duel-elo-result/${uuid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("bearer")}`
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                result: won
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Duel submission error:', data.error);
            errorPopup("Duel division submission error", "Failed to submit duel division result.", data.error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('Failed to submit duel result:', error);
        errorPopup(
            'Duel submission error (Network)',
            'Failed to connect to server.',
            'Please check your internet connection and try again'
        );
        return false;
    }
}

export async function checkRankedLeavePenalty() {
    if (localStorage.getItem("activeDuel")) {
        // Timeout to avoid this triggering during a reload, causing the popup to show for a few milliseconds only
        setTimeout(async () => {
            const penalty = await applyLeavePenalty();
            localStorage.removeItem("activeDuel");

            // Show popup
            duelResultTitle.set("Leave penalty!");
            duelResultPopup.set(true);
            eloChange.set(Number(penalty));
            elo.set(get(elo) + get(eloChange));
            if (get(elo) < 0) elo.set(0); // Prevent elo from becoming negative (it won't on the server either)
        }, 1000);
    }
}

export function removeRankedLeavePenalty() {
    localStorage.removeItem("activeDuel");
}

// Penalty for players that leave duels, substracts Elo
async function applyLeavePenalty() {
    try {
        const response = await fetch('https://friends.openguessr.com/multiplayer/penalty', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('bearer')}`
            },
            body: JSON.stringify({ id: localStorage.getItem("id") })
        });

        if (!response.ok) {
            throw new Error('Failed to apply penalty with status' + response?.status);
        }

        const parsedResponse = await response.json();
        return parsedResponse.penalty;
    } catch (error) {
        console.error('Error applying duel leave penalty:', error);
        return false;
    }
};
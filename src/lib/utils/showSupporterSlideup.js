import { monthlySupportAmount, showSlideup } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";
import { supporterWindowIfAuthenticated } from "./showSupporterPopup";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { supporterLevel } from "$lib/stores/accountStore";
import { showResultScreenSlideup } from "./resultScreenSlideup";

export function supporterSlideupProbability() {
    if (!get(showSlideup) && Math.random() < 0.1 && get(supporterLevel) == 0) {
        getMonthlySupportedAmount();
        showResultScreenSlideup("Enjoy playing?", "Please consider supporting to unlock awesome benefits, including ad-free!", "Support", supporterWindowIfAuthenticated);
    }
}

async function getMonthlySupportedAmount() {
    if (get(monthlySupportAmount) != null) return get(monthlySupportAmount);

    try {
        const response = await fetch(get(apiUrl) + "/stripe/statistics/current-month", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error("Error occurred while loading monthly supported amount: " + response.status);
        } else {
            const data = await response.json();
            monthlySupportAmount.set(data.supported_amount);
        }
    } catch (error) {
        console.error("Network error occured trying to load monthly supported amount: " + error);
    }
}

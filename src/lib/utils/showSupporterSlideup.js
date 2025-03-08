
import { restoreOldStreak } from "$lib/logic/resultScoreLogic";
import { errorPopup } from "$lib/utils/errorHandling";
import { adsDisabled } from "$lib/stores/context-specific/platformSettingsStore";
import { initializeRewardedAd } from "$lib/utils/rewardedAds";
import { monthlySupportAmount, showSlideup, slideupButtonDisabled, slideupButtonText, slideupCallback, slideupText, slideupTitle } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";
import { supporterWindowIfAuthenticated } from "./showSupporterPopup";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { supporterLevel } from "$lib/stores/accountStore";

function showSupporterSlideup() {
    slideupCallback.set(supporterWindowIfAuthenticated);
    slideupButtonText.set("Support");
    slideupButtonDisabled.set(false);
    slideupTitle.set("Enjoy playing?");
    showSlideup.set(true);
    slideupText.set(`Please consider supporting to unlock awesome benefits, including ad-free!`);
    getMonthlySupportedAmount();
}

export function supporterSlideupProbability() {
    if (Math.random() < 0.1 && get(supporterLevel) == 0) {
        showSupporterSlideup();
    }
}

async function getMonthlySupportedAmount() {
    if (get(monthlySupportAmount) != null) return get(monthlySupportAmount);

    try {
        const response = await fetch(get(accountUrl) + "/stripe/statistics/current-month", {
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

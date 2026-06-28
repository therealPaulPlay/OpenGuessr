import { monthlySupportAmount } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { isAuthenticated, supporterLevel } from "$lib/stores/accountStore";
import { showResultScreenSlideup } from "./resultScreenSlideup";
import { goto } from "$app/navigation";
import { signupPrompt } from "./signupPrompt";
import { showConfirmPopup } from "./confirmPopup";

export function supporterSlideupProbability() {
    if (Math.random() < 0.05 && get(supporterLevel) == 0) {
        getMonthlySupportedAmount();
        showResultScreenSlideup("Enjoy playing?", "Consider supporting to unlock awesome perks including ad-free!", "Support", () => {
            if (get(isAuthenticated)) {
                goto("/shop#supporter");
                return true;
            } else {
                showConfirmPopup(
                    "Account required",
                    "A one-time payment requires an account so you can enjoy supporter perks on all your devices.",
                    () => {
                        signupPrompt();
                    },
                    null,
                    null,
                    "Sign up",
                );
                return false;
            }
        });
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

import { monthlySupportAmount, showSlideup } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";
import { apiUrl, discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";
import { isAuthenticated, supporterLevel } from "$lib/stores/accountStore";
import { purchasesDisabled } from "$lib/stores/context-specific/platformSettingsStore";
import { showResultScreenSlideup } from "./resultScreenSlideup";
import { goto } from "$app/navigation";
import { signupPrompt } from "./signupPrompt";
import { showConfirmPopup, showNotification } from "openguessr-ui";
import { addUserXP } from "./updateUserXP";

// Supporter ----------------------------------------------
export function supporterSlideupProbability() {
    if (Math.random() < 0.05 && get(supporterLevel) == 0 && !get(purchasesDisabled) && localStorage.getItem("supporterSlideup") === null) {
        getMonthlySupportedAmount();
        showResultScreenSlideup("Enjoy playing?", "Consider supporting to unlock awesome perks including ad-free!", "Support", () => {
            // supporterSlideup in the success path is not set to true since the user is not guaranteed to support
            if (get(isAuthenticated)) goto("/shop#supporter");
            else {
                showConfirmPopup(
                    "Account required",
                    "A one-time payment requires an account so you can enjoy supporter perks on all your devices.",
                    () => {
                        signupPrompt(() => goto("/shop#supporter"));
                    },
                    "Sign up",
                );
            }
        }, null, null, null, () => {
            localStorage.setItem("supporterSlideup", true);
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
        console.error("Network error occurred trying to load monthly supported amount: " + error);
    }
}

// Discord ------------------------------------
const XP_AMOUNT = 7500;

export function discordSlideupProbability() {
    if (Math.random() < 0.05 && localStorage.getItem("discordSlideup") === null) {
        showResultScreenSlideup("Join our Discord", null, "Join", () => {
            window.open(get(discordInviteUrl), "_blank");

            setTimeout(function () {
                localStorage.setItem("discordSlideup", "true");
                showSlideup.set(false);

                // Register callback for when document becomes visible again to show notification of xp gain
                const visibilityChangeCallback = async () => {
                    if (document.visibilityState === "visible") {
                        document.removeEventListener("visibilitychange", visibilityChangeCallback);
                        await addUserXP(XP_AMOUNT);
                        showNotification(`Thank you. Granted ${XP_AMOUNT.toLocaleString()} XP.`);
                    }
                }
                document.addEventListener("visibilitychange", visibilityChangeCallback);
            }, 250);
        }, null, null, `<p>Join the OpenGuessr community on Discord and receive <span style="color: rgb(243, 233, 255); text-shadow: 0 0 10px #8e44f0">${XP_AMOUNT.toLocaleString()} XP</span>.</p>`, () => {
            localStorage.setItem("discordSlideup", "true");
        });
    }
}

// App rating ------------------------------
export function appRatingSlideupProbability() {
    if (Math.random() < 0.05 && localStorage.getItem("appRatingSlideup") === null) {
        showResultScreenSlideup("Like the app?", "Please take a second to give us a rating.", "Rate app", () => {
            // Bring up native app rating prompt
            const plugin = window.Capacitor?.Plugins?.AppReview;
            if (plugin) {
                plugin.requestReview().catch((error) => {
                    console.error("Failed to bring up rating dialog:", error);
                });
            } else console.warn("App review plugin not available");
            localStorage.setItem("appRatingSlideup", true); // Always tick off, the only real failure mode is that the app rating prompt has been brought up too many times
            showSlideup.set(false);
        }, null, null, null, () => {
            localStorage.setItem("appRatingSlideup", true);
        });
    }
}
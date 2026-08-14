import { showSlideup } from "$lib/stores/context-specific/resultScreenSlideupStore";
import { get } from "svelte/store";
import { showResultScreenSlideup } from "./resultScreenSlideup";
import { addUserXP } from "./updateUserXP";
import { showNotification } from "./notifications";
import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";

const XP_AMOUNT = 7500;

export function discordSlideupProbability() {
    if (Math.random() < 0.05 && localStorage.getItem("discordSlideup") === null) {
        showResultScreenSlideup("Join our Discord", null, "Join", () => {
            window.open(get(discordInviteUrl), "_blank")?.focus();

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

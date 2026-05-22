import { supporterBoost, supporterBoostText } from "$lib/stores/context-specific/resultScreenStore";
import { get } from "svelte/store";

let supporterBoostTimeout;

export async function supporterXpBoostAnimation(factor) {
    if (!get(supporterBoost) || !get(supporterBoostText)) return;

    get(supporterBoost).style.opacity = "0";
    get(supporterBoostText).classList.remove("supporterBoostTextMove");
    clearTimeout(supporterBoostTimeout);

    await new Promise(resolve => {
        supporterBoostTimeout = setTimeout(resolve, 1500);
    });

    if (!get(supporterBoost) || !get(supporterBoostText)) return;

    factor -= 1;
    factor = Math.round(factor * 100);
    factor += "%";

    get(supporterBoostText).textContent = factor + " Experience Boost";

    get(supporterBoost).style.opacity = "1";
    get(supporterBoostText).classList.add("supporterBoostTextMove");

    supporterBoostTimeout = setTimeout(() => {
        if (!get(supporterBoost) || !get(supporterBoostText)) return;
        get(supporterBoost).style.opacity = "0";
        get(supporterBoostText).classList.remove("supporterBoostTextMove");
    }, 2000);
}
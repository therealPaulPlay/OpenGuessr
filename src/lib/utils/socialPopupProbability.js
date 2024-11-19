// Popup with CTA to follow on Socials, has a certain probability of showing up when this function is called

import { discordPopup } from "$lib/stores/UIStore";
import { isAuthenticated } from "$lib/stores/accountStore";
import { get } from "svelte/store";

export function socialPopupProbability() {
    if (get(isAuthenticated) && localStorage.getItem("discordPopup") == null) {
        const randomNumber = Math.floor(Math.random() * 3);

        if (randomNumber === 0) {
            discordPopup.set(true);
        }
    }
}
// Show supporter popup if the user is signed in, otherwise display sign-in prompt
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { isAuthenticated } from "$lib/stores/accountStore";
import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
import { signupPrompt } from "$lib/utils/signupPrompt";
import { get } from "svelte/store";

export function supporterWindowIfAuthenticated() {
    if (get(isAuthenticated)) {
        supporterPopupVisible.set(true);
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
}
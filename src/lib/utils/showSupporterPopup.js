// Show supporter popup if the user is signed in, otherwise display sign-in prompt
import { showConfirmPopup } from "$lib/utils/confirmPopup";
import { isAuthenticated } from "$lib/stores/accountStore";
import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
import { signupPopup } from "$lib/stores/uiStore";
import { get } from "svelte/store";

export function supporterWindowIfAuthenticated() {
    if (get(isAuthenticated)) {
        supporterPopupVisible.set(true);
        return true;
    } else {
        showConfirmPopup(
            "Account required",
            "To support OpenGuessr with a one-time payment, an account is required, so that you can enjoy amazing supporter benefits on all devices!",
            () => {
                signupPopup.set(true);
            },
            undefined,
            undefined,
            undefined,
            "Sign up",
        );
        return false;
    }
}
// Display the signup popup on main platform, but platform-specific signup in other scenarios
import { signupPopup } from "$lib/stores/uiStore";
import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
import { get } from "svelte/store";
import { postSignupAction } from "$lib/stores/context-specific/signupStore";

export async function signupPrompt(triggerAfter = () => { }) {
    postSignupAction.set(triggerAfter);
    if (get(crazyGames)) {
        // Show crazy games signup - this will trigger an event, that is being listened for in CrazyGames.svelte
        try {
            await window.CrazyGames.SDK.user.showAuthPrompt();
        } catch (error) {
            console.error("Error showing CrazyGames signup:", error);
        }
    } else signupPopup.set(true);
}
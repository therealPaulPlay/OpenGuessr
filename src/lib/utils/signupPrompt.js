// Display the signup popup on main platform, but platform-specific signup in other scenarios
import { signupPopup } from "$lib/stores/uiStore";
import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
import { get } from "svelte/store";

export async function signupPrompt() {
    // Show crazy games signup - this will trigger an event, that is being listened for in CrazyGames.svelte
    if (get(crazyGames)) {
        try {
            const user = await window.CrazyGames.SDK.user.showAuthPrompt();
            return;
        } catch (error) {
            console.error("Error showing CrazyGames signup:", error);
            return;
        }
    }

    signupPopup.set(true);
}
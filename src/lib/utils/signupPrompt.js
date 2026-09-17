// Display the signup popup on main platform, but platform-specific signup in other scenarios
import { signupPopup } from "$lib/stores/uiStore";
import { crazyGames, y8Games, playgama } from "$lib/stores/context-specific/platformSettingsStore";
import { get } from "svelte/store";
import { postSignupAction } from "$lib/stores/context-specific/signupStore";
import { authenticateWithPlaygama, playgamaLoginSupported } from "$lib/components/Playgama.svelte";

export async function signupPrompt(triggerAfter = () => { }) {
    postSignupAction.set(triggerAfter);

    switch (true) {
        case (get(crazyGames)): {
            try {
                // Shows CrazyGames login prompt
                await window.CrazyGames.SDK.user.showAuthPrompt();
            } catch (error) {
                console.error("Error showing CrazyGames login:", error);
            }
            break;
        }
        case (get(y8Games)): {
            try {
                await window.Y8SDK.login(); // Shows Y8 login prompt
            } catch (error) {
                console.error("Error showing Y8 login:", error);
            }
            break;
        }
        case (get(playgama) && playgamaLoginSupported()): {
            try {
                await window.bridge.player.authorize(); // Playgama auth prompt
                await authenticateWithPlaygama();
            } catch (error) {
                console.error("Error showing Playgama login:", error);
            }
            break;
        }
        default: signupPopup.set(true); // Shows default OpenGuessr signup prompt
    }
}
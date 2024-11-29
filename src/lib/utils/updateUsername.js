import { username } from "$lib/stores/accountStore";
import { updateUsername } from "$lib/logic/userAPI";
import { profileName } from "$lib/stores/context-specific/profileStore";

export async function updateProfileUsername(newUsername) {
    if (newUsername) {
        await updateUsername(localStorage.getItem("bearer"), localStorage.getItem("id"), newUsername, "index").then((isOk) => {
            if (isOk) {
                username.set(newUsername);
                profileName.set(newUsername); // Update username in profile popup
            }
        });
    }
}
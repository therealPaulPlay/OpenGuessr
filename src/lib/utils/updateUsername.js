import { username } from "$lib/stores/accountStore";
import { updateUsername } from "$lib/logic/accountAPI";
import { profileData } from "$lib/stores/context-specific/profileStore";

export async function updateProfileUsername(newUsername) {
    if (newUsername) {
        await updateUsername(localStorage.getItem("bearer"), localStorage.getItem("id"), newUsername, "index").then((isOk) => {
            if (isOk) {
                username.set(newUsername);
                profileData.update((value) => {
                    const data = value;
                    data["username"] = newUsername;
                    return data;
                });
            }
        });
    }
}
import { username } from "$lib/stores/accountStore";
import { profileData } from "$lib/stores/context-specific/profileStore";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { errorPopup } from "./errorHandling";

export async function updateProfileUsername(newUsername) {
    if (newUsername) {
        await updateUsername(newUsername).then((isOk) => {
            if (isOk) {
                username.set(newUsername);
                profileData.update((value) => {
                    const data = value;
                    data.username = newUsername;
                    return data;
                });
            }
        });
    }
}

async function updateUsername(requestedUsername) {
    try {
        const response = await fetch(`${get(apiUrl)}/accounts/update/username`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("bearer")}`
            },
            body: JSON.stringify({
                id: localStorage.getItem("id"),
                username: requestedUsername
            })
        });

        // Check if the response is successful
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("username", data['user']['userName']);
            return true;

        } else {
            let responseError = response.status;
            try {
                const data = await response.json();
                if (data.error) responseError = data.error;
            } catch { }
            throw new Error(responseError);
        }

    } catch (error) {
        console.error('Failed to update username:', error);
        errorPopup("Failed to update username", "An error occured trying to update the username.", error.message);
        return false;
    }
}
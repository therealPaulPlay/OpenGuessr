import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { get } from "svelte/store";

export async function getProfileData(id) {

    try {
        const response = await fetch(get(accountUrl) + `/accounts/profile/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data;

        } else {
            throw new Error(response.status);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        errorPopup("Error loading profile", "Couldn't load the user's profile.", error, false, false);
    }
}
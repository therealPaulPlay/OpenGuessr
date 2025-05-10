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
            console.error('Failed to load profile:', response.status);
            errorPopup("Failed to get profile data", "Couldn't load the user's profile.", response.status, false, false);
        }
    } catch (error) {
        console.error('Error occurred loading profile: ', error);
        errorPopup("Error occured loading profile:", "Couldn't load the user's profile due to network error.", error, false, false);
    }
}
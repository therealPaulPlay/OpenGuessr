import { errorPopup } from "$lib/utils/errorHandling";

export async function getProfileData(id) {

    try {
        const response = await fetch(`https://accounts.openguessr.com/accounts/profile/${id}`, {
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
        console.error('Error occurred while fetching the user: ', error);
        errorPopup("Error occured while loading Profile data", "Couldn't load the user's profile due to network error.", error, false, false);
    }
}
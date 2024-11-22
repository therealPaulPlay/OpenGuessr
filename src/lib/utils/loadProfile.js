import { profilePopup } from "$lib/stores/uiStore";
import { profileData, profileName, profileExperience, joinedDate, profileId, profileSupporterLevel } from "$lib/stores/context-specific/profileStore";
import { errorPopup } from "$lib/utils/errorHandling";

export async function loadProfileFromId(id, view) {
    try {
        const response = await fetch(`https://accounts.openguessr.com/accounts/profile/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        // Check if the response is successful
        if (response.ok) {
            const data = await response.json();

            // Save data
            if (data) {
                profileData.set(data.profileData);
                profileName.set(data.username);
                profileExperience.set(data.experience);
                joinedDate.set(data.joinedDate);
                profileSupporterLevel.set(data.supporterLevel);
                profileId.set(id);
            }

            // Show profile Popup
            if (view) {
                profilePopup.set(true);
            }

            return true;

        } else {
            console.error('Failed to load profile:', response.status);
            errorPopup("Failed to load profile", "Couldn't load the user's profile.", response.status, false, false);
            return false;
        }
    } catch (error) {
        console.error('Error occurred while fetching the user: ', error);
        errorPopup("Error occured while loading Profile", "Couldn't load the user's profile due to network error.", error, false, false);
        return false;
    }
}